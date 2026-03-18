import { describe, it, expect } from "vitest"
import { Effect } from "effect"
import { executeClaudeHeadless, ClaudeExecutionError } from "../infra/claude-executor.js"
import type { ClaudeExecutionConfig } from "../infra/claude-executor.js"

describe("claude-executor", () => {
  it("constructs correct config for simple prompt", () => {
    const config: ClaudeExecutionConfig = {
      prompt: "echo hello",
      allowedTools: ["Read", "Bash"] as const,
      maxTurns: 5,
      outputFormat: "text" as const,
      timeout: 30_000,
    }

    expect(config.prompt).toBe("echo hello")
    expect(config.allowedTools).toEqual(["Read", "Bash"])
    expect(config.maxTurns).toBe(5)
  })

  it("defaults are correct when optional fields omitted", () => {
    const config: ClaudeExecutionConfig = {
      prompt: "analyze this",
    }

    expect(config.prompt).toBe("analyze this")
    expect(config.allowedTools).toBeUndefined()
    expect(config.maxTurns).toBeUndefined()
    expect(config.outputFormat).toBeUndefined()
    expect(config.timeout).toBeUndefined()
  })

  it("ClaudeExecutionError has correct tag", () => {
    const error = new ClaudeExecutionError("something broke", 1)

    expect(error._tag).toBe("ClaudeExecutionError")
    expect(error.reason).toBe("something broke")
    expect(error.exitCode).toBe(1)
  })

  it("returns an Effect type", () => {
    const config: ClaudeExecutionConfig = { prompt: "test" }
    const result = executeClaudeHeadless(config)

    expect(Effect.isEffect(result)).toBe(true)
  })
})
