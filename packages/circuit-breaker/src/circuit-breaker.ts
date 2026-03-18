import { Effect } from 'effect'

export const CircuitState = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN',
  DEGRADED: 'DEGRADED',
} as const
export type CircuitState = (typeof CircuitState)[keyof typeof CircuitState]

export const FailureType = {
  TIMEOUT: 'TIMEOUT',
  RATE_LIMIT: 'RATE_LIMIT',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SEMANTIC_FAILURE: 'SEMANTIC_FAILURE',
} as const
export type FailureType = (typeof FailureType)[keyof typeof FailureType]

export interface CircuitBreakerConfig {
  readonly failureThreshold: number
  readonly resetTimeoutMs: number
  readonly halfOpenMaxAttempts: number
  readonly degradedThreshold: number
  readonly failureWindowMs: number
}

interface FailureRecord {
  readonly type: FailureType
  readonly timestamp: number
}

export interface CircuitBreaker {
  readonly execute: <A, E>(
    operation: Effect.Effect<A, E>,
  ) => Effect.Effect<A, E | CircuitOpenError>
  readonly getState: () => CircuitState
  readonly getFailureCount: () => number
  readonly recordFailure: (type: FailureType) => void
  readonly recordSuccess: () => void
  readonly reset: () => void
}

export class CircuitOpenError {
  readonly _tag = 'CircuitOpenError' as const
  constructor(
    readonly state: CircuitState,
    readonly retryAfterMs: number,
  ) {}
}

const defaultConfig: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30_000,
  halfOpenMaxAttempts: 3,
  degradedThreshold: 3,
  failureWindowMs: 60_000,
}

export const createCircuitBreaker = (
  config: Partial<CircuitBreakerConfig> = {},
): CircuitBreaker => {
  const cfg = { ...defaultConfig, ...config }

  let state: CircuitState = CircuitState.CLOSED
  let failures: FailureRecord[] = []
  let lastFailureTime = 0
  let halfOpenAttempts = 0
  let successCount = 0

  const pruneOldFailures = () => {
    const cutoff = Date.now() - cfg.failureWindowMs
    failures = failures.filter((f) => f.timestamp > cutoff)
  }

  const recordFailure = (type: FailureType) => {
    const now = Date.now()
    failures.push({ type, timestamp: now })
    lastFailureTime = now
    successCount = 0
    pruneOldFailures()

    if (state === CircuitState.HALF_OPEN) {
      state = CircuitState.OPEN
      halfOpenAttempts = 0
      return
    }

    if (failures.length >= cfg.failureThreshold) {
      state = CircuitState.OPEN
    } else if (failures.length >= cfg.degradedThreshold) {
      state = CircuitState.DEGRADED
    }
  }

  const recordSuccess = () => {
    successCount++

    if (state === CircuitState.HALF_OPEN) {
      halfOpenAttempts++
      if (halfOpenAttempts >= cfg.halfOpenMaxAttempts) {
        state = CircuitState.CLOSED
        failures = []
        halfOpenAttempts = 0
      }
      return
    }

    if (state === CircuitState.DEGRADED && successCount >= cfg.degradedThreshold) {
      state = CircuitState.CLOSED
      failures = []
      successCount = 0
    }
  }

  const shouldAllowRequest = (): boolean => {
    if (state === CircuitState.CLOSED || state === CircuitState.DEGRADED) return true

    if (state === CircuitState.OPEN) {
      const elapsed = Date.now() - lastFailureTime
      if (elapsed >= cfg.resetTimeoutMs) {
        state = CircuitState.HALF_OPEN
        halfOpenAttempts = 0
        return true
      }
      return false
    }

    return state === CircuitState.HALF_OPEN
  }

  const execute: CircuitBreaker['execute'] = (operation) =>
    Effect.gen(function* () {
      if (!shouldAllowRequest()) {
        const elapsed = Date.now() - lastFailureTime
        const retryAfter = Math.max(0, cfg.resetTimeoutMs - elapsed)
        return yield* Effect.fail(new CircuitOpenError(state, retryAfter)) as never
      }

      const result = yield* Effect.exit(operation)

      if (result._tag === 'Success') {
        recordSuccess()
        return result.value
      }

      recordFailure(FailureType.SERVER_ERROR)
      return yield* Effect.fail(result.cause) as never
    })

  const reset = () => {
    state = CircuitState.CLOSED
    failures = []
    lastFailureTime = 0
    halfOpenAttempts = 0
    successCount = 0
  }

  return {
    execute,
    getState: () => state,
    getFailureCount: () => {
      pruneOldFailures()
      return failures.length
    },
    recordFailure,
    recordSuccess,
    reset,
  }
}
