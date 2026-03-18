import type { Severity } from './review-engine.js'

export interface SecurityFinding {
  readonly file: string
  readonly line: number
  readonly rule: string
  readonly severity: Severity
  readonly message: string
}

export interface SecurityResult {
  readonly pass: boolean
  readonly findings: readonly SecurityFinding[]
}

interface SecurityRule {
  readonly name: string
  readonly pattern: RegExp
  readonly severity: Severity
  readonly message: string
}

const SECURITY_RULES: readonly SecurityRule[] = [
  {
    name: 'no-eval',
    pattern: /\beval\s*\(/,
    severity: 'ERROR',
    message: 'Use of eval() is a code injection risk',
  },
  {
    name: 'no-innerHTML',
    pattern: /\.innerHTML\s*=/,
    severity: 'ERROR',
    message: 'Direct innerHTML assignment enables XSS attacks',
  },
  {
    name: 'no-sql-concatenation',
    pattern: /(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\s+.*['"`]\s*\+|\+\s*['"`].*(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)/i,
    severity: 'ERROR',
    message: 'SQL string concatenation enables SQL injection',
  },
  {
    name: 'no-hardcoded-api-key',
    pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}['"]/i,
    severity: 'ERROR',
    message: 'Hardcoded API key detected',
  },
  {
    name: 'no-hardcoded-password',
    pattern: /(?:password|passwd|pwd|secret)\s*[:=]\s*['"][^'"]{4,}['"]/i,
    severity: 'ERROR',
    message: 'Hardcoded password or secret detected',
  },
  {
    name: 'no-hardcoded-token',
    pattern: /(?:token|bearer)\s*[:=]\s*['"][A-Za-z0-9_\-\.]{16,}['"]/i,
    severity: 'ERROR',
    message: 'Hardcoded token detected',
  },
] as const

export const scanSecurity = (
  fileContent: string,
  filePath: string,
): SecurityResult => {
  const lines = fileContent.split('\n')
  const findings: SecurityFinding[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!

    for (const rule of SECURITY_RULES) {
      if (rule.pattern.test(line)) {
        findings.push({
          file: filePath,
          line: i + 1,
          rule: rule.name,
          severity: rule.severity,
          message: rule.message,
        })
      }
    }
  }

  return {
    pass: findings.length === 0,
    findings,
  }
}
