import type { ToolName } from './tool-policy.js'

export interface ExecutionConfig {
  readonly model: string
  readonly tools: readonly ToolName[]
  readonly timeoutMs: number
  readonly maxTurns: number
  readonly systemPrompt: string
}

export type ExecutionResult =
  | {
      readonly _tag: 'success'
      readonly output: string
      readonly tokensUsed: number
      readonly turnsUsed: number
    }
  | {
      readonly _tag: 'failure'
      readonly error: string
      readonly tokensUsed: number
      readonly turnsUsed: number
    }

export interface AgentExecutor {
  readonly execute: (
    config: ExecutionConfig,
    prompt: string,
  ) => Promise<ExecutionResult>
}
