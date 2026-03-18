import { Data } from 'effect'

export class EntityNotFound extends Data.TaggedError('EntityNotFound')<{ readonly id: string }> {}

export class RelationNotFound extends Data.TaggedError('RelationNotFound')<{
  readonly id: string
}> {}

export class GraphWriteError extends Data.TaggedError('GraphWriteError')<{
  readonly reason: string
}> {}

export class EventStoreError extends Data.TaggedError('EventStoreError')<{
  readonly reason: string
}> {}

export class IdempotencyHit extends Data.TaggedError('IdempotencyHit')<{
  readonly key: string
  readonly result: unknown
}> {}

export class InvalidInput extends Data.TaggedError('InvalidInput')<{
  readonly field: string
  readonly reason: string
}> {}

export class LLMUnavailable extends Data.TaggedError('LLMUnavailable')<{
  readonly circuitState: string
}> {}

export class LLMRateLimit extends Data.TaggedError('LLMRateLimit')<{
  readonly retryAfterMs: number
}> {}

export class LLMTimeout extends Data.TaggedError('LLMTimeout')<{ readonly timeoutMs: number }> {}

export class SemanticFailure extends Data.TaggedError('SemanticFailure')<{
  readonly response: string
}> {}

export class MaxRetriesExceeded extends Data.TaggedError('MaxRetriesExceeded')<{
  readonly attempts: number
}> {}

export class TestsFailed extends Data.TaggedError('TestsFailed')<{
  readonly output: string
  readonly iteration: number
}> {}

export class QualityBelowThreshold extends Data.TaggedError('QualityBelowThreshold')<{
  readonly score: number
  readonly threshold: number
}> {}

export class SecurityVulnerability extends Data.TaggedError('SecurityVulnerability')<{
  readonly finding: string
}> {}
