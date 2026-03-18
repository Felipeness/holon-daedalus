import { describe, it, expect } from 'vitest'
import { Effect, Layer } from 'effect'
import { IdempotencyKey, createCorrelationContext, EventType } from '@holon/shared'
import { EventStore, InMemoryEventStoreLive } from '../src/event-store.js'

const testLayer = InMemoryEventStoreLive

const runTest = <E, A>(effect: Effect.Effect<A, E, EventStore>) =>
  Effect.runPromise(Effect.provide(effect, testLayer))

const makeEvent = (aggregateId: string, version: number) => ({
  aggregateId,
  type: EventType.ENTITY_CREATED,
  version,
  payload: { name: 'test' },
  idempotencyKey: IdempotencyKey(`key-${aggregateId}-${version}`),
  correlationContext: createCorrelationContext('test'),
})

describe('EventStore', () => {
  it('appends and retrieves events', async () => {
    const result = await runTest(
      Effect.gen(function* () {
        const store = yield* EventStore
        const event = yield* store.appendEvent(makeEvent('agg-1', 1))

        expect(event.id).toBeDefined()
        expect(event.aggregateId).toBe('agg-1')
        expect(event.version).toBe(1)
        expect(event.createdAt).toBeInstanceOf(Date)

        const all = yield* store.getEvents()
        expect(all).toHaveLength(1)
        expect(all[0]!.aggregateId).toBe('agg-1')
      }),
    )
  })

  it('retrieves events by aggregate id', async () => {
    await runTest(
      Effect.gen(function* () {
        const store = yield* EventStore
        yield* store.appendEvent(makeEvent('agg-1', 1))
        yield* store.appendEvent(makeEvent('agg-2', 1))
        yield* store.appendEvent(makeEvent('agg-1', 2))

        const agg1Events = yield* store.getEventsByAggregate('agg-1')
        expect(agg1Events).toHaveLength(2)

        const agg2Events = yield* store.getEventsByAggregate('agg-2')
        expect(agg2Events).toHaveLength(1)
      }),
    )
  })

  it('rejects optimistic concurrency conflict', async () => {
    const result = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const store = yield* EventStore
        yield* store.appendEvent(makeEvent('agg-1', 1))
        yield* store.appendEvent(makeEvent('agg-1', 1))
      }).pipe(Effect.provide(testLayer)),
    )

    expect(result._tag).toBe('Failure')
  })
})
