import type { Options, SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import type { AgentEvent, AgentProvider, AgentTokenUsage } from './agent-provider.ts'
import { query } from '@anthropic-ai/claude-agent-sdk'
import { agentProviderFailureReason, agentTextEvent, extractJsonObject } from './agent-provider.ts'

type ClaudeQuery = (input: { prompt: string; options?: Options }) => AsyncIterable<SDKMessage>

export interface ClaudeProviderOptions {
  queryClaude?: ClaudeQuery
}

interface ContentBlock {
  type?: unknown
  id?: unknown
  name?: unknown
  text?: unknown
  thinking?: unknown
  tool_use_id?: unknown
  content?: unknown
  is_error?: unknown
  input?: Record<string, unknown>
}

const fileTools = new Set(['Edit', 'MultiEdit', 'NotebookEdit', 'Write'])
const webTools = new Set(['WebFetch', 'WebSearch'])

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function blocks(value: unknown): ContentBlock[] {
  return Array.isArray(value)
    ? (value.filter((block) => typeof block === 'object' && block !== null) as ContentBlock[])
    : []
}

function contentText(value: unknown): string {
  if (typeof value === 'string') return value
  return blocks(value)
    .map((block) => stringValue(block.text) || stringValue(block.content))
    .filter(Boolean)
    .join('\n')
}

function toolCommand(name: string, input: Record<string, unknown>): string {
  const argument =
    stringValue(input.command) ||
    stringValue(input.pattern) ||
    stringValue(input.file_path) ||
    stringValue(input.path) ||
    stringValue(input.query)
  return argument === '' ? name : `${name} ${argument}`
}

function toolPath(input: Record<string, unknown>): string {
  return stringValue(input.file_path) || stringValue(input.path) || stringValue(input.notebook_path)
}

function tokenCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0
}

/** Reads the complete Claude query usage, including work delegated to subagents. */
export function claudeAgentUsage(message: SDKMessage): Extract<AgentTokenUsage, { _tag: 'Available' }> | undefined {
  if (message.type !== 'result') return undefined
  const modelUsage = Object.values(message.modelUsage ?? {})
  if (modelUsage.length > 0) {
    return modelUsage.reduce<Extract<AgentTokenUsage, { _tag: 'Available' }>>(
      (total, usage) => ({
        _tag: 'Available',
        input: total.input + tokenCount(usage.inputTokens),
        cachedInput: total.cachedInput + tokenCount(usage.cacheReadInputTokens),
        cacheWrite: total.cacheWrite + tokenCount(usage.cacheCreationInputTokens),
        output: total.output + tokenCount(usage.outputTokens),
        reasoning: total.reasoning,
      }),
      { _tag: 'Available', input: 0, cachedInput: 0, cacheWrite: 0, output: 0, reasoning: 0 },
    )
  }
  const usage = message.usage as Record<string, unknown>
  return {
    _tag: 'Available',
    input: tokenCount(usage.input_tokens),
    cachedInput: tokenCount(usage.cache_read_input_tokens),
    cacheWrite: tokenCount(usage.cache_creation_input_tokens),
    output: tokenCount(usage.output_tokens),
    reasoning: 0,
  }
}

/** Maps one Claude Agent SDK message to the provider-neutral event stream. */
export function claudeAgentEvents(message: SDKMessage, commands = new Map<string, string>()): AgentEvent[] {
  if (message.type === 'system' && message.subtype === 'init')
    return [{ _tag: 'SessionStarted', sessionId: message.session_id }]

  if (message.type === 'assistant') {
    const events: AgentEvent[] = []
    for (const block of blocks(message.message.content)) {
      if (block.type === 'thinking') {
        const thinking = stringValue(block.thinking)
        if (thinking !== '') events.push({ _tag: 'Reasoning', text: thinking })
        continue
      }
      if (block.type === 'text') {
        const text = stringValue(block.text)
        if (text !== '') {
          const progress = agentTextEvent(text)
          if (progress._tag === 'Progress') events.push(progress)
        }
        continue
      }
      if (block.type !== 'tool_use') continue
      const name = stringValue(block.name)
      const input = block.input ?? {}
      if (webTools.has(name)) {
        events.push({ _tag: 'WebSearch' })
        continue
      }
      if (fileTools.has(name)) {
        const path = toolPath(input)
        if (path !== '')
          events.push({ _tag: 'FileChanged', changes: [{ path, kind: name === 'Write' ? 'add' : 'update' }] })
        continue
      }
      const id = stringValue(block.id)
      const command = toolCommand(name, input)
      if (id !== '') commands.set(id, command)
      events.push({ _tag: 'CommandStarted', command })
    }
    return events
  }

  if (message.type === 'user') {
    const events: AgentEvent[] = []
    for (const block of blocks(message.message.content)) {
      if (block.type !== 'tool_result') continue
      const id = stringValue(block.tool_use_id)
      const command = commands.get(id)
      if (command === undefined) continue
      commands.delete(id)
      events.push({
        _tag: 'CommandCompleted',
        command,
        output: contentText(block.content),
        exitCode: block.is_error === true ? 1 : 0,
      })
    }
    return events
  }

  if (message.type !== 'result') return []
  if (message.subtype !== 'success' || message.is_error) {
    const reason = message.subtype === 'success' ? message.result : message.errors.join(' ') || message.subtype
    return [{ _tag: 'Failed', reason: agentProviderFailureReason('claude', reason) }]
  }
  const response =
    message.structured_output === undefined
      ? extractJsonObject(message.result)
      : JSON.stringify(message.structured_output)
  return [
    { _tag: 'Message', text: response },
    { _tag: 'Usage', usage: claudeAgentUsage(message) as Extract<AgentTokenUsage, { _tag: 'Available' }> },
    { _tag: 'TurnCompleted' },
  ]
}

/** Runs Claude Code with local tools, structured output, and resumable sessions. */
export function createClaudeProvider(options: ClaudeProviderOptions = {}): AgentProvider {
  const queryClaude = options.queryClaude ?? query
  return {
    name: 'claude',
    runTurn: (request) =>
      (async function* () {
        const abortController = new AbortController()
        const abort = () => abortController.abort()
        request.signal.addEventListener('abort', abort, { once: true })
        if (request.signal.aborted) abortController.abort()
        const effort =
          request.reasoningEffort === undefined || request.reasoningEffort === 'none'
            ? undefined
            : (request.reasoningEffort as NonNullable<Options['effort']>)
        const sdkOptions: Options = {
          abortController,
          allowDangerouslySkipPermissions: true,
          cwd: request.workspace,
          model: request.model,
          outputFormat: { type: 'json_schema', schema: request.outputSchema as Record<string, unknown> },
          permissionMode: 'bypassPermissions',
          settingSources: ['user', 'project', 'local'],
          ...(effort === undefined ? {} : { effort }),
          ...(request.reasoningEffort === 'none' ? { thinking: { type: 'disabled' as const } } : {}),
          ...(request.sessionId === null ? {} : { resume: request.sessionId }),
        }
        const commands = new Map<string, string>()
        try {
          for await (const message of queryClaude({ prompt: request.prompt, options: sdkOptions })) {
            for (const event of claudeAgentEvents(message, commands)) yield event
          }
        } catch (error) {
          yield {
            _tag: 'Failed',
            reason: agentProviderFailureReason(
              'claude',
              error instanceof Error ? error.message : 'Claude Code stopped unexpectedly.',
            ),
          }
        } finally {
          request.signal.removeEventListener('abort', abort)
        }
      })(),
  }
}
