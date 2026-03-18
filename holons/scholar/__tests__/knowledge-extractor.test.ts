import { describe, it, expect } from 'vitest'
import {
  extractKnowledge,
  type ExecutionResult,
  type ExtractedEntity,
  type ExtractedRelation,
} from '../domain/knowledge-extractor.js'

const makeResult = (overrides: Partial<ExecutionResult> = {}): ExecutionResult => ({
  taskId: 'task-1',
  taskType: 'CODE_GENERATION',
  success: true,
  filesModified: [],
  testsRun: [],
  patternsUsed: [],
  decisions: [],
  timestamp: new Date('2025-01-15T10:00:00Z'),
  ...overrides,
})

describe('extractKnowledge', () => {
  it('extracts file entities from modified files', () => {
    const result = makeResult({
      filesModified: [
        { path: 'src/utils.ts', action: 'created' },
        { path: 'src/index.ts', action: 'modified' },
      ],
    })

    const { entities } = extractKnowledge(result)
    const fileEntities = entities.filter((e) => e.type === 'FILE')

    expect(fileEntities).toHaveLength(2)
    expect(fileEntities[0]).toEqual(
      expect.objectContaining({
        type: 'FILE',
        name: 'src/utils.ts',
        properties: { path: 'src/utils.ts', action: 'created' },
      }),
    )
    expect(fileEntities[1]).toEqual(
      expect.objectContaining({
        type: 'FILE',
        name: 'src/index.ts',
        properties: { path: 'src/index.ts', action: 'modified' },
      }),
    )
  })

  it('extracts function entities from tests run', () => {
    const result = makeResult({
      testsRun: [
        { name: 'validates input correctly', passed: true, file: 'test/input.test.ts' },
        { name: 'rejects invalid email', passed: false, file: 'test/input.test.ts' },
      ],
    })

    const { entities } = extractKnowledge(result)
    const functionEntities = entities.filter((e) => e.type === 'FUNCTION')

    expect(functionEntities).toHaveLength(2)
    expect(functionEntities[0]).toEqual(
      expect.objectContaining({
        type: 'FUNCTION',
        name: 'validates input correctly',
        properties: { passed: true, file: 'test/input.test.ts' },
      }),
    )
  })

  it('extracts pattern entities from patterns used', () => {
    const result = makeResult({
      patternsUsed: [
        { name: 'repository-pattern', context: 'data access layer' },
        { name: 'factory-method', context: 'object creation' },
      ],
    })

    const { entities } = extractKnowledge(result)
    const patternEntities = entities.filter((e) => e.type === 'PATTERN')

    expect(patternEntities).toHaveLength(2)
    expect(patternEntities[0]).toEqual(
      expect.objectContaining({
        type: 'PATTERN',
        name: 'repository-pattern',
        properties: { context: 'data access layer' },
      }),
    )
  })

  it('extracts decision entities', () => {
    const result = makeResult({
      decisions: [
        { description: 'use Effect-TS for error handling', rationale: 'type-safe errors' },
      ],
    })

    const { entities } = extractKnowledge(result)
    const decisionEntities = entities.filter((e) => e.type === 'DECISION')

    expect(decisionEntities).toHaveLength(1)
    expect(decisionEntities[0]).toEqual(
      expect.objectContaining({
        type: 'DECISION',
        name: 'use Effect-TS for error handling',
        properties: { rationale: 'type-safe errors' },
      }),
    )
  })

  it('creates modifies relations for file entities', () => {
    const result = makeResult({
      filesModified: [{ path: 'src/utils.ts', action: 'created' }],
    })

    const { relations } = extractKnowledge(result)
    const modifiesRelations = relations.filter((r) => r.type === 'modifies')

    expect(modifiesRelations).toHaveLength(1)
    expect(modifiesRelations[0]).toEqual(
      expect.objectContaining({
        type: 'modifies',
        fromEntityRef: 'task:task-1',
        toEntityRef: 'file:src/utils.ts',
      }),
    )
  })

  it('creates tested_by relations for test entities', () => {
    const result = makeResult({
      testsRun: [{ name: 'validates input', passed: true, file: 'test/input.test.ts' }],
    })

    const { relations } = extractKnowledge(result)
    const testedByRelations = relations.filter((r) => r.type === 'tested_by')

    expect(testedByRelations).toHaveLength(1)
    expect(testedByRelations[0]).toEqual(
      expect.objectContaining({
        type: 'tested_by',
        fromEntityRef: 'task:task-1',
        toEntityRef: 'function:validates input',
      }),
    )
  })

  it('creates used_pattern relations for pattern entities', () => {
    const result = makeResult({
      patternsUsed: [{ name: 'repository-pattern', context: 'data access' }],
    })

    const { relations } = extractKnowledge(result)
    const usedPatternRelations = relations.filter((r) => r.type === 'used_pattern')

    expect(usedPatternRelations).toHaveLength(1)
    expect(usedPatternRelations[0]).toEqual(
      expect.objectContaining({
        type: 'used_pattern',
        fromEntityRef: 'task:task-1',
        toEntityRef: 'pattern:repository-pattern',
      }),
    )
  })

  it('creates created_by relations for decision entities', () => {
    const result = makeResult({
      decisions: [{ description: 'use Effect-TS', rationale: 'type safety' }],
    })

    const { relations } = extractKnowledge(result)
    const createdByRelations = relations.filter((r) => r.type === 'created_by')

    expect(createdByRelations).toHaveLength(1)
    expect(createdByRelations[0]).toEqual(
      expect.objectContaining({
        type: 'created_by',
        fromEntityRef: 'decision:use Effect-TS',
        toEntityRef: 'task:task-1',
      }),
    )
  })

  it('returns empty arrays for empty execution result', () => {
    const result = makeResult()
    const { entities, relations } = extractKnowledge(result)

    expect(entities).toHaveLength(0)
    expect(relations).toHaveLength(0)
  })

  it('generates deterministic entity refs for idempotency', () => {
    const result = makeResult({
      filesModified: [{ path: 'src/utils.ts', action: 'created' }],
    })

    const first = extractKnowledge(result)
    const second = extractKnowledge(result)

    expect(first.entities).toEqual(second.entities)
    expect(first.relations).toEqual(second.relations)
  })

  it('extracts all entity types from a complete execution result', () => {
    const result = makeResult({
      filesModified: [{ path: 'src/handler.ts', action: 'created' }],
      testsRun: [{ name: 'handles request', passed: true, file: 'test/handler.test.ts' }],
      patternsUsed: [{ name: 'strategy-pattern', context: 'routing' }],
      decisions: [{ description: 'use strategy for routing', rationale: 'extensibility' }],
    })

    const { entities, relations } = extractKnowledge(result)

    expect(entities.filter((e) => e.type === 'FILE')).toHaveLength(1)
    expect(entities.filter((e) => e.type === 'FUNCTION')).toHaveLength(1)
    expect(entities.filter((e) => e.type === 'PATTERN')).toHaveLength(1)
    expect(entities.filter((e) => e.type === 'DECISION')).toHaveLength(1)

    expect(relations.filter((r) => r.type === 'modifies')).toHaveLength(1)
    expect(relations.filter((r) => r.type === 'tested_by')).toHaveLength(1)
    expect(relations.filter((r) => r.type === 'used_pattern')).toHaveLength(1)
    expect(relations.filter((r) => r.type === 'created_by')).toHaveLength(1)
  })
})
