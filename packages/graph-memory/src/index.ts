export type { Entity, Relation, GraphEvent, GraphPattern, TraverseOpts, ScoredEntity } from './types.js'

export { EventStore, InMemoryEventStoreLive, makeInMemoryEventStore } from './event-store.js'
export type { EventStoreService } from './event-store.js'

export { EntityStore, InMemoryEntityStoreLive, makeInMemoryEntityStore } from './entity-store.js'
export type { EntityStoreService } from './entity-store.js'

export {
  RelationStore,
  InMemoryRelationStoreLive,
  makeInMemoryRelationStore,
} from './relation-store.js'
export type { RelationStoreService } from './relation-store.js'

export {
  IdempotencyStore,
  InMemoryIdempotencyStoreLive,
  makeInMemoryIdempotencyStore,
} from './idempotency.js'
export type { IdempotencyStoreService } from './idempotency.js'

export { addEntity } from './commands/add-entity.js'
export type { AddEntityInput } from './commands/add-entity.js'

export { addRelation } from './commands/add-relation.js'
export type { AddRelationInput } from './commands/add-relation.js'

export { updateProperties } from './commands/update-properties.js'
export type { UpdatePropertiesInput } from './commands/update-properties.js'

export { getEntity } from './queries/get-entity.js'
export { traverse } from './queries/traverse.js'
export { findSimilar } from './queries/find-similar.js'
export type { FindSimilarOpts } from './queries/find-similar.js'
export { queryPattern } from './queries/query-pattern.js'
export { projectEntities } from './projections/entity-projector.js'

export { PgClient, PgClientLive, PgError } from './pg-client.js'
export type { PgClientService } from './pg-client.js'

export {
  PgEventStoreLive,
  PgEntityStoreLive,
  PgRelationStoreLive,
  PgIdempotencyStoreLive,
} from './live.js'

export { getStorageLayers, DEFAULT_PG_URL } from './detect-storage.js'
