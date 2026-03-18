import { Effect } from 'effect'
import { classifyTask } from '../domain/task-classifier.js'
import { assembleContext } from '../domain/context-assembler.js'
import { decompose } from '../domain/decomposer.js'
import type { TaskClassification, ContextPayload, SubTask } from '../domain/types.js'

export interface IntakeResult {
  readonly classification: TaskClassification
  readonly context: ContextPayload
  readonly subtasks: ReadonlyArray<SubTask>
}

export const processTask = (taskDescription: string): Effect.Effect<IntakeResult> =>
  Effect.gen(function* () {
    const classification = yield* classifyTask(taskDescription)
    const context = yield* assembleContext(taskDescription)
    const subtasks = yield* decompose(taskDescription)

    return { classification, context, subtasks }
  })
