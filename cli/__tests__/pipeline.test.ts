import { describe, it, expect } from 'vitest'
import { Effect } from 'effect'
import { runDaedalusPipeline } from '../src/pipeline.js'

describe('runDaedalusPipeline', () => {
  it('classifies a feature task and produces full pipeline result', async () => {
    const result = await Effect.runPromise(
      runDaedalusPipeline('add user authentication with OAuth2'),
    )

    expect(result.classification.type).toBe('feature')
    expect(result.classification.risk).toBe('high')
    expect(result.context.technologies).toBeInstanceOf(Array)
    expect(result.subtasks.length).toBeGreaterThanOrEqual(1)
    expect(result.toolPolicy.allowedTools).toContain('Read')
    expect(result.tddPlan.state.phase).toBe('RED')
    expect(result.tddPlan.firstAction.type).toBe('write_test')
    expect(result.review.score).toBeGreaterThanOrEqual(0)
    expect(result.security.pass).toBe(true)
    expect(result.pr.title).toMatch(/^feat:/)
    expect(result.knowledge.entities.length).toBeGreaterThan(0)
    expect(result.knowledge.relations.length).toBeGreaterThan(0)
    expect(result.outcomes.totalExecutions).toBe(1)
  })

  it('classifies a bug fix task', async () => {
    const result = await Effect.runPromise(
      runDaedalusPipeline('fix crash in payment service when user is null'),
    )

    expect(result.classification.type).toBe('bug')
    expect(result.classification.risk).toBe('high')
    expect(result.pr.title).toMatch(/^fix:/)
    expect(result.toolPolicy.taskType).toBe('bug')
  })

  it('classifies a refactoring task', async () => {
    const result = await Effect.runPromise(
      runDaedalusPipeline('refactor the database connection pool'),
    )

    expect(result.classification.type).toBe('refactor')
    expect(result.pr.title).toMatch(/^refactor:/)
    expect(result.toolPolicy.taskType).toBe('refactor')
  })

  it('handles single-word task descriptions', async () => {
    const result = await Effect.runPromise(
      runDaedalusPipeline('deploy'),
    )

    expect(result.subtasks).toHaveLength(1)
    expect(result.subtasks[0]!.description).toBe('deploy')
  })

  it('decomposes multi-step tasks', async () => {
    const result = await Effect.runPromise(
      runDaedalusPipeline('add input validation then write integration tests'),
    )

    expect(result.subtasks.length).toBeGreaterThan(1)
    expect(result.tddPlan.state.criteria.length).toBe(result.subtasks.length)
  })

  it('detects security issues in generated content', async () => {
    const result = await Effect.runPromise(
      runDaedalusPipeline('create a simple utility function'),
    )

    expect(result.security.pass).toBe(true)
    expect(result.security.findings).toHaveLength(0)
  })

  it('produces valid knowledge graph entities and relations', async () => {
    const result = await Effect.runPromise(
      runDaedalusPipeline('implement search feature'),
    )

    const entityTypes = result.knowledge.entities.map((e) => e.type)
    expect(entityTypes).toContain('FILE')
    expect(entityTypes).toContain('FUNCTION')
    expect(entityTypes).toContain('PATTERN')
    expect(entityTypes).toContain('DECISION')

    const relationTypes = result.knowledge.relations.map((r) => r.type)
    expect(relationTypes).toContain('modifies')
    expect(relationTypes).toContain('tested_by')
    expect(relationTypes).toContain('used_pattern')
    expect(relationTypes).toContain('created_by')
  })
})
