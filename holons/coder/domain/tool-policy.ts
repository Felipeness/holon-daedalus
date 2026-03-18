export const ToolName = {
  Read: 'Read',
  Write: 'Write',
  Edit: 'Edit',
  Bash: 'Bash',
  Glob: 'Glob',
  Grep: 'Grep',
} as const
export type ToolName = (typeof ToolName)[keyof typeof ToolName]

export const CoderTaskType = {
  feature: 'feature',
  bug: 'bug',
  refactor: 'refactor',
  review: 'review',
} as const
export type CoderTaskType = (typeof CoderTaskType)[keyof typeof CoderTaskType]

export interface ToolPolicy {
  readonly taskType: CoderTaskType
  readonly allowedTools: readonly ToolName[]
}

const toolPolicies: Record<CoderTaskType, readonly ToolName[]> = {
  feature: [ToolName.Read, ToolName.Write, ToolName.Edit, ToolName.Bash, ToolName.Glob, ToolName.Grep],
  bug: [ToolName.Read, ToolName.Edit, ToolName.Bash, ToolName.Glob, ToolName.Grep],
  refactor: [ToolName.Read, ToolName.Edit, ToolName.Glob, ToolName.Grep],
  review: [ToolName.Read, ToolName.Glob, ToolName.Grep],
} as const

export const getToolPolicy = (taskType: CoderTaskType): Readonly<ToolPolicy> => {
  const policy: ToolPolicy = {
    taskType,
    allowedTools: Object.freeze([...toolPolicies[taskType]]),
  }
  return Object.freeze(policy)
}
