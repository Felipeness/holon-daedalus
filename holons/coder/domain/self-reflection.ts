const REFLECTION_THRESHOLD = 3

export interface AttemptResult {
  readonly success: boolean
  readonly error: string | undefined
  readonly phase: string
  readonly attemptNumber: number
}

export interface ContinueResult {
  readonly type: 'continue'
}

export interface ReflectionResult {
  readonly type: 'reflect'
  readonly analysis: string
  readonly revisedApproach: string
  readonly failurePatterns: readonly string[]
}

export type ReflectOutcome = ContinueResult | ReflectionResult

const countTrailingFailures = (attempts: readonly AttemptResult[]): readonly AttemptResult[] => {
  const trailing: AttemptResult[] = []

  for (let i = attempts.length - 1; i >= 0; i--) {
    if (attempts[i]!.success) break
    trailing.unshift(attempts[i]!)
  }

  return trailing
}

const extractUniqueErrors = (failures: readonly AttemptResult[]): readonly string[] => {
  const unique = new Set<string>()
  for (const f of failures) {
    if (f.error !== undefined) {
      unique.add(f.error)
    }
  }
  return [...unique]
}

const buildAnalysis = (failures: readonly AttemptResult[]): string => {
  const phases = failures.map((f) => f.phase)
  const uniquePhases = [...new Set(phases)]
  return `${failures.length} consecutive failures detected across phases: ${uniquePhases.join(', ')}. Current approach is not converging.`
}

const buildRevisedApproach = (patterns: readonly string[]): string =>
  `Re-examine assumptions. Recurring errors: ${patterns.join('; ')}. Consider: simplify the implementation, check types, verify test expectations match the actual API.`

export const reflect = (attempts: readonly AttemptResult[]): ReflectOutcome => {
  const trailingFailures = countTrailingFailures(attempts)

  if (trailingFailures.length < REFLECTION_THRESHOLD) {
    return { type: 'continue' }
  }

  const failurePatterns = extractUniqueErrors(trailingFailures)
  const analysis = buildAnalysis(trailingFailures)
  const revisedApproach = buildRevisedApproach(failurePatterns)

  return {
    type: 'reflect',
    analysis,
    revisedApproach,
    failurePatterns,
  }
}
