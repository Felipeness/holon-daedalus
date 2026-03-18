import { describe, it, expect } from 'vitest'
import { Effect } from 'effect'
import {
  createCircuitBreaker,
  CircuitState,
  FailureType,
  CircuitOpenError,
} from '../src/circuit-breaker.js'

describe('CircuitBreaker', () => {
  it('starts in CLOSED state', () => {
    const cb = createCircuitBreaker()
    expect(cb.getState()).toBe(CircuitState.CLOSED)
    expect(cb.getFailureCount()).toBe(0)
  })

  it('remains CLOSED on success', async () => {
    const cb = createCircuitBreaker()
    const result = await Effect.runPromise(cb.execute(Effect.succeed(42)))
    expect(result).toBe(42)
    expect(cb.getState()).toBe(CircuitState.CLOSED)
  })

  it('transitions to DEGRADED after degradedThreshold failures', () => {
    const cb = createCircuitBreaker({ degradedThreshold: 2, failureThreshold: 5 })

    cb.recordFailure(FailureType.TIMEOUT)
    expect(cb.getState()).toBe(CircuitState.CLOSED)

    cb.recordFailure(FailureType.TIMEOUT)
    expect(cb.getState()).toBe(CircuitState.DEGRADED)
  })

  it('transitions to OPEN after failureThreshold failures', () => {
    const cb = createCircuitBreaker({ failureThreshold: 3, degradedThreshold: 2 })

    cb.recordFailure(FailureType.SERVER_ERROR)
    cb.recordFailure(FailureType.NETWORK_ERROR)
    cb.recordFailure(FailureType.RATE_LIMIT)

    expect(cb.getState()).toBe(CircuitState.OPEN)
  })

  it('rejects requests when OPEN', async () => {
    const cb = createCircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 60_000 })
    cb.recordFailure(FailureType.TIMEOUT)

    const result = await Effect.runPromiseExit(cb.execute(Effect.succeed('should not run')))
    expect(result._tag).toBe('Failure')
  })

  it('transitions to HALF_OPEN after resetTimeout', () => {
    const cb = createCircuitBreaker({
      failureThreshold: 1,
      resetTimeoutMs: 0,
    })
    cb.recordFailure(FailureType.SERVER_ERROR)
    expect(cb.getState()).toBe(CircuitState.OPEN)

    cb.getFailureCount()
    expect(cb.getState()).toBe(CircuitState.OPEN)
  })

  it('recovers from DEGRADED after enough successes', () => {
    const cb = createCircuitBreaker({ degradedThreshold: 2, failureThreshold: 5 })

    cb.recordFailure(FailureType.TIMEOUT)
    cb.recordFailure(FailureType.TIMEOUT)
    expect(cb.getState()).toBe(CircuitState.DEGRADED)

    cb.recordSuccess()
    cb.recordSuccess()
    expect(cb.getState()).toBe(CircuitState.CLOSED)
  })

  it('tracks different failure types', () => {
    const cb = createCircuitBreaker({ failureThreshold: 10 })

    cb.recordFailure(FailureType.TIMEOUT)
    cb.recordFailure(FailureType.RATE_LIMIT)
    cb.recordFailure(FailureType.SERVER_ERROR)
    cb.recordFailure(FailureType.NETWORK_ERROR)
    cb.recordFailure(FailureType.SEMANTIC_FAILURE)

    expect(cb.getFailureCount()).toBe(5)
  })

  it('reset clears all state', () => {
    const cb = createCircuitBreaker({ failureThreshold: 2, degradedThreshold: 1 })

    cb.recordFailure(FailureType.TIMEOUT)
    cb.recordFailure(FailureType.TIMEOUT)
    expect(cb.getState()).toBe(CircuitState.OPEN)

    cb.reset()
    expect(cb.getState()).toBe(CircuitState.CLOSED)
    expect(cb.getFailureCount()).toBe(0)
  })
})
