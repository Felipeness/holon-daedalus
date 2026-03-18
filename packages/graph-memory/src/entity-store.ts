import { Context, Effect, Layer, Ref } from 'effect'
import type { EntityId } from '@holon/shared'
import type { Entity, GraphPattern } from './types.js'

export interface EntityStoreService {
  readonly getById: (id: EntityId) => Effect.Effect<Entity | null>
  readonly upsert: (entity: Entity) => Effect.Effect<void>
  readonly findByPattern: (pattern: GraphPattern) => Effect.Effect<ReadonlyArray<Entity>>
  readonly getAll: () => Effect.Effect<ReadonlyArray<Entity>>
}

export class EntityStore extends Context.Tag('EntityStore')<EntityStore, EntityStoreService>() {}

export const makeInMemoryEntityStore = Effect.gen(function* () {
  const store = yield* Ref.make<Map<string, Entity>>(new Map())

  const getById: EntityStoreService['getById'] = (id) =>
    Effect.gen(function* () {
      const map = yield* Ref.get(store)
      return map.get(id) ?? null
    })

  const upsert: EntityStoreService['upsert'] = (entity) =>
    Ref.update(store, (m) => {
      const next = new Map(m)
      next.set(entity.id, entity)
      return next
    })

  const findByPattern: EntityStoreService['findByPattern'] = (pattern) =>
    Effect.gen(function* () {
      const map = yield* Ref.get(store)
      const entities = Array.from(map.values())

      return entities.filter((e) => {
        if (pattern.entityType && e.type !== pattern.entityType) return false
        if (pattern.namePattern && !e.name.includes(pattern.namePattern)) return false
        if (pattern.propertyFilters) {
          for (const [key, value] of Object.entries(pattern.propertyFilters)) {
            if (e.properties[key] !== value) return false
          }
        }
        return true
      })
    })

  const getAll: EntityStoreService['getAll'] = () =>
    Effect.gen(function* () {
      const map = yield* Ref.get(store)
      return Array.from(map.values())
    })

  return { getById, upsert, findByPattern, getAll } satisfies EntityStoreService
})

export const InMemoryEntityStoreLive = Layer.effect(EntityStore, makeInMemoryEntityStore)
