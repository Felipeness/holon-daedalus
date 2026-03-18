import { Effect, Layer } from "effect"
import type { EventStoreError } from "@holon/shared"
import { EventStoreError as EventStoreErr } from "@holon/shared"
import { PgClient } from "./pg-client.js"
import { EventStore } from "./event-store.js"
import { EntityStore } from "./entity-store.js"
import { RelationStore } from "./relation-store.js"
import { IdempotencyStore } from "./idempotency.js"
import type { GraphEvent } from "./types.js"
import type { Entity, Relation, GraphPattern } from "./types.js"

export const PgEventStoreLive = Layer.effect(
  EventStore,
  Effect.gen(function* () {
    const pg = yield* PgClient

    return {
      appendEvent: (event) =>
        Effect.gen(function* () {
          const result = yield* Effect.mapError(
            pg.query(
              `INSERT INTO graph_events (aggregate_id, type, version, payload, idempotency_key, correlation_id, causation_id, source)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               RETURNING id, aggregate_id, type, version, payload, idempotency_key, correlation_id, causation_id, source, created_at`,
              [
                event.aggregateId,
                event.type,
                event.version,
                JSON.stringify(event.payload),
                event.idempotencyKey,
                event.correlationContext.correlationId,
                event.correlationContext.causationId,
                event.correlationContext.source,
              ],
            ),
            (err) =>
              new EventStoreErr({
                reason: err.message.includes("unique_aggregate_version")
                  ? `Optimistic concurrency conflict: version ${event.version} already exists for aggregate ${event.aggregateId}`
                  : `append event: ${err.message}`,
              }),
          )

          const row = result.rows[0]
          return {
            id: row.id,
            aggregateId: row.aggregate_id,
            type: row.type,
            version: row.version,
            payload: row.payload,
            idempotencyKey: event.idempotencyKey,
            correlationContext: event.correlationContext,
            createdAt: new Date(row.created_at),
          } as GraphEvent
        }),

      getEvents: () =>
        Effect.gen(function* () {
          const result = yield* Effect.mapError(
            pg.query(`SELECT * FROM graph_events ORDER BY created_at ASC`),
            (err) => new EventStoreErr({ reason: `get events: ${err.message}` }),
          )
          return result.rows.map(rowToEvent) as ReadonlyArray<GraphEvent>
        }),

      getEventsByAggregate: (aggregateId) =>
        Effect.gen(function* () {
          const result = yield* Effect.mapError(
            pg.query(
              `SELECT * FROM graph_events WHERE aggregate_id = $1 ORDER BY version ASC`,
              [aggregateId],
            ),
            (err) => new EventStoreErr({ reason: `get events by aggregate: ${err.message}` }),
          )
          return result.rows.map(rowToEvent) as ReadonlyArray<GraphEvent>
        }),
    }
  }),
)

export const PgEntityStoreLive = Layer.effect(
  EntityStore,
  Effect.gen(function* () {
    const pg = yield* PgClient

    return {
      getById: (id) =>
        Effect.gen(function* () {
          const result = yield* pg.query(`SELECT * FROM entities WHERE id = $1`, [id])
          if (result.rows.length === 0) return null
          return rowToEntity(result.rows[0])
        }),

      upsert: (entity) =>
        Effect.gen(function* () {
          yield* pg.query(
            `INSERT INTO entities (id, type, name, properties, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO UPDATE SET
               type = EXCLUDED.type,
               name = EXCLUDED.name,
               properties = EXCLUDED.properties,
               updated_at = EXCLUDED.updated_at`,
            [
              entity.id,
              entity.type,
              entity.name,
              JSON.stringify(entity.properties),
              entity.createdAt,
              entity.updatedAt,
            ],
          )
        }),

      findByPattern: (pattern) =>
        Effect.gen(function* () {
          const conditions: string[] = []
          const params: unknown[] = []
          let idx = 1

          if (pattern.entityType) {
            conditions.push(`type = $${idx++}`)
            params.push(pattern.entityType)
          }
          if (pattern.namePattern) {
            conditions.push(`name ILIKE $${idx++}`)
            params.push(`%${pattern.namePattern}%`)
          }
          if (pattern.propertyFilters) {
            conditions.push(`properties @> $${idx++}`)
            params.push(JSON.stringify(pattern.propertyFilters))
          }

          const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
          const result = yield* pg.query(`SELECT * FROM entities ${where}`, params)
          return result.rows.map(rowToEntity) as ReadonlyArray<Entity>
        }),

      getAll: () =>
        Effect.gen(function* () {
          const result = yield* pg.query(`SELECT * FROM entities ORDER BY created_at ASC`)
          return result.rows.map(rowToEntity) as ReadonlyArray<Entity>
        }),
    }
  }),
)

export const PgRelationStoreLive = Layer.effect(
  RelationStore,
  Effect.gen(function* () {
    const pg = yield* PgClient

    return {
      getByEntityId: (entityId, direction) =>
        Effect.gen(function* () {
          const condition =
            direction === "outbound"
              ? "from_id = $1"
              : direction === "inbound"
                ? "to_id = $1"
                : "from_id = $1 OR to_id = $1"

          const result = yield* pg.query(
            `SELECT * FROM relations WHERE ${condition}`,
            [entityId],
          )
          return result.rows.map(rowToRelation) as ReadonlyArray<Relation>
        }),

      findByFromToType: (fromId, toId, type) =>
        Effect.gen(function* () {
          const result = yield* pg.query(
            `SELECT * FROM relations WHERE from_id = $1 AND to_id = $2 AND type = $3`,
            [fromId, toId, type],
          )
          if (result.rows.length === 0) return null
          return rowToRelation(result.rows[0])
        }),

      upsert: (relation) =>
        Effect.gen(function* () {
          yield* pg.query(
            `INSERT INTO relations (id, from_id, to_id, type, weight, properties, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (from_id, to_id, type) DO UPDATE SET
               weight = EXCLUDED.weight,
               properties = EXCLUDED.properties`,
            [
              relation.id,
              relation.fromId,
              relation.toId,
              relation.type,
              relation.weight,
              JSON.stringify(relation.properties),
              relation.createdAt,
            ],
          )
        }),

      getAll: () =>
        Effect.gen(function* () {
          const result = yield* pg.query(`SELECT * FROM relations ORDER BY created_at ASC`)
          return result.rows.map(rowToRelation) as ReadonlyArray<Relation>
        }),
    }
  }),
)

export const PgIdempotencyStoreLive = Layer.effect(
  IdempotencyStore,
  Effect.gen(function* () {
    const pg = yield* PgClient

    return {
      get: (key) =>
        Effect.gen(function* () {
          const result = yield* pg.query(
            `SELECT result FROM idempotency_keys WHERE key = $1 AND expires_at > NOW()`,
            [key],
          )
          if (result.rows.length === 0) return null
          return result.rows[0].result
        }),

      set: (key, result, ttlMs) =>
        Effect.gen(function* () {
          yield* pg.query(
            `INSERT INTO idempotency_keys (key, result, expires_at)
             VALUES ($1, $2, NOW() + $3 * INTERVAL '1 millisecond')
             ON CONFLICT (key) DO UPDATE SET
               result = EXCLUDED.result,
               expires_at = EXCLUDED.expires_at`,
            [key, JSON.stringify(result), ttlMs],
          )
        }),

      cleanup: () =>
        Effect.gen(function* () {
          const result = yield* pg.query(
            `DELETE FROM idempotency_keys WHERE expires_at < NOW()`,
          )
          return result.rowCount ?? 0
        }),
    }
  }),
)

const rowToEvent = (row: Record<string, unknown>): GraphEvent => ({
  id: row.id as string,
  aggregateId: row.aggregate_id as string,
  type: row.type as string,
  version: row.version as number,
  payload: row.payload as Record<string, unknown>,
  idempotencyKey: row.idempotency_key as string,
  correlationContext: {
    correlationId: row.correlation_id as string,
    causationId: row.causation_id as string,
    source: row.source as string,
  },
  createdAt: new Date(row.created_at as string),
})

const rowToEntity = (row: Record<string, unknown>): Entity => ({
  id: row.id as string,
  type: row.type as string,
  name: row.name as string,
  properties: row.properties as Record<string, unknown>,
  createdAt: new Date(row.created_at as string),
  updatedAt: new Date(row.updated_at as string),
})

const rowToRelation = (row: Record<string, unknown>): Relation => ({
  id: row.id as string,
  fromId: row.from_id as string,
  toId: row.to_id as string,
  type: row.type as string,
  weight: row.weight as number,
  properties: row.properties as Record<string, unknown>,
  createdAt: new Date(row.created_at as string),
})
