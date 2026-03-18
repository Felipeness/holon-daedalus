import { Effect } from 'effect'
import type { CorrelationContext } from '@holon/shared'

export interface SagaStep<A, E> {
  readonly name: string
  readonly execute: (ctx: CorrelationContext) => Effect.Effect<A, E>
  readonly compensate: (ctx: CorrelationContext) => Effect.Effect<void, never>
}

export interface SagaResult<A> {
  readonly success: boolean
  readonly result?: A
  readonly compensatedSteps: ReadonlyArray<string>
  readonly error?: unknown
}

export const runSaga = <A, E>(
  steps: ReadonlyArray<SagaStep<A, E>>,
  ctx: CorrelationContext,
): Effect.Effect<SagaResult<A>> =>
  Effect.gen(function* () {
    const completedSteps: SagaStep<A, E>[] = []
    let lastResult: A | undefined

    for (const step of steps) {
      const result = yield* Effect.exit(step.execute(ctx))

      if (result._tag === 'Failure') {
        const compensatedSteps: string[] = []
        for (const completed of [...completedSteps].reverse()) {
          yield* completed.compensate(ctx)
          compensatedSteps.push(completed.name)
        }

        return {
          success: false,
          compensatedSteps,
          error: result.cause,
        } satisfies SagaResult<A>
      }

      lastResult = result.value
      completedSteps.push(step)
    }

    return {
      success: true,
      result: lastResult,
      compensatedSteps: [],
    } satisfies SagaResult<A>
  })
