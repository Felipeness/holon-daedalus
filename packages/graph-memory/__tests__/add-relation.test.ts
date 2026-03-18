import { describe, it, expect } from 'vitest'
import { Effect, Layer } from 'effect'
import { EntityId, IdempotencyKey, createCorrelationContext } from '@holon/shared'
import { addRelation } from '../src/commands/add-relation.js'
import { InMemoryEventStoreLive } from '../src/event-store.js'
import { InMemoryIdempotencyStoreLive } from '../src/idempotency.js'
import { InMemoryRelationStoreLive } from '../src/relation-store.js'

const testLayer = Layer.mergeAll(
  InMemoryEventStoreLive,
  InMemoryIdempotencyStoreLive,
  InMemoryRelationStoreLive,
)

describe('addRelation', () => {
  it('creates a relation between entities', async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const relation = yield* addRelation({
          fromId: EntityId('entity-1'),
          toId: EntityId('entity-2'),
          type: 'DEPENDS_ON',
          weight: 0.8,
          properties: { reason: 'import' },
          idempotencyKey: IdempotencyKey('rel-1'),
          correlationContext: createCorrelationContext('test'),
        })

        expect(relation.id).toBeDefined()
        expect(relation.fromId).toBe('entity-1')
        expect(relation.toId).toBe('entity-2')
        expect(relation.type).toBe('DEPENDS_ON')
        expect(relation.weight).toBe(0.8)
      }).pipe(Effect.provide(testLayer)),
    )
  })

  it('returns cached relation on idempotency hit', async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const key = IdempotencyKey('rel-dedup-1')
        const ctx = createCorrelationContext('test')

        const first = yield* addRelation({
          fromId: EntityId('e-1'),
          toId: EntityId('e-2'),
          type: 'REFERENCES',
          idempotencyKey: key,
          correlationContext: ctx,
        })

        const second = yield* addRelation({
          fromId: EntityId('e-1'),
          toId: EntityId('e-2'),
          type: 'REFERENCES',
          idempotencyKey: key,
          correlationContext: ctx,
        })

        expect(second.id).toBe(first.id)
      }).pipe(Effect.provide(testLayer)),
    )
  })

  it('upserts existing relation with same from/to/type', async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const ctx = createCorrelationContext('test')

        const first = yield* addRelation({
          fromId: EntityId('e-a'),
          toId: EntityId('e-b'),
          type: 'DEPENDS_ON',
          weight: 0.5,
          idempotencyKey: IdempotencyKey('upsert-1'),
          correlationContext: ctx,
        })

        const second = yield* addRelation({
          fromId: EntityId('e-a'),
          toId: EntityId('e-b'),
          type: 'DEPENDS_ON',
          weight: 0.9,
          idempotencyKey: IdempotencyKey('upsert-2'),
          correlationContext: ctx,
        })

        expect(second.fromId).toBe(first.fromId)
        expect(second.toId).toBe(first.toId)
        expect(second.weight).toBe(0.9)
      }).pipe(Effect.provide(testLayer)),
    )
  })
})
