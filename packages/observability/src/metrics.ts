import { Context, Layer } from 'effect'

export interface Counter {
  readonly name: string
  readonly increment: (labels?: Record<string, string>) => void
  readonly getValue: (labels?: Record<string, string>) => number
}

export interface Histogram {
  readonly name: string
  readonly observe: (value: number, labels?: Record<string, string>) => void
  readonly getValues: (labels?: Record<string, string>) => ReadonlyArray<number>
}

export interface MetricsService {
  readonly createCounter: (name: string, description: string) => Counter
  readonly createHistogram: (name: string, description: string, buckets?: number[]) => Histogram
}

export class Metrics extends Context.Tag('Metrics')<Metrics, MetricsService>() {}

const labelKey = (labels?: Record<string, string>): string =>
  labels ? JSON.stringify(labels) : ''

export const makeInMemoryMetrics = (): MetricsService => ({
  createCounter: (name, _description) => {
    const values = new Map<string, number>()
    return {
      name,
      increment: (labels) => {
        const key = labelKey(labels)
        values.set(key, (values.get(key) ?? 0) + 1)
      },
      getValue: (labels) => values.get(labelKey(labels)) ?? 0,
    }
  },
  createHistogram: (name, _description) => {
    const values = new Map<string, number[]>()
    return {
      name,
      observe: (value, labels) => {
        const key = labelKey(labels)
        const existing = values.get(key) ?? []
        existing.push(value)
        values.set(key, existing)
      },
      getValues: (labels) => values.get(labelKey(labels)) ?? [],
    }
  },
})

export const InMemoryMetricsLive = Layer.succeed(Metrics, makeInMemoryMetrics())
