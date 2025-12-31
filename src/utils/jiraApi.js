export async function fetchJiraIssues() {
  const response = await fetch('/api/issues')

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`API ${response.status}: ${message || response.statusText}`)
  }

  const payload = await response.json()
  const issues = Array.isArray(payload) ? payload : (payload.issues || [])

  return issues.map((issue) => ({
    key: issue.key || '-',
    issueType: issue.issueType || issue.type || '-',
    summary: issue.summary || '-',
    description: issue.description || '-',
    priority: issue.priority || '-',
    status: issue.status || '-',
    assignee: issue.assignee || 'Unassigned',
    team: issue.team || 'Team 1',
    created: issue.created || null,
    due: issue.due || null,
    duration: issue.duration === undefined ? '' : issue.duration,
  }))
}
