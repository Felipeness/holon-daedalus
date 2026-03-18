import { Effect } from 'effect'
import { EntityId, EventType } from '@holon/shared'
import type { Entity } from '../types.js'
import { EventStore } from '../event-store.js'
import { EntityStore } from '../entity-store.js'

export const projectEntities = () =>
  Effect.gen(function* () {
    const eventStore = yield* EventStore
    const entityStore = yield* EntityStore
    const events = yield* eventStore.getEvents()

    const entityEvents = events.filter(
      (e) => e.type === EventType.ENTITY_CREATED || e.type === EventType.ENTITY_UPDATED,
    )

    const aggregated = new Map<string, Entity>()

    for (const event of entityEvents) {
      const existing = aggregated.get(event.aggregateId)

      if (event.type === EventType.ENTITY_CREATED) {
        const payload = event.payload as {
          type: string
          name: string
          properties: Record<string, unknown>
        }
        aggregated.set(event.aggregateId, {
          id: EntityId(event.aggregateId),
          type: payload.type,
          name: payload.name,
          properties: payload.properties,
          createdAt: event.createdAt,
          updatedAt: event.createdAt,
        })
      } else if (event.type === EventType.ENTITY_UPDATED && existing) {
        const payload = event.payload as { properties: Record<string, unknown> }
        aggregated.set(event.aggregateId, {
          ...existing,
          properties: { ...existing.properties, ...payload.properties },
          updatedAt: event.createdAt,
        })
      }
    }

    for (const entity of aggregated.values()) {
      yield* entityStore.upsert(entity)
    }

    return aggregated.size
  })
