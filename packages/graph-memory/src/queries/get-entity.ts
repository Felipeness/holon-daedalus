import { Effect } from 'effect'
import { EntityNotFound, type EntityId } from '@holon/shared'
import type { Entity } from '../types.js'
import { EntityStore } from '../entity-store.js'

export const getEntity = (id: EntityId) =>
  Effect.gen(function* () {
    const entityStore = yield* EntityStore
    const entity = yield* entityStore.getById(id)
    if (!entity) {
      return yield* new EntityNotFound({ id })
    }
    return entity as Entity
  })
