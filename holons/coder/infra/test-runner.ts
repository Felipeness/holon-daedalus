import { execSync } from 'node:child_process'

export const TestFramework = {
  vitest: 'vitest',
  jest: 'jest',
  goTest: 'go test',
} as const
export type TestFramework = (typeof TestFramework)[keyof typeof TestFramework]

export type TestResult =
  | { readonly _tag: 'pass'; readonly output: string }
  | { readonly _tag: 'fail'; readonly output: string }
  | { readonly _tag: 'error'; readonly output: string }

const frameworkDetectors: ReadonlyArray<{
  readonly framework: TestFramework
  readonly markers: readonly string[]
}> = [
  { framework: TestFramework.vitest, markers: ['vitest.config.ts', 'vitest.config.js'] },
  { framework: TestFramework.jest, markers: ['jest.config.ts', 'jest.config.js'] },
  { framework: TestFramework.goTest, markers: ['go.mod'] },
]

export const detectFramework = (workdir: string): TestFramework | undefined => {
  for (const { framework, markers } of frameworkDetectors) {
    for (const marker of markers) {
      try {
        execSync(`test -f "${workdir}/${marker}"`, { stdio: 'ignore' })
        return framework
      } catch {
        // marker not found, try next
      }
    }
  }
  return undefined
}

const frameworkCommands: Record<TestFramework, string> = {
  [TestFramework.vitest]: 'npx vitest run',
  [TestFramework.jest]: 'npx jest',
  [TestFramework.goTest]: 'go test ./...',
}

export const runTests = (
  workdir: string,
  framework: TestFramework,
  timeoutMs: number = 60_000,
): TestResult => {
  const command = frameworkCommands[framework]

  try {
    const output = execSync(command, {
      cwd: workdir,
      timeout: timeoutMs,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { _tag: 'pass', output }
  } catch (err: unknown) {
    if (err instanceof Error && 'status' in err) {
      const execError = err as Error & { stdout?: string; stderr?: string; status: number }
      const output = [execError.stdout, execError.stderr].filter(Boolean).join('\n')

      if (execError.status !== null) {
        return { _tag: 'fail', output }
      }
    }

    const message = err instanceof Error ? err.message : String(err)
    return { _tag: 'error', output: message }
  }
}
