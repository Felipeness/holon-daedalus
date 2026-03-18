import { describe, it, expect } from 'vitest'
import { scanSecurity } from '../domain/security-scanner.js'

describe('scanSecurity', () => {
  it('detects eval usage', () => {
    const content = 'const result = eval("2 + 2")'

    const result = scanSecurity(content, 'test.ts')

    expect(result.pass).toBe(false)
    expect(result.findings).toHaveLength(1)
    expect(result.findings[0]!.rule).toBe('no-eval')
    expect(result.findings[0]!.line).toBe(1)
  })

  it('detects innerHTML assignment', () => {
    const content = [
      'const el = document.getElementById("app")',
      'el.innerHTML = userInput',
    ].join('\n')

    const result = scanSecurity(content, 'test.ts')

    expect(result.pass).toBe(false)
    const finding = result.findings.find(f => f.rule === 'no-innerHTML')
    expect(finding).toBeDefined()
    expect(finding!.line).toBe(2)
  })

  it('detects SQL string concatenation', () => {
    const content = 'const query = "SELECT * FROM users WHERE id = " + userId'

    const result = scanSecurity(content, 'db.ts')

    expect(result.pass).toBe(false)
    const finding = result.findings.find(f => f.rule === 'no-sql-concatenation')
    expect(finding).toBeDefined()
    expect(finding!.message).toContain('SQL injection')
  })

  it('detects hardcoded API keys', () => {
    const content = 'const apiKey = "sk_live_1234567890abcdef1234"'

    const result = scanSecurity(content, 'config.ts')

    expect(result.pass).toBe(false)
    const finding = result.findings.find(f => f.rule === 'no-hardcoded-api-key')
    expect(finding).toBeDefined()
  })

  it('detects hardcoded passwords', () => {
    const content = 'const password = "super_secret_password123"'

    const result = scanSecurity(content, 'auth.ts')

    expect(result.pass).toBe(false)
    const finding = result.findings.find(f => f.rule === 'no-hardcoded-password')
    expect(finding).toBeDefined()
  })

  it('detects hardcoded tokens', () => {
    const content = 'const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abcdef"'

    const result = scanSecurity(content, 'auth.ts')

    expect(result.pass).toBe(false)
    const finding = result.findings.find(f => f.rule === 'no-hardcoded-token')
    expect(finding).toBeDefined()
  })

  it('passes clean code with no violations', () => {
    const content = [
      'import { db } from "./database"',
      '',
      'const getUser = async (id: string) => {',
      '  return db.query("SELECT * FROM users WHERE id = $1", [id])',
      '}',
    ].join('\n')

    const result = scanSecurity(content, 'user.ts')

    expect(result.pass).toBe(true)
    expect(result.findings).toHaveLength(0)
  })

  it('reports multiple findings in the same file', () => {
    const content = [
      'const apiKey = "sk_live_abcdef1234567890abcd"',
      'const x = eval(input)',
      'el.innerHTML = data',
    ].join('\n')

    const result = scanSecurity(content, 'bad.ts')

    expect(result.pass).toBe(false)
    expect(result.findings.length).toBeGreaterThanOrEqual(3)
  })

  it('includes correct file path in findings', () => {
    const content = 'eval("code")'

    const result = scanSecurity(content, 'src/danger.ts')

    expect(result.findings[0]!.file).toBe('src/danger.ts')
  })

  it('assigns ERROR severity to all security findings', () => {
    const content = 'eval("code")'

    const result = scanSecurity(content, 'test.ts')

    for (const finding of result.findings) {
      expect(finding.severity).toBe('ERROR')
    }
  })
})
