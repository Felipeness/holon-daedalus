import { describe, it, expect } from 'vitest'
import { createTokenBucket } from '../src/token-bucket.js'

describe('TokenBucket', () => {
  it('starts with max tokens available', () => {
    const bucket = createTokenBucket({ maxTokens: 10, refillRatePerMs: 0.001 })
    expect(bucket.available()).toBe(10)
  })

  it('acquires tokens successfully', () => {
    const bucket = createTokenBucket({ maxTokens: 5, refillRatePerMs: 0.001 })

    expect(bucket.acquire(1)).toBe(true)
    expect(bucket.available()).toBe(4)

    expect(bucket.acquire(3)).toBe(true)
    expect(bucket.available()).toBe(1)
  })

  it('rejects when insufficient tokens', () => {
    const bucket = createTokenBucket({ maxTokens: 2, refillRatePerMs: 0 })

    expect(bucket.acquire(1)).toBe(true)
    expect(bucket.acquire(1)).toBe(true)
    expect(bucket.acquire(1)).toBe(false)
  })

  it('tryAcquire provides wait time on failure', () => {
    const bucket = createTokenBucket({ maxTokens: 1, refillRatePerMs: 0.001 })

    bucket.acquire(1)
    const result = bucket.tryAcquire(1)

    expect(result.acquired).toBe(false)
    expect(result.waitMs).toBeGreaterThan(0)
  })

  it('tryAcquire succeeds when tokens available', () => {
    const bucket = createTokenBucket({ maxTokens: 5, refillRatePerMs: 0.001 })
    const result = bucket.tryAcquire(2)

    expect(result.acquired).toBe(true)
    expect(result.waitMs).toBe(0)
  })

  it('reset restores full capacity', () => {
    const bucket = createTokenBucket({ maxTokens: 10, refillRatePerMs: 0 })

    bucket.acquire(10)
    expect(bucket.available()).toBe(0)

    bucket.reset()
    expect(bucket.available()).toBe(10)
  })

  it('does not exceed max tokens after refill', () => {
    const bucket = createTokenBucket({ maxTokens: 5, refillRatePerMs: 1000 })

    expect(bucket.available()).toBeLessThanOrEqual(5)
  })
})
