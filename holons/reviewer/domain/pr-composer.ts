export interface PRInput {
  readonly taskDescription: string
  readonly changesSummary: string
  readonly testResults: string
  readonly jiraTicket?: string
  readonly taskType: 'feat' | 'fix' | 'chore' | 'refactor' | 'docs' | 'test' | 'perf'
  readonly scope?: string
}

export interface PRContent {
  readonly title: string
  readonly body: string
}

const buildTitle = (input: PRInput): string => {
  const scope = input.scope ? `(${input.scope})` : ''
  const description = input.taskDescription
    .toLowerCase()
    .replace(/[.!?]+$/, '')
    .slice(0, 72 - input.taskType.length - scope.length - 2)

  return `${input.taskType}${scope}: ${description}`
}

const buildBody = (input: PRInput): string => {
  const jiraLink = input.jiraTicket
    ? `https://superlogica.atlassian.net/browse/${input.jiraTicket}`
    : 'N/A'

  return [
    '## Summary',
    '',
    input.taskDescription,
    '',
    '## Changes',
    '',
    input.changesSummary,
    '',
    '## Testing',
    '',
    input.testResults,
    '',
    '## Jira',
    '',
    input.jiraTicket ? `[${input.jiraTicket}](${jiraLink})` : 'N/A (no ticket)',
  ].join('\n')
}

export const composePR = (input: PRInput): PRContent => ({
  title: buildTitle(input),
  body: buildBody(input),
})
