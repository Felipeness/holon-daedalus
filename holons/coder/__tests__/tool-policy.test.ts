import { describe, it, expect } from 'vitest'
import { getToolPolicy, type CoderTaskType, type ToolName } from '../domain/tool-policy.js'

describe('getToolPolicy', () => {
  const cases: ReadonlyArray<{
    readonly taskType: CoderTaskType
    readonly expectedTools: readonly ToolName[]
    readonly forbiddenTools: readonly ToolName[]
  }> = [
    {
      taskType: 'feature',
      expectedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
      forbiddenTools: [],
    },
    {
      taskType: 'bug',
      expectedTools: ['Read', 'Edit', 'Bash', 'Glob', 'Grep'],
      forbiddenTools: ['Write'],
    },
    {
      taskType: 'refactor',
      expectedTools: ['Read', 'Edit', 'Glob', 'Grep'],
      forbiddenTools: ['Bash', 'Write'],
    },
    {
      taskType: 'review',
      expectedTools: ['Read', 'Glob', 'Grep'],
      forbiddenTools: ['Write', 'Edit', 'Bash'],
    },
  ] as const

  it.each(cases)(
    'returns correct tools for $taskType tasks',
    ({ taskType, expectedTools, forbiddenTools }) => {
      const policy = getToolPolicy(taskType)

      expect(policy.taskType).toBe(taskType)
      expect(policy.allowedTools).toEqual(expectedTools)

      for (const tool of forbiddenTools) {
        expect(policy.allowedTools).not.toContain(tool)
      }
    },
  )

  it('returns a readonly policy that cannot be mutated', () => {
    const policy = getToolPolicy('feature')

    expect(Object.isFrozen(policy)).toBe(true)
    expect(Object.isFrozen(policy.allowedTools)).toBe(true)
  })
})
