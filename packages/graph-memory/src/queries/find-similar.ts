import { Effect } from 'effect'
import type { ScoredEntity } from '../types.js'
import { EntityStore } from '../entity-store.js'

export interface FindSimilarOpts {
  readonly queryText: string
  readonly entityType?: string
  readonly limit: number
}

export const findSimilar = (opts: FindSimilarOpts) =>
  Effect.gen(function* () {
    const entityStore = yield* EntityStore
    const all = yield* entityStore.getAll()

    const filtered = opts.entityType ? all.filter((e) => e.type === opts.entityType) : all

    const results: ScoredEntity[] = filtered
      .map((entity) => ({
        entity,
        score: textSimilarity(opts.queryText, entity.name),
        distance: 0,
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, opts.limit)

    return results as ReadonlyArray<ScoredEntity>
  })

const textSimilarity = (query: string, target: string): number => {
  const queryLower = query.toLowerCase()
  const targetLower = target.toLowerCase()

  if (targetLower.includes(queryLower)) return 1.0
  if (queryLower.includes(targetLower)) return 0.8

  const queryWords = queryLower.split(/\s+/)
  const targetWords = targetLower.split(/\s+/)
  const matchingWords = queryWords.filter((w) => targetWords.some((tw) => tw.includes(w)))

  return queryWords.length > 0 ? matchingWords.length / queryWords.length : 0
}
