import { describe, it, expect } from 'vitest'
import { reflect, type AttemptResult } from '../domain/self-reflection.js'

describe('reflect', () => {
  const makeAttempt = (overrides?: Partial<AttemptResult>): AttemptResult => ({
    success: false,
    error: 'test compilation failed',
    phase: 'GREEN',
    attemptNumber: 1,
    ...overrides,
  })

  describe('before 3 consecutive failures', () => {
    it.each([
      { count: 0, label: 'zero failures' },
      { count: 1, label: 'one failure' },
      { count: 2, label: 'two failures' },
    ])('returns ContinueResult for $label', ({ count }) => {
      const failures = Array.from({ length: count }, (_, i) =>
        makeAttempt({ attemptNumber: i + 1 }),
      )

      const result = reflect(failures)

      expect(result.type).toBe('continue')
    })
  })

  describe('at 3 or more consecutive failures', () => {
    it('returns ReflectionResult with analysis after 3 failures', () => {
      const failures = Array.from({ length: 3 }, (_, i) =>
        makeAttempt({
          attemptNumber: i + 1,
          error: `compilation error attempt ${i + 1}`,
        }),
      )

      const result = reflect(failures)

      expect(result.type).toBe('reflect')
      if (result.type === 'reflect') {
        expect(result.analysis).toBeDefined()
        expect(result.analysis.length).toBeGreaterThan(0)
        expect(result.revisedApproach).toBeDefined()
        expect(result.revisedApproach.length).toBeGreaterThan(0)
        expect(result.failurePatterns).toBeDefined()
        expect(result.failurePatterns.length).toBeGreaterThan(0)
      }
    })

    it('returns ReflectionResult for more than 3 failures', () => {
      const failures = Array.from({ length: 5 }, (_, i) =>
        makeAttempt({ attemptNumber: i + 1 }),
      )

      const result = reflect(failures)

      expect(result.type).toBe('reflect')
    })

    it('includes all unique error messages in failure patterns', () => {
      const failures: readonly AttemptResult[] = [
        makeAttempt({ error: 'type error: missing property' }),
        makeAttempt({ error: 'type error: missing property' }),
        makeAttempt({ error: 'runtime error: null reference' }),
      ]

      const result = reflect(failures)

      if (result.type === 'reflect') {
        expect(result.failurePatterns).toContain('type error: missing property')
        expect(result.failurePatterns).toContain('runtime error: null reference')
        expect(result.failurePatterns).toHaveLength(2)
      }
    })
  })

  describe('mixed success and failure sequences', () => {
    it('returns ContinueResult when last attempt succeeded', () => {
      const attempts: readonly AttemptResult[] = [
        makeAttempt({ attemptNumber: 1 }),
        makeAttempt({ attemptNumber: 2 }),
        makeAttempt({ attemptNumber: 3 }),
        makeAttempt({ attemptNumber: 4, success: true, error: undefined }),
      ]

      const result = reflect(attempts)

      expect(result.type).toBe('continue')
    })

    it('counts only trailing consecutive failures', () => {
      const attempts: readonly AttemptResult[] = [
        makeAttempt({ attemptNumber: 1 }),
        makeAttempt({ attemptNumber: 2, success: true, error: undefined }),
        makeAttempt({ attemptNumber: 3 }),
        makeAttempt({ attemptNumber: 4 }),
      ]

      const result = reflect(attempts)

      expect(result.type).toBe('continue')
    })

    it('triggers reflection on 3 trailing consecutive failures', () => {
      const attempts: readonly AttemptResult[] = [
        makeAttempt({ attemptNumber: 1, success: true, error: undefined }),
        makeAttempt({ attemptNumber: 2 }),
        makeAttempt({ attemptNumber: 3 }),
        makeAttempt({ attemptNumber: 4 }),
      ]

      const result = reflect(attempts)

      expect(result.type).toBe('reflect')
    })
  })
})
