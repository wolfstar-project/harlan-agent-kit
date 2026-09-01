export function isReviewRerunCommand(body: string): boolean {
  const command = body.trim()
  return /^\/wolfstar-agent\s+rerun$/i.test(command) || /^@wolfstar-github-agent(?:\[bot\])?\s+rerun$/i.test(command)
}
