import { describe, it, expect } from 'vitest'
import { Effect } from 'effect'
import { IdempotencyKey } from '@holon/shared'
import { IdempotencyStore, InMemoryIdempotencyStoreLive } from '../src/idempotency.js'

const testLayer = InMemoryIdempotencyStoreLive

describe('IdempotencyStore', () => {
  it('stores and retrieves values', async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const store = yield* IdempotencyStore
        const key = IdempotencyKey('test-key-1')

        yield* store.set(key, { entityId: '123' }, 60_000)
        const result = yield* store.get(key)

        expect(result).toEqual({ entityId: '123' })
      }).pipe(Effect.provide(testLayer)),
    )
  })

  it('returns null for missing keys', async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const store = yield* IdempotencyStore
        const result = yield* store.get(IdempotencyKey('nonexistent'))

        expect(result).toBeNull()
      }).pipe(Effect.provide(testLayer)),
    )
  })

  it('returns null for expired entries', async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const store = yield* IdempotencyStore
        const key = IdempotencyKey('expire-test')

        yield* store.set(key, { data: 'old' }, -1)
        const result = yield* store.get(key)

        expect(result).toBeNull()
      }).pipe(Effect.provide(testLayer)),
    )
  })

  it('returns cached result on hit', async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const store = yield* IdempotencyStore
        const key = IdempotencyKey('cached-key')
        const cachedResult = { id: 'entity-42', name: 'cached' }

        yield* store.set(key, cachedResult, 60_000)

        const first = yield* store.get(key)
        const second = yield* store.get(key)

        expect(first).toEqual(cachedResult)
        expect(second).toEqual(cachedResult)
      }).pipe(Effect.provide(testLayer)),
    )
  })

  it('cleans up expired entries', async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const store = yield* IdempotencyStore

        yield* store.set(IdempotencyKey('expired-1'), 'a', -1)
        yield* store.set(IdempotencyKey('expired-2'), 'b', -1)
        yield* store.set(IdempotencyKey('valid-1'), 'c', 60_000)

        const removed = yield* store.cleanup()
        expect(removed).toBe(2)

        const valid = yield* store.get(IdempotencyKey('valid-1'))
        expect(valid).toBe('c')
      }).pipe(Effect.provide(testLayer)),
    )
  })
})
