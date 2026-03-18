export const HOLON_NAME = 'intake' as const

export { classifyTask } from './task-classifier.js'
export { assembleContext } from './context-assembler.js'
export { decompose } from './decomposer.js'

export type {
  TaskClassification,
  TaskClassificationType,
  Complexity,
  Risk,
  ContextPayload,
  SubTask,
} from './types.js'

export { TaskClassificationType, Complexity, Risk } from './types.js'
