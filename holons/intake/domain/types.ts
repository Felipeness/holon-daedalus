import type { Brand } from 'effect'

export const TaskClassificationType = {
  FEATURE: 'feature',
  BUG: 'bug',
  REFACTOR: 'refactor',
  REVIEW: 'review',
  DOCS: 'docs',
  TEST: 'test',
} as const
export type TaskClassificationType =
  (typeof TaskClassificationType)[keyof typeof TaskClassificationType]

export const Complexity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const
export type Complexity = (typeof Complexity)[keyof typeof Complexity]

export const Risk = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const
export type Risk = (typeof Risk)[keyof typeof Risk]

export interface TaskClassification {
  readonly type: TaskClassificationType
  readonly complexity: Complexity
  readonly risk: Risk
}

export interface ContextPayload {
  readonly rawDescription: string
  readonly urls: ReadonlyArray<string>
  readonly filePaths: ReadonlyArray<string>
  readonly technologies: ReadonlyArray<string>
}

export type SubTaskId = number & Brand.Brand<'SubTaskId'>

export interface SubTask {
  readonly index: number
  readonly description: string
  readonly dependencies: ReadonlyArray<number>
}
