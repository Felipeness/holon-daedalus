export const RalphPhase = {
  GENERATE: 'GENERATE',
  RUN_TESTS: 'RUN_TESTS',
  EVALUATE: 'EVALUATE',
  DECIDE: 'DECIDE',
} as const
export type RalphPhase = (typeof RalphPhase)[keyof typeof RalphPhase]

export interface RalphLoopConfig {
  readonly maxIterations: number
  readonly qualityThreshold: number
  readonly testCommand: string
  readonly evaluationPrompt: string
}

export interface RalphIterationResult {
  readonly phase: RalphPhase
  readonly iteration: number
  readonly passed: boolean
  readonly score: number
  readonly output: string
}
