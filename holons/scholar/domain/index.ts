export { extractKnowledge } from './knowledge-extractor.js'
export type {
  ExecutionResult,
  ExtractedEntity,
  ExtractedRelation,
  ExtractionResult,
  FileModified,
  TestRun,
  PatternUsed,
  Decision,
} from './knowledge-extractor.js'

export { analyzeOutcomes } from './outcome-analyzer.js'
export type {
  ExecutionOutcome,
  OutcomeAnalysis,
  PatternStats,
  FailureReasonStats,
} from './outcome-analyzer.js'

export { applyRelevanceDecay } from './relevance-decay.js'
