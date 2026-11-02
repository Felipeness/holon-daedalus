import { describe, it, expect } from 'vitest'
import { composePR } from '../domain/pr-composer.js'
import type { PRInput } from '../domain/pr-composer.js'

const makeInput = (overrides: Partial<PRInput> = {}): PRInput => ({
  taskDescription: 'add user validation to registration endpoint',
  changesSummary: '- Added zod schema for user input\n- Added validation middleware',
  testResults: 'All 12 tests passing. Coverage: 95%',
  taskType: 'feat',
  ...overrides,
})

describe('composePR', () => {
  it('generates title in conventional commit format', () => {
    const result = composePR(makeInput())

    expect(result.title).toMatch(/^feat: /)
    expect(result.title).toBe('feat: add user validation to registration endpoint')
  })

  it('includes scope in title when provided', () => {
    const result = composePR(makeInput({ scope: 'auth' }))

    expect(result.title).toMatch(/^feat\(auth\): /)
  })

  it('generates body with Summary section', () => {
    const result = composePR(makeInput())

    expect(result.body).toContain('## Summary')
    expect(result.body).toContain('add user validation to registration endpoint')
  })

  it('generates body with Changes section', () => {
    const result = composePR(makeInput())

    expect(result.body).toContain('## Changes')
    expect(result.body).toContain('Added zod schema')
  })

  it('generates body with Testing section', () => {
    const result = composePR(makeInput())

    expect(result.body).toContain('## Testing')
    expect(result.body).toContain('All 12 tests passing')
  })

  it('generates body with Jira link when ticket provided', () => {
    const result = composePR(makeInput({ jiraTicket: 'CC-1234', jiraBaseUrl: 'https://example.atlassian.net' }))

    expect(result.body).toContain('## Jira')
    expect(result.body).toContain('https://example.atlassian.net/browse/CC-1234')
    expect(result.body).toContain('[CC-1234]')
  })

  it('generates body with plain ticket when Jira base url missing', () => {
    const result = composePR(makeInput({ jiraTicket: 'CC-1234' }))

    expect(result.body).not.toContain('](')
  })

  it('generates body with N/A when no Jira ticket', () => {
    const result = composePR(makeInput({ jiraTicket: undefined }))

    expect(result.body).toContain('N/A (no ticket)')
  })

  it('uses correct task type prefix', () => {
    const fixResult = composePR(makeInput({ taskType: 'fix' }))
    const choreResult = composePR(makeInput({ taskType: 'chore' }))

    expect(fixResult.title).toMatch(/^fix: /)
    expect(choreResult.title).toMatch(/^chore: /)
  })

  it('lowercases title description', () => {
    const result = composePR(makeInput({
      taskDescription: 'Add User Validation',
    }))

    expect(result.title).toBe('feat: add user validation')
  })

  it('strips trailing punctuation from title', () => {
    const result = composePR(makeInput({
      taskDescription: 'fix broken authentication.',
      taskType: 'fix',
    }))

    expect(result.title).toBe('fix: fix broken authentication')
  })

  it('truncates title to max 72 characters', () => {
    const result = composePR(makeInput({
      taskDescription: 'implement a very long description that exceeds the maximum allowed character limit for conventional commit titles',
    }))

    expect(result.title.length).toBeLessThanOrEqual(72)
  })
})
