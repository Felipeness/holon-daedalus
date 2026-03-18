import { Effect } from 'effect'

export const RestartStrategy = {
  ONE_FOR_ONE: 'ONE_FOR_ONE',
  ALL_FOR_ONE: 'ALL_FOR_ONE',
} as const
export type RestartStrategy = (typeof RestartStrategy)[keyof typeof RestartStrategy]

export interface SupervisorConfig {
  readonly strategy: RestartStrategy
  readonly maxRestarts: number
  readonly windowMs: number
}

export interface SupervisorState {
  readonly restartCounts: Map<string, number[]>
  readonly config: SupervisorConfig
}

export const createSupervisor = (config: SupervisorConfig): SupervisorState => ({
  restartCounts: new Map(),
  config,
})

export const shouldRestart = (state: SupervisorState, actorId: string): boolean => {
  const now = Date.now()
  const counts = state.restartCounts.get(actorId) ?? []
  const recentRestarts = counts.filter((t) => now - t < state.config.windowMs)
  return recentRestarts.length < state.config.maxRestarts
}

export const recordRestart = (state: SupervisorState, actorId: string): void => {
  const counts = state.restartCounts.get(actorId) ?? []
  counts.push(Date.now())
  state.restartCounts.set(actorId, counts)
}
