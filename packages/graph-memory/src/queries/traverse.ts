import { Effect } from 'effect'
import type { EntityId } from '@holon/shared'
import type { Entity, ScoredEntity, TraverseOpts } from '../types.js'
import { EntityStore } from '../entity-store.js'
import { RelationStore } from '../relation-store.js'

export const traverse = (opts: TraverseOpts) =>
  Effect.gen(function* () {
    const entityStore = yield* EntityStore
    const relationStore = yield* RelationStore

    const visited = new Set<string>()
    const results: ScoredEntity[] = []

    if (opts.strategy === 'bfs') {
      yield* bfs(opts, entityStore, relationStore, visited, results)
    } else {
      yield* dfs(opts.startId, 0, opts, entityStore, relationStore, visited, results)
    }

    return results as ReadonlyArray<ScoredEntity>
  })

const bfs = (
  opts: TraverseOpts,
  entityStore: EntityStore['Type'],
  relationStore: RelationStore['Type'],
  visited: Set<string>,
  results: ScoredEntity[],
) =>
  Effect.gen(function* () {
    const queue: Array<{ id: EntityId; depth: number }> = [{ id: opts.startId, depth: 0 }]
    visited.add(opts.startId)

    while (queue.length > 0) {
      const current = queue.shift()!
      const entity = yield* entityStore.getById(current.id)

      if (entity) {
        results.push({ entity, score: 1 / (1 + current.depth), distance: current.depth })
      }

      if (current.depth >= opts.maxDepth) continue

      const relations = yield* relationStore.getByEntityId(current.id, opts.direction)
      const filtered = opts.relationTypes
        ? relations.filter((r) => opts.relationTypes!.includes(r.type))
        : relations

      for (const rel of filtered) {
        const nextId = rel.fromId === current.id ? rel.toId : rel.fromId
        if (!visited.has(nextId)) {
          visited.add(nextId)
          queue.push({ id: nextId, depth: current.depth + 1 })
        }
      }
    }
  })

const dfs = (
  currentId: EntityId,
  depth: number,
  opts: TraverseOpts,
  entityStore: EntityStore['Type'],
  relationStore: RelationStore['Type'],
  visited: Set<string>,
  results: ScoredEntity[],
): Effect.Effect<void> =>
  Effect.gen(function* () {
    visited.add(currentId)

    const entity = yield* entityStore.getById(currentId)
    if (entity) {
      results.push({ entity, score: 1 / (1 + depth), distance: depth })
    }

    if (depth >= opts.maxDepth) return

    const relations = yield* relationStore.getByEntityId(currentId, opts.direction)
    const filtered = opts.relationTypes
      ? relations.filter((r) => opts.relationTypes!.includes(r.type))
      : relations

    for (const rel of filtered) {
      const nextId = rel.fromId === currentId ? rel.toId : rel.fromId
      if (!visited.has(nextId)) {
        yield* dfs(nextId, depth + 1, opts, entityStore, relationStore, visited, results)
      }
    }
  })
