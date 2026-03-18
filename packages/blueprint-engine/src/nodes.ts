import type { BlueprintId, HolonId, TaskId } from '@holon/shared'
import type { TaskState } from '@holon/shared'

interface BaseNode {
  readonly id: TaskId
  readonly blueprintId: BlueprintId
  readonly name: string
  readonly state: TaskState
  readonly dependsOn: ReadonlyArray<TaskId>
}

export interface DeterministicNode extends BaseNode {
  readonly _tag: 'Deterministic'
  readonly command: string
  readonly args: ReadonlyArray<string>
  readonly timeoutMs: number
}

export interface AgenticNode extends BaseNode {
  readonly _tag: 'Agentic'
  readonly assignedHolon: HolonId
  readonly prompt: string
  readonly maxIterations: number
  readonly qualityThreshold: number
}

export interface GateNode extends BaseNode {
  readonly _tag: 'Gate'
  readonly condition: string
  readonly trueBranch: TaskId
  readonly falseBranch: TaskId
}

export interface ParallelNode extends BaseNode {
  readonly _tag: 'Parallel'
  readonly children: ReadonlyArray<TaskId>
  readonly failureStrategy: 'fail-fast' | 'settle-all'
}

export type BlueprintNode = DeterministicNode | AgenticNode | GateNode | ParallelNode

export const isDeterministic = (node: BlueprintNode): node is DeterministicNode =>
  node._tag === 'Deterministic'

export const isAgentic = (node: BlueprintNode): node is AgenticNode => node._tag === 'Agentic'

export const isGate = (node: BlueprintNode): node is GateNode => node._tag === 'Gate'

export const isParallel = (node: BlueprintNode): node is ParallelNode => node._tag === 'Parallel'
