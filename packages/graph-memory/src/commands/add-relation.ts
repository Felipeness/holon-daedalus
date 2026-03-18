import { Effect, Ref } from 'effect'
import {
  RelationId,
  IdempotencyKey,
  EventType,
  type EntityId,
  type CorrelationContext,
} from '@holon/shared'
import type { Relation } from '../types.js'
import { EventStore } from '../event-store.js'
import { IdempotencyStore } from '../idempotency.js'
import { RelationStore } from '../relation-store.js'

export interface AddRelationInput {
  readonly fromId: EntityId
  readonly toId: EntityId
  readonly type: string
  readonly weight?: number
  readonly properties?: Record<string, unknown>
  readonly idempotencyKey: IdempotencyKey
  readonly correlationContext: CorrelationContext
}

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000

export const addRelation = (input: AddRelationInput) =>
  Effect.gen(function* () {
    const idempotencyStore = yield* IdempotencyStore
    const eventStore = yield* EventStore
    const relationStore = yield* RelationStore

    const cached = yield* idempotencyStore.get(input.idempotencyKey)
    if (cached) {
      return cached as Relation
    }

    const existing = yield* relationStore.findByFromToType(input.fromId, input.toId, input.type)
    if (existing) {
      const updated: Relation = {
        ...existing,
        weight: input.weight ?? existing.weight,
        properties: { ...existing.properties, ...(input.properties ?? {}) },
      }
      yield* relationStore.upsert(updated)
      yield* idempotencyStore.set(input.idempotencyKey, updated, IDEMPOTENCY_TTL_MS)
      return updated
    }

    const relationId = RelationId(crypto.randomUUID())
    const now = new Date()

    yield* eventStore.appendEvent({
      aggregateId: relationId,
      type: EventType.RELATION_CREATED,
      version: 1,
      payload: {
        fromId: input.fromId,
        toId: input.toId,
        relationType: input.type,
        weight: input.weight ?? 1.0,
        properties: input.properties ?? {},
      },
      idempotencyKey: input.idempotencyKey,
      correlationContext: input.correlationContext,
    })

    const relation: Relation = {
      id: relationId,
      fromId: input.fromId,
      toId: input.toId,
      type: input.type,
      weight: input.weight ?? 1.0,
      properties: input.properties ?? {},
      createdAt: now,
    }

    yield* relationStore.upsert(relation)
    yield* idempotencyStore.set(input.idempotencyKey, relation, IDEMPOTENCY_TTL_MS)

    return relation
  })
