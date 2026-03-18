export interface FileModified {
  readonly path: string
  readonly action: 'created' | 'modified' | 'deleted'
}

export interface TestRun {
  readonly name: string
  readonly passed: boolean
  readonly file: string
}

export interface PatternUsed {
  readonly name: string
  readonly context: string
}

export interface Decision {
  readonly description: string
  readonly rationale: string
}

export interface ExecutionResult {
  readonly taskId: string
  readonly taskType: string
  readonly success: boolean
  readonly filesModified: ReadonlyArray<FileModified>
  readonly testsRun: ReadonlyArray<TestRun>
  readonly patternsUsed: ReadonlyArray<PatternUsed>
  readonly decisions: ReadonlyArray<Decision>
  readonly timestamp: Date
}

export interface ExtractedEntity {
  readonly type: 'FILE' | 'FUNCTION' | 'PATTERN' | 'DECISION'
  readonly name: string
  readonly properties: Record<string, unknown>
}

export interface ExtractedRelation {
  readonly type: 'modifies' | 'tested_by' | 'used_pattern' | 'created_by'
  readonly fromEntityRef: string
  readonly toEntityRef: string
}

export interface ExtractionResult {
  readonly entities: ReadonlyArray<ExtractedEntity>
  readonly relations: ReadonlyArray<ExtractedRelation>
}

const extractFileEntities = (result: ExecutionResult): ReadonlyArray<ExtractedEntity> =>
  result.filesModified.map((file) => ({
    type: 'FILE' as const,
    name: file.path,
    properties: { path: file.path, action: file.action },
  }))

const extractFunctionEntities = (result: ExecutionResult): ReadonlyArray<ExtractedEntity> =>
  result.testsRun.map((test) => ({
    type: 'FUNCTION' as const,
    name: test.name,
    properties: { passed: test.passed, file: test.file },
  }))

const extractPatternEntities = (result: ExecutionResult): ReadonlyArray<ExtractedEntity> =>
  result.patternsUsed.map((pattern) => ({
    type: 'PATTERN' as const,
    name: pattern.name,
    properties: { context: pattern.context },
  }))

const extractDecisionEntities = (result: ExecutionResult): ReadonlyArray<ExtractedEntity> =>
  result.decisions.map((decision) => ({
    type: 'DECISION' as const,
    name: decision.description,
    properties: { rationale: decision.rationale },
  }))

const extractModifiesRelations = (result: ExecutionResult): ReadonlyArray<ExtractedRelation> =>
  result.filesModified.map((file) => ({
    type: 'modifies' as const,
    fromEntityRef: `task:${result.taskId}`,
    toEntityRef: `file:${file.path}`,
  }))

const extractTestedByRelations = (result: ExecutionResult): ReadonlyArray<ExtractedRelation> =>
  result.testsRun.map((test) => ({
    type: 'tested_by' as const,
    fromEntityRef: `task:${result.taskId}`,
    toEntityRef: `function:${test.name}`,
  }))

const extractUsedPatternRelations = (result: ExecutionResult): ReadonlyArray<ExtractedRelation> =>
  result.patternsUsed.map((pattern) => ({
    type: 'used_pattern' as const,
    fromEntityRef: `task:${result.taskId}`,
    toEntityRef: `pattern:${pattern.name}`,
  }))

const extractCreatedByRelations = (result: ExecutionResult): ReadonlyArray<ExtractedRelation> =>
  result.decisions.map((decision) => ({
    type: 'created_by' as const,
    fromEntityRef: `decision:${decision.description}`,
    toEntityRef: `task:${result.taskId}`,
  }))

export const extractKnowledge = (result: ExecutionResult): ExtractionResult => {
  const entities = [
    ...extractFileEntities(result),
    ...extractFunctionEntities(result),
    ...extractPatternEntities(result),
    ...extractDecisionEntities(result),
  ]

  const relations = [
    ...extractModifiesRelations(result),
    ...extractTestedByRelations(result),
    ...extractUsedPatternRelations(result),
    ...extractCreatedByRelations(result),
  ]

  return { entities, relations }
}
