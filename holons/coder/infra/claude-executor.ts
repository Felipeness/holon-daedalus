import { Effect } from "effect"
import { execSync } from "child_process"

export type ClaudeExecutionConfig = {
  readonly prompt: string
  readonly allowedTools?: readonly string[]
  readonly maxTurns?: number
  readonly outputFormat?: "text" | "json"
  readonly timeout?: number
  readonly cwd?: string
}

export type ClaudeResult = {
  readonly output: string
  readonly exitCode: number
}

export class ClaudeExecutionError {
  readonly _tag = "ClaudeExecutionError" as const
  constructor(readonly reason: string, readonly exitCode: number) {}
}

export const executeClaudeHeadless = (config: ClaudeExecutionConfig): Effect.Effect<ClaudeResult, ClaudeExecutionError> =>
  Effect.try({
    try: () => {
      const args = ["-p", config.prompt]

      if (config.allowedTools?.length) {
        args.push("--allowedTools", config.allowedTools.join(","))
      }
      if (config.maxTurns) {
        args.push("--max-turns", String(config.maxTurns))
      }
      if (config.outputFormat) {
        args.push("--output-format", config.outputFormat)
      }

      const cmd = `claude ${args.map(a => a.includes(" ") ? `"${a}"` : a).join(" ")}`
      const output = execSync(cmd, {
        encoding: "utf-8",
        timeout: config.timeout ?? 120_000,
        maxBuffer: 10 * 1024 * 1024,
        ...(config.cwd ? { cwd: config.cwd } : {}),
      })

      return { output: output.trim(), exitCode: 0 } as ClaudeResult
    },
    catch: (error: any) => new ClaudeExecutionError(
      error?.stderr?.toString() ?? error?.message ?? "Unknown error",
      error?.status ?? 1
    ),
  })
