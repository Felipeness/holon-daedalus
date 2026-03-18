import { describe, it, expect } from 'vitest'
import { reviewCode, Severity } from '../domain/review-engine.js'
import type { ReviewInput } from '../domain/review-engine.js'

const makeInput = (content: string, filePath = 'test.ts'): ReviewInput => ({
  fileContent: content,
  diff: '',
  filePath,
})

describe('reviewCode', () => {
  it('scores short well-structured functions high', () => {
    const content = [
      'const add = (a: number, b: number) => {',
      '  return a + b',
      '}',
      '',
      'const multiply = (a: number, b: number) => {',
      '  return a * b',
      '}',
    ].join('\n')

    const result = reviewCode(makeInput(content))

    expect(result.score).toBeGreaterThanOrEqual(90)
    expect(result.pass).toBe(true)
  })

  it('penalizes functions exceeding 20 lines', () => {
    const bodyLines = Array.from({ length: 25 }, (_, i) => `  const x${i} = ${i}`)
    const content = [
      'function longFunction() {',
      ...bodyLines,
      '}',
    ].join('\n')

    const result = reviewCode(makeInput(content))

    expect(result.score).toBeLessThan(100)
    const lengthFindings = result.findings.filter(f => f.rule === 'function-length')
    expect(lengthFindings).toHaveLength(1)
    expect(lengthFindings[0]!.severity).toBe(Severity.WARNING)
    expect(lengthFindings[0]!.line).toBe(1)
  })

  it('penalizes deeply nested code', () => {
    const content = [
      'function process() {',
      '  if (true) {',
      '    if (true) {',
      '      if (true) {',
      '        doSomething()',
      '      }',
      '    }',
      '  }',
      '}',
    ].join('\n')

    const result = reviewCode(makeInput(content))

    const nestingFindings = result.findings.filter(f => f.rule === 'nesting-depth')
    expect(nestingFindings.length).toBeGreaterThan(0)
  })

  it('allows nesting at depth 2 or less', () => {
    const content = [
      'function process() {',
      '  if (true) {',
      '    doSomething()',
      '  }',
      '}',
    ].join('\n')

    const result = reviewCode(makeInput(content))

    const nestingFindings = result.findings.filter(f => f.rule === 'nesting-depth')
    expect(nestingFindings).toHaveLength(0)
  })

  it('flags non-conventional naming', () => {
    const content = [
      'function my_bad_func() {',
      '  return 1',
      '}',
    ].join('\n')

    const result = reviewCode(makeInput(content))

    const namingFindings = result.findings.filter(f => f.rule === 'naming-convention')
    expect(namingFindings.length).toBeGreaterThan(0)
    expect(namingFindings[0]!.message).toContain('my_bad_func')
  })

  it('accepts camelCase and PascalCase names', () => {
    const content = [
      'function processData() {',
      '  return 1',
      '}',
      'function ProcessData() {',
      '  return 2',
      '}',
    ].join('\n')

    const result = reviewCode(makeInput(content))

    const namingFindings = result.findings.filter(f => f.rule === 'naming-convention')
    expect(namingFindings).toHaveLength(0)
  })

  it('respects custom threshold', () => {
    const content = [
      'const add = (a: number, b: number) => {',
      '  return a + b',
      '}',
    ].join('\n')

    const strict = reviewCode(makeInput(content), 100)
    const lenient = reviewCode(makeInput(content), 50)

    expect(strict.threshold).toBe(100)
    expect(lenient.threshold).toBe(50)
  })

  it('includes file path in findings', () => {
    const bodyLines = Array.from({ length: 25 }, (_, i) => `  const x${i} = ${i}`)
    const content = [
      'function longFunction() {',
      ...bodyLines,
      '}',
    ].join('\n')

    const result = reviewCode(makeInput(content, 'src/utils.ts'))

    expect(result.findings[0]!.file).toBe('src/utils.ts')
  })

  it('clamps score at 0 for many violations', () => {
    const funcs = Array.from({ length: 10 }, (_, i) => {
      const bodyLines = Array.from({ length: 25 }, (_, j) => `  const x${j} = ${j}`)
      return [
        `function long_func_${i}() {`,
        ...bodyLines,
        '}',
      ].join('\n')
    })

    const content = funcs.join('\n\n')
    const result = reviewCode(makeInput(content))

    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.pass).toBe(false)
  })
})
