import { Effect } from 'effect'
import { EventType, EntityNotFound, type EntityId, type CorrelationContext } from '@holon/shared'
import { IdempotencyKey } from '@holon/shared'
import type { Entity } from '../types.js'
import { EventStore } from '../event-store.js'
import { EntityStore } from '../entity-store.js'

export interface UpdatePropertiesInput {
  readonly entityId: EntityId
  readonly properties: Record<string, unknown>
  readonly correlationContext: CorrelationContext
}

export const updateProperties = (input: UpdatePropertiesInput) =>
  Effect.gen(function* () {
    const eventStore = yield* EventStore
    const entityStore = yield* EntityStore

    const entity = yield* entityStore.getById(input.entityId)
    if (!entity) {
      return yield* new EntityNotFound({ id: input.entityId })
    }

    const events = yield* eventStore.getEventsByAggregate(input.entityId)
    const nextVersion = events.length + 1
    const idempotencyKey = IdempotencyKey(
      `update-${input.entityId}-${nextVersion}-${Date.now()}`,
    )

    yield* eventStore.appendEvent({
      aggregateId: input.entityId,
      type: EventType.ENTITY_UPDATED,
      version: nextVersion,
      payload: { properties: input.properties },
      idempotencyKey,
      correlationContext: input.correlationContext,
    })

    const updated: Entity = {
      ...entity,
      properties: { ...entity.properties, ...input.properties },
      updatedAt: new Date(),
    }

    yield* entityStore.upsert(updated)

    return updated
  })
