import { describe, it, expect } from 'vitest'
import { Effect, Layer } from 'effect'
import { EntityId, RelationId } from '@holon/shared'
import { traverse } from '../src/queries/traverse.js'
import { InMemoryEntityStoreLive, EntityStore } from '../src/entity-store.js'
import { InMemoryRelationStoreLive, RelationStore } from '../src/relation-store.js'
import type { Entity, Relation } from '../src/types.js'

const testLayer = Layer.mergeAll(InMemoryEntityStoreLive, InMemoryRelationStoreLive)

const makeEntity = (id: string, type: string, name: string): Entity => ({
  id: EntityId(id),
  type,
  name,
  properties: {},
  createdAt: new Date(),
  updatedAt: new Date(),
})

const makeRelation = (
  id: string,
  fromId: string,
  toId: string,
  type: string,
): Relation => ({
  id: RelationId(id),
  fromId: EntityId(fromId),
  toId: EntityId(toId),
  type,
  weight: 1.0,
  properties: {},
  createdAt: new Date(),
})

const setupGraph = Effect.gen(function* () {
  const entityStore = yield* EntityStore
  const relationStore = yield* RelationStore

  yield* entityStore.upsert(makeEntity('a', 'MODULE', 'A'))
  yield* entityStore.upsert(makeEntity('b', 'MODULE', 'B'))
  yield* entityStore.upsert(makeEntity('c', 'MODULE', 'C'))
  yield* entityStore.upsert(makeEntity('d', 'MODULE', 'D'))

  yield* relationStore.upsert(makeRelation('r1', 'a', 'b', 'DEPENDS_ON'))
  yield* relationStore.upsert(makeRelation('r2', 'b', 'c', 'DEPENDS_ON'))
  yield* relationStore.upsert(makeRelation('r3', 'a', 'd', 'REFERENCES'))
})

describe('traverse', () => {
  it('traverses BFS at depth 1', async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        yield* setupGraph

        const results = yield* traverse({
          startId: EntityId('a'),
          direction: 'outbound',
          maxDepth: 1,
          strategy: 'bfs',
        })

        const names = results.map((r) => r.entity.name)
        expect(names).toContain('A')
        expect(names).toContain('B')
        expect(names).toContain('D')
        expect(names).not.toContain('C')
      }).pipe(Effect.provide(testLayer)),
    )
  })

  it('traverses BFS at depth 2', async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        yield* setupGraph

        const results = yield* traverse({
          startId: EntityId('a'),
          direction: 'outbound',
          maxDepth: 2,
          strategy: 'bfs',
        })

        const names = results.map((r) => r.entity.name)
        expect(names).toContain('A')
        expect(names).toContain('B')
        expect(names).toContain('C')
        expect(names).toContain('D')
      }).pipe(Effect.provide(testLayer)),
    )
  })

  it('traverses BFS at depth 3 (full graph)', async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        yield* setupGraph

        const results = yield* traverse({
          startId: EntityId('a'),
          direction: 'outbound',
          maxDepth: 3,
          strategy: 'bfs',
        })

        expect(results).toHaveLength(4)
      }).pipe(Effect.provide(testLayer)),
    )
  })

  it('filters by relation type', async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        yield* setupGraph

        const results = yield* traverse({
          startId: EntityId('a'),
          direction: 'outbound',
          maxDepth: 3,
          relationTypes: ['DEPENDS_ON'],
          strategy: 'bfs',
        })

        const names = results.map((r) => r.entity.name)
        expect(names).toContain('A')
        expect(names).toContain('B')
        expect(names).toContain('C')
        expect(names).not.toContain('D')
      }).pipe(Effect.provide(testLayer)),
    )
  })

  it('returns empty results for disconnected node', async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const entityStore = yield* EntityStore
        yield* entityStore.upsert(makeEntity('lonely', 'MODULE', 'Lonely'))

        const results = yield* traverse({
          startId: EntityId('lonely'),
          direction: 'outbound',
          maxDepth: 5,
          strategy: 'bfs',
        })

        expect(results).toHaveLength(1)
        expect(results[0]!.entity.name).toBe('Lonely')
      }).pipe(Effect.provide(testLayer)),
    )
  })

  it('uses DFS strategy', async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        yield* setupGraph

        const results = yield* traverse({
          startId: EntityId('a'),
          direction: 'outbound',
          maxDepth: 3,
          strategy: 'dfs',
        })

        expect(results).toHaveLength(4)
        expect(results[0]!.entity.name).toBe('A')
      }).pipe(Effect.provide(testLayer)),
    )
  })
})
