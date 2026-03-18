import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { Effect, Layer } from "effect"
import { PgClient, PgClientLive } from "../src/pg-client.js"
import {
  PgEventStoreLive,
  PgEntityStoreLive,
  PgRelationStoreLive,
  PgIdempotencyStoreLive,
} from "../src/live.js"
import { EventStore } from "../src/event-store.js"
import { EntityStore } from "../src/entity-store.js"
import { RelationStore } from "../src/relation-store.js"
import { IdempotencyStore } from "../src/idempotency.js"
import type { Entity, Relation } from "../src/types.js"

const PG_URL = process.env.PG_URL ?? "postgresql://holon:holon_dev@localhost:5432/holon_daedalus"

const pgLayer = PgClientLive(PG_URL)

const run = <A, E>(effect: Effect.Effect<A, E, PgClient>) =>
  Effect.runPromise(Effect.scoped(Effect.provide(effect, pgLayer)))

const uuid = () => crypto.randomUUID()

describe.skipIf(!process.env.PG_INTEGRATION)("Postgres live integration", () => {
  beforeAll(async () => {
    await run(
      Effect.gen(function* () {
        const pg = yield* PgClient
        yield* pg.query("DELETE FROM relations")
        yield* pg.query("DELETE FROM entities")
        yield* pg.query("DELETE FROM graph_events")
        yield* pg.query("DELETE FROM idempotency_keys")
      }),
    )
  })

  afterAll(async () => {
    await run(
      Effect.gen(function* () {
        const pg = yield* PgClient
        yield* pg.query("DELETE FROM relations")
        yield* pg.query("DELETE FROM entities")
        yield* pg.query("DELETE FROM graph_events")
        yield* pg.query("DELETE FROM idempotency_keys")
      }),
    )
  })

  it("EntityStore: upsert and retrieve", async () => {
    const entityLayer = PgEntityStoreLive.pipe(Layer.provide(pgLayer))

    const entityId = uuid()
    const entity: Entity = {
      id: entityId as string,
      type: "TASK",
      name: "Test Entity",
      properties: { priority: "high" },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const store = yield* EntityStore
          yield* store.upsert(entity)
          const found = yield* store.getById(entity.id as string)
          expect(found).not.toBeNull()
          expect(found!.name).toBe("Test Entity")
          expect(found!.properties).toEqual({ priority: "high" })
        }).pipe(Effect.provide(Layer.merge(entityLayer, pgLayer))),
      ),
    )
  })

  it("RelationStore: upsert and retrieve", async () => {
    const entityLayer = PgEntityStoreLive.pipe(Layer.provide(pgLayer))
    const relationLayer = PgRelationStoreLive.pipe(Layer.provide(pgLayer))

    const id1 = uuid()
    const id2 = uuid()
    const relId = uuid()

    const entity1: Entity = {
      id: id1 as string,
      type: "FILE",
      name: "File A",
      properties: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const entity2: Entity = {
      id: id2 as string,
      type: "FILE",
      name: "File B",
      properties: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const relation: Relation = {
      id: relId as string,
      fromId: entity1.id,
      toId: entity2.id,
      type: "DEPENDS_ON",
      weight: 0.8,
      properties: {},
      createdAt: new Date(),
    }

    const testLayer = Layer.mergeAll(entityLayer, relationLayer, pgLayer)

    await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const entities = yield* EntityStore
          const relations = yield* RelationStore

          yield* entities.upsert(entity1)
          yield* entities.upsert(entity2)
          yield* relations.upsert(relation)

          const found = yield* relations.findByFromToType(entity1.id, entity2.id, "DEPENDS_ON")
          expect(found).not.toBeNull()
          expect(found!.weight).toBe(0.8)

          const outbound = yield* relations.getByEntityId(entity1.id, "outbound")
          expect(outbound).toHaveLength(1)
        }).pipe(Effect.provide(testLayer)),
      ),
    )
  })

  it("EventStore: append and retrieve", async () => {
    const eventLayer = PgEventStoreLive.pipe(Layer.provide(pgLayer))

    const aggregateId = uuid()

    await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const store = yield* EventStore

          const event = yield* store.appendEvent({
            aggregateId,
            type: "EntityCreated",
            version: 1,
            payload: { name: "test" },
            idempotencyKey: `idem-${Date.now()}` as string,
            correlationContext: {
              correlationId: "corr-1",
              causationId: "cause-1",
              source: "test",
            },
          })

          expect(event.id).toBeDefined()
          expect(event.type).toBe("EntityCreated")

          const events = yield* store.getEventsByAggregate(aggregateId)
          expect(events.length).toBeGreaterThanOrEqual(1)
        }).pipe(Effect.provide(Layer.merge(eventLayer, pgLayer))),
      ),
    )
  })

  it("IdempotencyStore: set, get, cleanup", async () => {
    const idempotencyLayer = PgIdempotencyStoreLive.pipe(Layer.provide(pgLayer))

    await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const store = yield* IdempotencyStore

          const key = `idem-key-${Date.now()}` as string
          yield* store.set(key, { result: "ok" }, 60_000)

          const found = yield* store.get(key)
          expect(found).toEqual({ result: "ok" })

          const cleaned = yield* store.cleanup()
          expect(typeof cleaned).toBe("number")
        }).pipe(Effect.provide(Layer.merge(idempotencyLayer, pgLayer))),
      ),
    )
  })
})
