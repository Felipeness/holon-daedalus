export interface ExecutionOutcome {
  readonly taskId: string
  readonly taskType: string
  readonly success: boolean
  readonly patternsUsed: ReadonlyArray<string>
  readonly failureReason: string | undefined
  readonly durationMs: number
  readonly timestamp: Date
}

export interface PatternStats {
  readonly name: string
  readonly successCount: number
  readonly totalCount: number
  readonly successRate: number
}

export interface FailureReasonStats {
  readonly reason: string
  readonly count: number
}

export interface OutcomeAnalysis {
  readonly totalExecutions: number
  readonly overallSuccessRate: number
  readonly successRateByTaskType: Record<string, number>
  readonly topPatterns: ReadonlyArray<PatternStats>
  readonly topFailureReasons: ReadonlyArray<FailureReasonStats>
  readonly averageDurationMs: number
}

const calculateSuccessRate = (outcomes: ReadonlyArray<ExecutionOutcome>): number => {
  if (outcomes.length === 0) return 0
  const successes = outcomes.filter((o) => o.success).length
  return successes / outcomes.length
}

const groupByTaskType = (
  outcomes: ReadonlyArray<ExecutionOutcome>,
): Record<string, ReadonlyArray<ExecutionOutcome>> => {
  const groups: Record<string, ExecutionOutcome[]> = {}
  for (const outcome of outcomes) {
    const existing = groups[outcome.taskType]
    if (existing) {
      existing.push(outcome)
    } else {
      groups[outcome.taskType] = [outcome]
    }
  }
  return groups
}

const calculatePatternStats = (outcomes: ReadonlyArray<ExecutionOutcome>): ReadonlyArray<PatternStats> => {
  const patternMap = new Map<string, { successCount: number; totalCount: number }>()

  for (const outcome of outcomes) {
    for (const pattern of outcome.patternsUsed) {
      const existing = patternMap.get(pattern) ?? { successCount: 0, totalCount: 0 }
      patternMap.set(pattern, {
        successCount: existing.successCount + (outcome.success ? 1 : 0),
        totalCount: existing.totalCount + 1,
      })
    }
  }

  return Array.from(patternMap.entries())
    .map(([name, stats]) => ({
      name,
      successCount: stats.successCount,
      totalCount: stats.totalCount,
      successRate: stats.totalCount > 0 ? stats.successCount / stats.totalCount : 0,
    }))
    .sort((a, b) => b.successRate - a.successRate || b.successCount - a.successCount)
}

const calculateFailureReasons = (
  outcomes: ReadonlyArray<ExecutionOutcome>,
): ReadonlyArray<FailureReasonStats> => {
  const reasonMap = new Map<string, number>()

  for (const outcome of outcomes) {
    if (!outcome.success && outcome.failureReason !== undefined) {
      const count = reasonMap.get(outcome.failureReason) ?? 0
      reasonMap.set(outcome.failureReason, count + 1)
    }
  }

  return Array.from(reasonMap.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
}

const calculateAverageDuration = (outcomes: ReadonlyArray<ExecutionOutcome>): number => {
  if (outcomes.length === 0) return 0
  const total = outcomes.reduce((sum, o) => sum + o.durationMs, 0)
  return total / outcomes.length
}

export const analyzeOutcomes = (outcomes: ReadonlyArray<ExecutionOutcome>): OutcomeAnalysis => {
  const grouped = groupByTaskType(outcomes)
  const successRateByTaskType: Record<string, number> = {}

  for (const [taskType, group] of Object.entries(grouped)) {
    successRateByTaskType[taskType] = calculateSuccessRate(group)
  }

  return {
    totalExecutions: outcomes.length,
    overallSuccessRate: calculateSuccessRate(outcomes),
    successRateByTaskType,
    topPatterns: calculatePatternStats(outcomes),
    topFailureReasons: calculateFailureReasons(outcomes),
    averageDurationMs: calculateAverageDuration(outcomes),
  }
}
