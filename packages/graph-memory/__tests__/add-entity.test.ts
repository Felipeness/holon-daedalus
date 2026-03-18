import { describe, it, expect } from 'vitest'
import { Effect, Layer } from 'effect'
import { IdempotencyKey, createCorrelationContext } from '@holon/shared'
import { addEntity } from '../src/commands/add-entity.js'
import { InMemoryEventStoreLive } from '../src/event-store.js'
import { InMemoryIdempotencyStoreLive } from '../src/idempotency.js'

const testLayer = Layer.mergeAll(InMemoryEventStoreLive, InMemoryIdempotencyStoreLive)

const runTest = <E, A>(effect: Effect.Effect<A, E, never>) => Effect.runPromise(effect)

describe('addEntity', () => {
  it('creates an entity and returns it', async () => {
    await runTest(
      Effect.gen(function* () {
        const entity = yield* addEntity({
          type: 'FILE',
          name: 'index.ts',
          properties: { path: '/src/index.ts', language: 'typescript' },
          idempotencyKey: IdempotencyKey('create-1'),
          correlationContext: createCorrelationContext('test'),
        })

        expect(entity.id).toBeDefined()
        expect(entity.type).toBe('FILE')
        expect(entity.name).toBe('index.ts')
        expect(entity.properties.path).toBe('/src/index.ts')
        expect(entity.createdAt).toBeInstanceOf(Date)
      }).pipe(Effect.provide(testLayer)),
    )
  })

  it('returns cached entity on idempotency hit', async () => {
    await runTest(
      Effect.gen(function* () {
        const key = IdempotencyKey('dedup-1')
        const ctx = createCorrelationContext('test')

        const first = yield* addEntity({
          type: 'FILE',
          name: 'first.ts',
          properties: {},
          idempotencyKey: key,
          correlationContext: ctx,
        })

        const second = yield* addEntity({
          type: 'FILE',
          name: 'should-be-ignored.ts',
          properties: {},
          idempotencyKey: key,
          correlationContext: ctx,
        })

        expect(second.id).toBe(first.id)
        expect(second.name).toBe('first.ts')
      }).pipe(Effect.provide(testLayer)),
    )
  })

  it('uses branded EntityId type', async () => {
    await runTest(
      Effect.gen(function* () {
        const entity = yield* addEntity({
          type: 'MODULE',
          name: 'shared',
          properties: {},
          idempotencyKey: IdempotencyKey('branded-1'),
          correlationContext: createCorrelationContext('test'),
        })

        expect(typeof entity.id).toBe('string')
        expect(entity.id.length).toBeGreaterThan(0)
      }).pipe(Effect.provide(testLayer)),
    )
  })
})
