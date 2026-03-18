import { Layer } from "effect"
import { PgClientLive } from "./pg-client.js"
import {
  PgEventStoreLive,
  PgEntityStoreLive,
  PgRelationStoreLive,
  PgIdempotencyStoreLive,
} from "./live.js"
import {
  InMemoryEventStoreLive,
} from "./event-store.js"
import {
  InMemoryEntityStoreLive,
} from "./entity-store.js"
import {
  InMemoryRelationStoreLive,
} from "./relation-store.js"
import {
  InMemoryIdempotencyStoreLive,
} from "./idempotency.js"

export const DEFAULT_PG_URL = "postgresql://holon:holon_dev@localhost:5432/holon_daedalus"

export const getStorageLayers = (pgUrl?: string) => {
  if (pgUrl) {
    const pgLayer = PgClientLive(pgUrl)
    return {
      eventStore: PgEventStoreLive.pipe(Layer.provide(pgLayer)),
      entityStore: PgEntityStoreLive.pipe(Layer.provide(pgLayer)),
      relationStore: PgRelationStoreLive.pipe(Layer.provide(pgLayer)),
      idempotencyStore: PgIdempotencyStoreLive.pipe(Layer.provide(pgLayer)),
    }
  }

  return {
    eventStore: InMemoryEventStoreLive,
    entityStore: InMemoryEntityStoreLive,
    relationStore: InMemoryRelationStoreLive,
    idempotencyStore: InMemoryIdempotencyStoreLive,
  }
}
