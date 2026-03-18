export const TddPhase = {
  RED: 'RED',
  GREEN: 'GREEN',
  REFACTOR: 'REFACTOR',
} as const
export type TddPhase = (typeof TddPhase)[keyof typeof TddPhase]

export interface TddState {
  readonly phase: TddPhase
  readonly criterionIndex: number
  readonly criteria: readonly string[]
  readonly completed: boolean
}

export type TddAction =
  | { readonly type: 'write_test'; readonly criterion: string }
  | { readonly type: 'implement'; readonly criterion: string }
  | { readonly type: 'refactor'; readonly criterion: string }
  | { readonly type: 'done' }

export const createTddState = (criteria: readonly string[]): TddState => ({
  phase: TddPhase.RED,
  criterionIndex: 0,
  criteria,
  completed: false,
})

const phaseActionMap: Record<TddPhase, 'write_test' | 'implement' | 'refactor'> = {
  [TddPhase.RED]: 'write_test',
  [TddPhase.GREEN]: 'implement',
  [TddPhase.REFACTOR]: 'refactor',
}

export const nextAction = (state: TddState): TddAction => {
  if (state.completed) {
    return { type: 'done' }
  }

  const actionType = phaseActionMap[state.phase]
  return {
    type: actionType,
    criterion: state.criteria[state.criterionIndex]!,
  }
}

const phaseTransitions: Record<TddPhase, TddPhase> = {
  [TddPhase.RED]: TddPhase.GREEN,
  [TddPhase.GREEN]: TddPhase.REFACTOR,
  [TddPhase.REFACTOR]: TddPhase.RED,
}

export const advancePhase = (state: TddState): TddState => {
  if (state.completed) {
    return state
  }

  const nextPhase = phaseTransitions[state.phase]
  const advancingCriterion = state.phase === TddPhase.REFACTOR
  const nextIndex = advancingCriterion ? state.criterionIndex + 1 : state.criterionIndex
  const isCompleted = advancingCriterion && nextIndex >= state.criteria.length

  return {
    phase: nextPhase,
    criterionIndex: nextIndex,
    criteria: state.criteria,
    completed: isCompleted,
  }
}
