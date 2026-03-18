import { TaskState } from '@holon/shared'

export type TaskTransition =
  | { readonly _tag: 'Start' }
  | { readonly _tag: 'Complete' }
  | { readonly _tag: 'Skip'; readonly reason: string }
  | { readonly _tag: 'Fail'; readonly error: string }
  | { readonly _tag: 'Reset' }

export const Start: TaskTransition = { _tag: 'Start' }
export const Complete: TaskTransition = { _tag: 'Complete' }
export const Skip = (reason: string): TaskTransition => ({ _tag: 'Skip', reason })
export const Fail = (error: string): TaskTransition => ({ _tag: 'Fail', error })
export const Reset: TaskTransition = { _tag: 'Reset' }

export interface TransitionResult {
  readonly success: boolean
  readonly from: TaskState
  readonly to: TaskState
  readonly reason?: string
}

const validTransitions: Record<TaskState, ReadonlyArray<TaskState>> = {
  [TaskState.PENDING]: [TaskState.IN_PROGRESS, TaskState.SKIPPED],
  [TaskState.IN_PROGRESS]: [TaskState.COMPLETED, TaskState.FAILED, TaskState.SKIPPED],
  [TaskState.COMPLETED]: [],
  [TaskState.SKIPPED]: [TaskState.PENDING],
  [TaskState.FAILED]: [TaskState.PENDING],
}

export const transition = (current: TaskState, event: TaskTransition): TransitionResult => {
  const targetState = resolveTarget(current, event)

  if (!targetState) {
    return {
      success: false,
      from: current,
      to: current,
      reason: `Invalid transition: ${current} + ${event._tag}`,
    }
  }

  const allowed = validTransitions[current]
  if (!allowed.includes(targetState)) {
    return {
      success: false,
      from: current,
      to: current,
      reason: `Transition from ${current} to ${targetState} not allowed`,
    }
  }

  return { success: true, from: current, to: targetState }
}

const resolveTarget = (current: TaskState, event: TaskTransition): TaskState | null => {
  switch (event._tag) {
    case 'Start':
      return TaskState.IN_PROGRESS
    case 'Complete':
      return TaskState.COMPLETED
    case 'Skip':
      return TaskState.SKIPPED
    case 'Fail':
      return TaskState.FAILED
    case 'Reset':
      return TaskState.PENDING
    default:
      return null
  }
}

export const canTransition = (current: TaskState, target: TaskState): boolean =>
  validTransitions[current].includes(target)
