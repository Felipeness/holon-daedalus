import type { CorrelationContext, HolonId } from '@holon/shared'

export interface HolonMessage<T = unknown> {
  readonly id: string
  readonly from: HolonId
  readonly to: HolonId
  readonly type: string
  readonly payload: T
  readonly correlationContext: CorrelationContext
  readonly timestamp: Date
  readonly replyTo?: string
}

export const createMessage = <T>(
  from: HolonId,
  to: HolonId,
  type: string,
  payload: T,
  correlationContext: CorrelationContext,
): HolonMessage<T> => ({
  id: crypto.randomUUID(),
  from,
  to,
  type,
  payload,
  correlationContext,
  timestamp: new Date(),
})
