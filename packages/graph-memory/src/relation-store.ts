import { Context, Effect, Layer, Ref } from 'effect'
import type { EntityId } from '@holon/shared'
import type { Relation } from './types.js'

export interface RelationStoreService {
  readonly getByEntityId: (
    entityId: EntityId,
    direction: 'outbound' | 'inbound' | 'both',
  ) => Effect.Effect<ReadonlyArray<Relation>>
  readonly findByFromToType: (
    fromId: EntityId,
    toId: EntityId,
    type: string,
  ) => Effect.Effect<Relation | null>
  readonly upsert: (relation: Relation) => Effect.Effect<void>
  readonly getAll: () => Effect.Effect<ReadonlyArray<Relation>>
}

export class RelationStore extends Context.Tag('RelationStore')<
  RelationStore,
  RelationStoreService
>() {}

export const makeInMemoryRelationStore = Effect.gen(function* () {
  const store = yield* Ref.make<Map<string, Relation>>(new Map())

  const getByEntityId: RelationStoreService['getByEntityId'] = (entityId, direction) =>
    Effect.gen(function* () {
      const map = yield* Ref.get(store)
      const relations = Array.from(map.values())

      return relations.filter((r) => {
        if (direction === 'outbound') return r.fromId === entityId
        if (direction === 'inbound') return r.toId === entityId
        return r.fromId === entityId || r.toId === entityId
      })
    })

  const findByFromToType: RelationStoreService['findByFromToType'] = (fromId, toId, type) =>
    Effect.gen(function* () {
      const map = yield* Ref.get(store)
      const relations = Array.from(map.values())
      return relations.find((r) => r.fromId === fromId && r.toId === toId && r.type === type) ?? null
    })

  const upsert: RelationStoreService['upsert'] = (relation) =>
    Ref.update(store, (m) => {
      const next = new Map(m)
      next.set(relation.id, relation)
      return next
    })

  const getAll: RelationStoreService['getAll'] = () =>
    Effect.gen(function* () {
      const map = yield* Ref.get(store)
      return Array.from(map.values())
    })

  return { getByEntityId, findByFromToType, upsert, getAll } satisfies RelationStoreService
})

export const InMemoryRelationStoreLive = Layer.effect(RelationStore, makeInMemoryRelationStore)
