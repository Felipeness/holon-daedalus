import type { CorrelationId, CausationId } from './types.js'
import { CorrelationId as makeCorrelationId, CausationId as makeCausationId } from './types.js'

export interface CorrelationContext {
  readonly correlationId: CorrelationId
  readonly causationId: CausationId
  readonly timestamp: Date
  readonly source: string
}

export const createCorrelationContext = (source: string): CorrelationContext => ({
  correlationId: makeCorrelationId(crypto.randomUUID()),
  causationId: makeCausationId(crypto.randomUUID()),
  timestamp: new Date(),
  source,
})

export const deriveCorrelationContext = (
  parent: CorrelationContext,
  source: string,
): CorrelationContext => ({
  correlationId: parent.correlationId,
  causationId: makeCausationId(crypto.randomUUID()),
  timestamp: new Date(),
  source,
})
