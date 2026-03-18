export interface CoverageFileEntry {
  readonly lines: {
    readonly total: number
    readonly covered: number
    readonly pct: number
  }
}

export interface CoverageReport {
  readonly total: {
    readonly lines: {
      readonly total: number
      readonly covered: number
      readonly pct: number
    }
  }
  readonly [filePath: string]: CoverageFileEntry | CoverageReport['total']
}

export interface CoverageResult {
  readonly pass: boolean
  readonly percentage: number
  readonly threshold: number
  readonly uncoveredFiles: readonly string[]
}

const DEFAULT_COVERAGE_THRESHOLD = 80

export const checkCoverage = (
  report: CoverageReport,
  threshold = DEFAULT_COVERAGE_THRESHOLD,
): CoverageResult => {
  const percentage = report.total.lines.pct
  const uncoveredFiles: string[] = []

  for (const [key, value] of Object.entries(report)) {
    if (key === 'total') continue

    const entry = value as CoverageFileEntry
    if (entry.lines.pct < threshold) {
      uncoveredFiles.push(key)
    }
  }

  return {
    pass: percentage >= threshold,
    percentage,
    threshold,
    uncoveredFiles,
  }
}
