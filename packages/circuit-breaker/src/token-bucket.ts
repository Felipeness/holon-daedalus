export interface TokenBucketConfig {
  readonly maxTokens: number
  readonly refillRatePerMs: number
}

export interface TokenBucket {
  readonly acquire: (tokens?: number) => boolean
  readonly tryAcquire: (tokens?: number) => { readonly acquired: boolean; readonly waitMs: number }
  readonly available: () => number
  readonly reset: () => void
}

export const createTokenBucket = (config: TokenBucketConfig): TokenBucket => {
  let tokens = config.maxTokens
  let lastRefill = Date.now()

  const refill = () => {
    const now = Date.now()
    const elapsed = now - lastRefill
    const newTokens = elapsed * config.refillRatePerMs
    tokens = Math.min(config.maxTokens, tokens + newTokens)
    lastRefill = now
  }

  const acquire = (requested = 1): boolean => {
    refill()
    if (tokens >= requested) {
      tokens -= requested
      return true
    }
    return false
  }

  const tryAcquire = (requested = 1): { acquired: boolean; waitMs: number } => {
    refill()
    if (tokens >= requested) {
      tokens -= requested
      return { acquired: true, waitMs: 0 }
    }
    const deficit = requested - tokens
    const waitMs = Math.ceil(deficit / config.refillRatePerMs)
    return { acquired: false, waitMs }
  }

  const available = (): number => {
    refill()
    return Math.floor(tokens)
  }

  const reset = () => {
    tokens = config.maxTokens
    lastRefill = Date.now()
  }

  return { acquire, tryAcquire, available, reset }
}
