import { execSync } from 'node:child_process'

export interface LintIssue {
  readonly tool: string
  readonly message: string
}

export interface LintResult {
  readonly passed: boolean
  readonly issues: readonly LintIssue[]
}

const runCommand = (command: string, workdir: string, timeoutMs: number): string | undefined => {
  try {
    execSync(command, {
      cwd: workdir,
      timeout: timeoutMs,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return undefined
  } catch (err: unknown) {
    if (err instanceof Error && 'stdout' in err) {
      const execError = err as Error & { stdout?: string; stderr?: string }
      return [execError.stdout, execError.stderr].filter(Boolean).join('\n')
    }
    return err instanceof Error ? err.message : String(err)
  }
}

const lintChecks: ReadonlyArray<{
  readonly tool: string
  readonly command: string
}> = [
  { tool: 'eslint', command: 'npx eslint . --ext .ts' },
  { tool: 'prettier', command: 'npx prettier --check .' },
  { tool: 'tsc', command: 'npx tsc --noEmit' },
]

export const runLint = (workdir: string, timeoutMs: number = 30_000): LintResult => {
  const issues: LintIssue[] = []

  for (const check of lintChecks) {
    const output = runCommand(check.command, workdir, timeoutMs)
    if (output !== undefined) {
      issues.push({ tool: check.tool, message: output })
    }
  }

  return {
    passed: issues.length === 0,
    issues,
  }
}
