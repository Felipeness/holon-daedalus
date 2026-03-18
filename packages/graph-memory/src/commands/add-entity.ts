import { Effect } from 'effect'
import { EntityId, IdempotencyKey, EventType, type CorrelationContext } from '@holon/shared'
import type { Entity } from '../types.js'
import { EventStore } from '../event-store.js'
import { IdempotencyStore } from '../idempotency.js'

export interface AddEntityInput {
  readonly type: string
  readonly name: string
  readonly properties: Record<string, unknown>
  readonly idempotencyKey: IdempotencyKey
  readonly correlationContext: CorrelationContext
}

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000

export const addEntity = (input: AddEntityInput) =>
  Effect.gen(function* () {
    const idempotencyStore = yield* IdempotencyStore
    const eventStore = yield* EventStore

    const cached = yield* idempotencyStore.get(input.idempotencyKey)
    if (cached) {
      return cached as Entity
    }

    const entityId = EntityId(crypto.randomUUID())
    const now = new Date()

    yield* eventStore.appendEvent({
      aggregateId: entityId,
      type: EventType.ENTITY_CREATED,
      version: 1,
      payload: {
        type: input.type,
        name: input.name,
        properties: input.properties,
      },
      idempotencyKey: input.idempotencyKey,
      correlationContext: input.correlationContext,
    })

    const entity: Entity = {
      id: entityId,
      type: input.type,
      name: input.name,
      properties: input.properties,
      createdAt: now,
      updatedAt: now,
    }

    yield* idempotencyStore.set(input.idempotencyKey, entity, IDEMPOTENCY_TTL_MS)

    return entity
  })
