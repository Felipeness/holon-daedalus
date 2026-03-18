import { Context, Effect, Layer, Ref } from 'effect'
import type { EventStoreError } from '@holon/shared'
import { EventStoreError as EventStoreErr } from '@holon/shared'
import type { GraphEvent } from './types.js'

export interface EventStoreService {
  readonly appendEvent: (
    event: Omit<GraphEvent, 'id' | 'createdAt'>,
  ) => Effect.Effect<GraphEvent, EventStoreError>
  readonly getEvents: () => Effect.Effect<ReadonlyArray<GraphEvent>, EventStoreError>
  readonly getEventsByAggregate: (
    aggregateId: string,
  ) => Effect.Effect<ReadonlyArray<GraphEvent>, EventStoreError>
}

export class EventStore extends Context.Tag('EventStore')<EventStore, EventStoreService>() {}

export const makeInMemoryEventStore = Effect.gen(function* () {
  const events = yield* Ref.make<GraphEvent[]>([])

  const appendEvent: EventStoreService['appendEvent'] = (event) =>
    Effect.gen(function* () {
      const currentEvents = yield* Ref.get(events)

      const conflicting = currentEvents.find(
        (e) => e.aggregateId === event.aggregateId && e.version === event.version,
      )
      if (conflicting) {
        return yield* new EventStoreErr({
          reason: `Optimistic concurrency conflict: version ${event.version} already exists for aggregate ${event.aggregateId}`,
        })
      }

      const newEvent: GraphEvent = {
        ...event,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      }

      yield* Ref.update(events, (evts) => [...evts, newEvent])
      return newEvent
    })

  const getEvents: EventStoreService['getEvents'] = () => Ref.get(events)

  const getEventsByAggregate: EventStoreService['getEventsByAggregate'] = (aggregateId) =>
    Effect.gen(function* () {
      const allEvents = yield* Ref.get(events)
      return allEvents.filter((e) => e.aggregateId === aggregateId)
    })

  return { appendEvent, getEvents, getEventsByAggregate } satisfies EventStoreService
})

export const InMemoryEventStoreLive = Layer.effect(EventStore, makeInMemoryEventStore)
