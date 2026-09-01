import { describe, expect, it } from 'vitest'
import { AGENT_LABELS, agentLabelItem, planAgentLabels, staleAgentLabels } from '../src/agent-label.ts'

describe('planAgentLabels', () => {
  it('adds the label for the verdict the Review reached', () => {
    expect(planAgentLabels('READY', [])).toEqual({
      add: AGENT_LABELS.READY,
      remove: [],
    })
  })

  it('clears the verdict a head commit no longer holds', () => {
    expect(planAgentLabels('BLOCKED', ['wolfstar-agent-ready'])).toEqual({
      add: AGENT_LABELS.BLOCKED,
      remove: ['wolfstar-agent-ready'],
    })
  })

  it('writes nothing when the pull request already states this verdict', () => {
    expect(planAgentLabels('PENDING', ['wolfstar-agent-pending'])).toEqual({ add: null, remove: [] })
  })

  it('leaves every label the service does not own', () => {
    const plan = planAgentLabels('READY', ['bug', 'wolfstar-agent-auto-merge', 'wolfstar-agent-review'])

    expect(plan.remove).toEqual([])
    expect(plan.add).toEqual(AGENT_LABELS.READY)
  })

  it('removes a second verdict GitHub reports in any casing', () => {
    expect(planAgentLabels('READY', ['Wolfstar-Agent-Blocked', 'wolfstar-agent-ready']).remove).toEqual([
      'Wolfstar-Agent-Blocked',
    ])
  })

  it('takes the Running label off the moment a verdict lands', () => {
    expect(planAgentLabels('READY', ['wolfstar-agent-running'])).toEqual({
      add: AGENT_LABELS.READY,
      remove: ['wolfstar-agent-running'],
    })
  })

  it('takes the temporary Review route off when an outcome lands', () => {
    expect(planAgentLabels('READY', ['wolfstar-agent-review-required'])).toEqual({
      add: AGENT_LABELS.READY,
      remove: ['wolfstar-agent-review-required'],
    })
  })

  it('takes a stale verdict off the moment an agent starts working', () => {
    expect(planAgentLabels('RUNNING', ['wolfstar-agent-blocked'])).toEqual({
      add: AGENT_LABELS.RUNNING,
      remove: ['wolfstar-agent-blocked'],
    })
  })

  it('gives each verdict its own label, so two verdicts never read alike', () => {
    const names = Object.values(AGENT_LABELS).map((label) => label.name)

    expect(new Set(names).size).toBe(names.length)
  })

  it('replaces one issue triage result without removing the Running label', () => {
    expect(planAgentLabels('READY_TO_SPEC', ['wolfstar-agent-running', 'wolfstar-agent-needs-info'])).toEqual({
      add: AGENT_LABELS.READY_TO_SPEC,
      remove: ['wolfstar-agent-needs-info'],
    })
  })

  it('keeps the issue triage result while Issue work runs', () => {
    expect(planAgentLabels('RUNNING', ['wolfstar-agent-ready-to-implement'])).toEqual({
      add: AGENT_LABELS.RUNNING,
      remove: [],
    })
  })

  it('keeps the pull request triage result separate from the manual Review override', () => {
    expect(
      planAgentLabels('ADVERSARIAL_REVIEW_REQUIRED', ['wolfstar-agent-review-skipped', 'wolfstar-agent-review', 'bug']),
    ).toEqual({
      add: AGENT_LABELS.ADVERSARIAL_REVIEW_REQUIRED,
      remove: ['wolfstar-agent-review-skipped'],
    })
    expect(AGENT_LABELS.ADVERSARIAL_REVIEW_REQUIRED.name).toBe('wolfstar-agent-review-required')
  })

  it('never replaces a manual Review override with Review skipped', () => {
    expect(
      planAgentLabels('ADVERSARIAL_REVIEW_SKIPPED', ['wolfstar-agent-review', 'wolfstar-agent-review-skipped']),
    ).toEqual({ add: null, remove: ['wolfstar-agent-review-skipped'] })
  })
})

describe('staleAgentLabels', () => {
  it('names every verdict on a pull request no Review has answered for', () => {
    expect(
      staleAgentLabels(['wolfstar-agent-ready', 'wolfstar-agent-blocked', 'wolfstar-agent-review-required']),
    ).toEqual(['wolfstar-agent-ready', 'wolfstar-agent-blocked', 'wolfstar-agent-review-required'])
  })

  it('leaves every label the service does not own', () => {
    expect(staleAgentLabels(['bug', 'wolfstar-agent-auto-merge', 'wolfstar-agent-review'])).toEqual([])
  })

  it('names nothing when the pull request carries no verdict, so nothing is written', () => {
    expect(staleAgentLabels([])).toEqual([])
  })
})

describe('agentLabelItem', () => {
  const repositoryMapping = { github: 'wolfstar-project/example' } as never

  it('reads the pull request a Task belongs to', () => {
    expect(agentLabelItem({ repositoryMapping, pullRequestNumber: 24 })).toEqual({ repositoryMapping, itemNumber: 24 })
  })

  it('reads the issue a Task belongs to', () => {
    expect(agentLabelItem({ repositoryMapping, issueNumber: 9 })).toEqual({ repositoryMapping, itemNumber: 9 })
  })

  it('names no Item for a Routine run, so a clock writes no label', () => {
    expect(agentLabelItem({ id: 'routine-run', state: { fence: 1 } })).toBeUndefined()
  })
})
