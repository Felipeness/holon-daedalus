import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { applyRelevanceDecay } from '../domain/relevance-decay.js'

describe('applyRelevanceDecay', () => {
  it('returns same weight when 0 days elapsed', () => {
    expect(applyRelevanceDecay(1.0, 0)).toBe(1.0)
  })

  it('returns same weight when 0 days elapsed for fractional weight', () => {
    expect(applyRelevanceDecay(0.5, 0)).toBe(0.5)
  })

  it('applies 0.95 decay factor after 1 day', () => {
    expect(applyRelevanceDecay(1.0, 1)).toBeCloseTo(0.95, 10)
  })

  it('applies correct decay after 7 days', () => {
    const expected = Math.pow(0.95, 7) // ~0.6983
    expect(applyRelevanceDecay(1.0, 7)).toBeCloseTo(expected, 10)
  })

  it('applies correct decay after 30 days', () => {
    const expected = Math.pow(0.95, 30)
    expect(applyRelevanceDecay(1.0, 30)).toBeCloseTo(expected, 10)
  })

  it('clamps to minimum 0.01 for very old relations', () => {
    const result = applyRelevanceDecay(1.0, 10000)
    expect(result).toBe(0.01)
  })

  it('clamps to minimum 0.01 for small initial weight with large decay', () => {
    const result = applyRelevanceDecay(0.02, 500)
    expect(result).toBe(0.01)
  })

  it('preserves proportional decay for non-unit weights', () => {
    const fullDecay = applyRelevanceDecay(1.0, 5)
    const halfDecay = applyRelevanceDecay(0.5, 5)
    expect(halfDecay).toBeCloseTo(fullDecay * 0.5, 10)
  })

  it('never returns zero (property-based)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 100, noNaN: true }),
        fc.nat({ max: 100_000 }),
        (weight, days) => {
          const result = applyRelevanceDecay(weight, days)
          expect(result).toBeGreaterThanOrEqual(0.01)
        },
      ),
    )
  })

  it('always returns a positive number (property-based)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 100, noNaN: true }),
        fc.nat({ max: 100_000 }),
        (weight, days) => {
          const result = applyRelevanceDecay(weight, days)
          expect(result).toBeGreaterThan(0)
        },
      ),
    )
  })

  it('produces monotonically decreasing results with more days (property-based)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.02, max: 100, noNaN: true }),
        fc.nat({ max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (weight, days, extraDays) => {
          const earlier = applyRelevanceDecay(weight, days)
          const later = applyRelevanceDecay(weight, days + extraDays)
          expect(later).toBeLessThanOrEqual(earlier)
        },
      ),
    )
  })
})
