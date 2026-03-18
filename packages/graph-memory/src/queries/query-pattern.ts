import { Effect } from 'effect'
import type { Entity, GraphPattern } from '../types.js'
import { EntityStore } from '../entity-store.js'

export const queryPattern = (pattern: GraphPattern) =>
  Effect.gen(function* () {
    const entityStore = yield* EntityStore
    return yield* entityStore.findByPattern(pattern)
  })
