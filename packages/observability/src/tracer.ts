import { Context, Effect, Layer } from 'effect'
import type { CorrelationContext } from '@holon/shared'

export interface Span {
  readonly traceId: string
  readonly spanId: string
  readonly name: string
  readonly startTime: number
  readonly attributes: Record<string, string | number | boolean>
  end: () => void
}

export interface TracerService {
  readonly startSpan: (name: string, ctx?: CorrelationContext) => Span
  readonly withSpan: <A, E>(
    name: string,
    effect: Effect.Effect<A, E>,
    ctx?: CorrelationContext,
  ) => Effect.Effect<A, E>
}

export class Tracer extends Context.Tag('Tracer')<Tracer, TracerService>() {}

export const makeNoopTracer: TracerService = {
  startSpan: (name, ctx) => ({
    traceId: ctx?.correlationId ?? crypto.randomUUID(),
    spanId: crypto.randomUUID(),
    name,
    startTime: Date.now(),
    attributes: {},
    end: () => {},
  }),
  withSpan: (_name, effect) => effect,
}

export const NoopTracerLive = Layer.succeed(Tracer, makeNoopTracer)
