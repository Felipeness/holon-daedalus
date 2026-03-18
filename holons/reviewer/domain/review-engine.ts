export const Severity = {
  ERROR: 'ERROR',
  WARNING: 'WARNING',
  INFO: 'INFO',
} as const
export type Severity = (typeof Severity)[keyof typeof Severity]

export interface Finding {
  readonly file: string
  readonly line: number
  readonly rule: string
  readonly severity: Severity
  readonly message: string
}

export interface QualityScore {
  readonly score: number
  readonly pass: boolean
  readonly threshold: number
  readonly findings: readonly Finding[]
}

export interface ReviewInput {
  readonly fileContent: string
  readonly diff: string
  readonly filePath: string
}

const DEFAULT_THRESHOLD = 80
const MAX_FUNCTION_LINES = 20
const MAX_NESTING_DEPTH = 2

const FUNCTION_PATTERN = /^(\s*)(?:export\s+)?(?:async\s+)?(?:function\s+\w+|(?:const|let)\s+\w+\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=])\s*=>|(?:const|let)\s+\w+\s*=\s*(?:async\s+)?function)/

const countFunctionLines = (lines: readonly string[], startIdx: number): number => {
  const startLine = lines[startIdx]
  if (!startLine) return 0

  let braceCount = 0
  let foundOpen = false

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i]!
    for (const ch of line) {
      if (ch === '{') {
        braceCount++
        foundOpen = true
      }
      if (ch === '}') braceCount--
    }
    if (foundOpen && braceCount === 0) {
      return i - startIdx + 1
    }
  }
  return lines.length - startIdx
}

const checkFunctionLength = (
  lines: readonly string[],
  filePath: string,
): readonly Finding[] => {
  const findings: Finding[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (FUNCTION_PATTERN.test(line)) {
      const length = countFunctionLines(lines, i)
      if (length > MAX_FUNCTION_LINES) {
        findings.push({
          file: filePath,
          line: i + 1,
          rule: 'function-length',
          severity: Severity.WARNING,
          message: `Function has ${length} lines (max ${MAX_FUNCTION_LINES})`,
        })
      }
    }
  }

  return findings
}

const measureNestingDepth = (line: string): number => {
  const stripped = line.replace(/^\s*/, '')
  if (stripped.length === 0) return 0

  const indent = line.length - stripped.length
  const tabEquivalent = line.startsWith('\t')
    ? indent
    : Math.floor(indent / 2)

  return tabEquivalent
}

const checkNestingDepth = (
  lines: readonly string[],
  filePath: string,
): readonly Finding[] => {
  const findings: Finding[] = []
  const reportedLines = new Set<number>()

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const depth = measureNestingDepth(line)
    const lineNum = i + 1
    if (depth > MAX_NESTING_DEPTH && !reportedLines.has(lineNum)) {
      reportedLines.add(lineNum)
      findings.push({
        file: filePath,
        line: lineNum,
        rule: 'nesting-depth',
        severity: Severity.WARNING,
        message: `Nesting depth is ${depth} (max ${MAX_NESTING_DEPTH})`,
      })
    }
  }

  return findings
}

const NAMING_PATTERNS = {
  camelCase: /^[a-z][a-zA-Z0-9]*$/,
  PascalCase: /^[A-Z][a-zA-Z0-9]*$/,
} as const

const checkNamingConventions = (
  lines: readonly string[],
  filePath: string,
): readonly Finding[] => {
  const findings: Finding[] = []
  const varPattern = /(?:const|let|var)\s+([A-Z_][A-Z_0-9]*|[a-z][a-zA-Z0-9]*)\s*[=:]/
  const funcPattern = /function\s+([a-zA-Z_][a-zA-Z0-9_]*)/
  const SCREAMING_SNAKE = /^[A-Z][A-Z_0-9]*$/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!

    const funcMatch = funcPattern.exec(line)
    if (funcMatch) {
      const name = funcMatch[1]!
      if (!NAMING_PATTERNS.camelCase.test(name) && !NAMING_PATTERNS.PascalCase.test(name)) {
        findings.push({
          file: filePath,
          line: i + 1,
          rule: 'naming-convention',
          severity: Severity.INFO,
          message: `Function name "${name}" does not follow camelCase or PascalCase`,
        })
      }
    }

    const varMatch = varPattern.exec(line)
    if (varMatch) {
      const name = varMatch[1]!
      if (
        !NAMING_PATTERNS.camelCase.test(name) &&
        !NAMING_PATTERNS.PascalCase.test(name) &&
        !SCREAMING_SNAKE.test(name)
      ) {
        findings.push({
          file: filePath,
          line: i + 1,
          rule: 'naming-convention',
          severity: Severity.INFO,
          message: `Variable name "${name}" does not follow camelCase, PascalCase, or SCREAMING_SNAKE_CASE`,
        })
      }
    }
  }

  return findings
}

const calculateScore = (findings: readonly Finding[]): number => {
  let deductions = 0

  for (const finding of findings) {
    switch (finding.severity) {
      case Severity.ERROR:
        deductions += 15
        break
      case Severity.WARNING:
        deductions += 5
        break
      case Severity.INFO:
        deductions += 2
        break
    }
  }

  return Math.max(0, 100 - deductions)
}

export const reviewCode = (
  input: ReviewInput,
  threshold = DEFAULT_THRESHOLD,
): QualityScore => {
  const lines = input.fileContent.split('\n')

  const findings = [
    ...checkFunctionLength(lines, input.filePath),
    ...checkNestingDepth(lines, input.filePath),
    ...checkNamingConventions(lines, input.filePath),
  ]

  const score = calculateScore(findings)

  return {
    score,
    pass: score >= threshold,
    threshold,
    findings,
  }
}
