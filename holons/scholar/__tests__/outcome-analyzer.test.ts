import { describe, it, expect } from 'vitest'
import {
  analyzeOutcomes,
  type ExecutionOutcome,
  type OutcomeAnalysis,
} from '../domain/outcome-analyzer.js'

const makeOutcome = (overrides: Partial<ExecutionOutcome> = {}): ExecutionOutcome => ({
  taskId: 'task-1',
  taskType: 'CODE_GENERATION',
  success: true,
  patternsUsed: [],
  failureReason: undefined,
  durationMs: 1000,
  timestamp: new Date('2025-01-15T10:00:00Z'),
  ...overrides,
})

describe('analyzeOutcomes', () => {
  it('calculates overall success rate', () => {
    const outcomes = [
      makeOutcome({ taskId: 't1', success: true }),
      makeOutcome({ taskId: 't2', success: true }),
      makeOutcome({ taskId: 't3', success: false }),
    ]

    const analysis = analyzeOutcomes(outcomes)

    expect(analysis.overallSuccessRate).toBeCloseTo(2 / 3, 10)
  })

  it('returns 0 success rate for all failures', () => {
    const outcomes = [
      makeOutcome({ success: false }),
      makeOutcome({ success: false }),
    ]

    const analysis = analyzeOutcomes(outcomes)

    expect(analysis.overallSuccessRate).toBe(0)
  })

  it('returns 1 success rate for all successes', () => {
    const outcomes = [
      makeOutcome({ success: true }),
      makeOutcome({ success: true }),
    ]

    const analysis = analyzeOutcomes(outcomes)

    expect(analysis.overallSuccessRate).toBe(1)
  })

  it('calculates success rate per task type', () => {
    const outcomes = [
      makeOutcome({ taskType: 'CODE_GENERATION', success: true }),
      makeOutcome({ taskType: 'CODE_GENERATION', success: false }),
      makeOutcome({ taskType: 'BUG_FIX', success: true }),
      makeOutcome({ taskType: 'BUG_FIX', success: true }),
      makeOutcome({ taskType: 'BUG_FIX', success: true }),
    ]

    const analysis = analyzeOutcomes(outcomes)

    expect(analysis.successRateByTaskType['CODE_GENERATION']).toBeCloseTo(0.5, 10)
    expect(analysis.successRateByTaskType['BUG_FIX']).toBe(1)
  })

  it('identifies most successful patterns', () => {
    const outcomes = [
      makeOutcome({ success: true, patternsUsed: ['repository-pattern', 'factory-method'] }),
      makeOutcome({ success: true, patternsUsed: ['repository-pattern'] }),
      makeOutcome({ success: false, patternsUsed: ['singleton'] }),
      makeOutcome({ success: true, patternsUsed: ['factory-method'] }),
    ]

    const analysis = analyzeOutcomes(outcomes)

    expect(analysis.topPatterns[0].name).toBe('repository-pattern')
    expect(analysis.topPatterns[0].successCount).toBe(2)
    expect(analysis.topPatterns[0].totalCount).toBe(2)
    expect(analysis.topPatterns[0].successRate).toBe(1)
  })

  it('identifies most common failure reasons', () => {
    const outcomes = [
      makeOutcome({ success: false, failureReason: 'timeout' }),
      makeOutcome({ success: false, failureReason: 'timeout' }),
      makeOutcome({ success: false, failureReason: 'type error' }),
      makeOutcome({ success: true }),
    ]

    const analysis = analyzeOutcomes(outcomes)

    expect(analysis.topFailureReasons[0]).toEqual({ reason: 'timeout', count: 2 })
    expect(analysis.topFailureReasons[1]).toEqual({ reason: 'type error', count: 1 })
  })

  it('returns empty analysis for empty input', () => {
    const analysis = analyzeOutcomes([])

    expect(analysis.overallSuccessRate).toBe(0)
    expect(analysis.successRateByTaskType).toEqual({})
    expect(analysis.topPatterns).toEqual([])
    expect(analysis.topFailureReasons).toEqual([])
    expect(analysis.totalExecutions).toBe(0)
  })

  it('tracks total executions', () => {
    const outcomes = [
      makeOutcome({ taskId: 't1' }),
      makeOutcome({ taskId: 't2' }),
      makeOutcome({ taskId: 't3' }),
    ]

    const analysis = analyzeOutcomes(outcomes)

    expect(analysis.totalExecutions).toBe(3)
  })

  it('sorts patterns by success rate descending', () => {
    const outcomes = [
      makeOutcome({ success: true, patternsUsed: ['a'] }),
      makeOutcome({ success: true, patternsUsed: ['b'] }),
      makeOutcome({ success: false, patternsUsed: ['a'] }),
      makeOutcome({ success: true, patternsUsed: ['b'] }),
    ]

    const analysis = analyzeOutcomes(outcomes)

    expect(analysis.topPatterns[0].name).toBe('b')
    expect(analysis.topPatterns[0].successRate).toBe(1)
    expect(analysis.topPatterns[1].name).toBe('a')
    expect(analysis.topPatterns[1].successRate).toBe(0.5)
  })

  it('sorts failure reasons by count descending', () => {
    const outcomes = [
      makeOutcome({ success: false, failureReason: 'rare' }),
      makeOutcome({ success: false, failureReason: 'common' }),
      makeOutcome({ success: false, failureReason: 'common' }),
      makeOutcome({ success: false, failureReason: 'common' }),
      makeOutcome({ success: false, failureReason: 'rare' }),
    ]

    const analysis = analyzeOutcomes(outcomes)

    expect(analysis.topFailureReasons[0].reason).toBe('common')
    expect(analysis.topFailureReasons[0].count).toBe(3)
    expect(analysis.topFailureReasons[1].reason).toBe('rare')
    expect(analysis.topFailureReasons[1].count).toBe(2)
  })

  it('excludes undefined failure reasons', () => {
    const outcomes = [
      makeOutcome({ success: false, failureReason: undefined }),
      makeOutcome({ success: false, failureReason: 'timeout' }),
    ]

    const analysis = analyzeOutcomes(outcomes)

    expect(analysis.topFailureReasons).toHaveLength(1)
    expect(analysis.topFailureReasons[0].reason).toBe('timeout')
  })

  it('calculates average duration', () => {
    const outcomes = [
      makeOutcome({ durationMs: 1000 }),
      makeOutcome({ durationMs: 2000 }),
      makeOutcome({ durationMs: 3000 }),
    ]

    const analysis = analyzeOutcomes(outcomes)

    expect(analysis.averageDurationMs).toBe(2000)
  })

  it('returns 0 average duration for empty input', () => {
    const analysis = analyzeOutcomes([])

    expect(analysis.averageDurationMs).toBe(0)
  })
})
