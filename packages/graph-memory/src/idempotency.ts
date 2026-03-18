import { Context, Effect, Layer, Ref } from 'effect'
import type { IdempotencyKey } from '@holon/shared'

interface StoredEntry {
  readonly key: IdempotencyKey
  readonly result: unknown
  readonly expiresAt: Date
}

export interface IdempotencyStoreService {
  readonly get: (key: IdempotencyKey) => Effect.Effect<unknown | null>
  readonly set: (key: IdempotencyKey, result: unknown, ttlMs: number) => Effect.Effect<void>
  readonly cleanup: () => Effect.Effect<number>
}

export class IdempotencyStore extends Context.Tag('IdempotencyStore')<
  IdempotencyStore,
  IdempotencyStoreService
>() {}

export const makeInMemoryIdempotencyStore = Effect.gen(function* () {
  const store = yield* Ref.make<Map<string, StoredEntry>>(new Map())

  const get: IdempotencyStoreService['get'] = (key) =>
    Effect.gen(function* () {
      const map = yield* Ref.get(store)
      const entry = map.get(key)
      if (!entry) return null
      if (entry.expiresAt < new Date()) {
        yield* Ref.update(store, (m) => {
          const next = new Map(m)
          next.delete(key)
          return next
        })
        return null
      }
      return entry.result
    })

  const set: IdempotencyStoreService['set'] = (key, result, ttlMs) =>
    Ref.update(store, (m) => {
      const next = new Map(m)
      next.set(key, {
        key,
        result,
        expiresAt: new Date(Date.now() + ttlMs),
      })
      return next
    })

  const cleanup: IdempotencyStoreService['cleanup'] = () =>
    Effect.gen(function* () {
      const map = yield* Ref.get(store)
      const now = new Date()
      let removed = 0
      const next = new Map(map)
      for (const [k, v] of next) {
        if (v.expiresAt < now) {
          next.delete(k)
          removed++
        }
      }
      yield* Ref.set(store, next)
      return removed
    })

  return { get, set, cleanup } satisfies IdempotencyStoreService
})

export const InMemoryIdempotencyStoreLive = Layer.effect(
  IdempotencyStore,
  makeInMemoryIdempotencyStore,
)
