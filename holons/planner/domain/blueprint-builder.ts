import { TaskId, BlueprintId, HolonId, TaskState } from '@holon/shared'
import type {
  BlueprintNode,
  DeterministicNode,
  AgenticNode,
  GateNode,
} from '@holon/blueprint-engine'

export interface BlueprintInput {
  readonly taskDescription: string
  readonly taskType: string
  readonly blueprintId: BlueprintId
  readonly assignedHolon: HolonId
}

export interface Blueprint {
  readonly id: BlueprintId
  readonly nodes: ReadonlyArray<BlueprintNode>
}

const DEFAULT_MAX_ITERATIONS = 5
const DEFAULT_QUALITY_THRESHOLD = 80
const DEFAULT_TIMEOUT_MS = 30_000

const makeNodeId = (name: string, blueprintId: string): TaskId =>
  TaskId(`${blueprintId}:${name}`)

export const buildBlueprint = (input: BlueprintInput): Blueprint => {
  const { taskDescription, blueprintId, assignedHolon } = input
  const bpId = blueprintId as string

  const lintId = makeNodeId('lint', bpId)
  const codeId = makeNodeId('code', bpId)
  const testId = makeNodeId('test', bpId)
  const gateId = makeNodeId('review-gate', bpId)
  const commitId = makeNodeId('commit', bpId)

  const lint: DeterministicNode = {
    _tag: 'Deterministic',
    id: lintId,
    blueprintId,
    name: 'lint',
    state: TaskState.PENDING,
    dependsOn: [],
    command: 'npx',
    args: ['eslint', '.', '--ext', '.ts'],
    timeoutMs: DEFAULT_TIMEOUT_MS,
  }

  const code: AgenticNode = {
    _tag: 'Agentic',
    id: codeId,
    blueprintId,
    name: 'code',
    state: TaskState.PENDING,
    dependsOn: [lintId],
    assignedHolon,
    prompt: `Implement the following task using TDD:\n${taskDescription}`,
    maxIterations: DEFAULT_MAX_ITERATIONS,
    qualityThreshold: DEFAULT_QUALITY_THRESHOLD,
  }

  const test: DeterministicNode = {
    _tag: 'Deterministic',
    id: testId,
    blueprintId,
    name: 'test',
    state: TaskState.PENDING,
    dependsOn: [codeId],
    command: 'npx',
    args: ['vitest', 'run'],
    timeoutMs: DEFAULT_TIMEOUT_MS * 2,
  }

  const reviewGate: GateNode = {
    _tag: 'Gate',
    id: gateId,
    blueprintId,
    name: 'review-gate',
    state: TaskState.PENDING,
    dependsOn: [testId],
    condition: 'tests_passed && quality_score >= 80',
    trueBranch: commitId,
    falseBranch: codeId,
  }

  const commit: DeterministicNode = {
    _tag: 'Deterministic',
    id: commitId,
    blueprintId,
    name: 'commit',
    state: TaskState.PENDING,
    dependsOn: [gateId],
    command: 'git',
    args: ['commit', '-m', `feat: ${taskDescription}`],
    timeoutMs: DEFAULT_TIMEOUT_MS,
  }

  return {
    id: blueprintId,
    nodes: [lint, code, test, reviewGate, commit],
  }
}
