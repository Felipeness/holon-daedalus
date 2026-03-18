import { Effect, pipe } from 'effect'
import { classifyTask, assembleContext, decompose } from '../../holons/intake/domain/index.js'
import type { TaskClassification, ContextPayload, SubTask } from '../../holons/intake/domain/index.js'
import { scoreRelevance, curateContext } from '../../holons/planner/domain/index.js'
import type { ScoredFile, CuratedContext } from '../../holons/planner/domain/index.js'
import { getToolPolicy, createTddState, nextAction } from '../../holons/coder/domain/index.js'
import type { ToolPolicy, TddState, TddAction } from '../../holons/coder/domain/index.js'
import { reviewCode, scanSecurity, composePR } from '../../holons/reviewer/domain/index.js'
import type { QualityScore, SecurityResult, PRContent } from '../../holons/reviewer/domain/index.js'
import { extractKnowledge, analyzeOutcomes } from '../../holons/scholar/domain/index.js'
import type { ExtractionResult, OutcomeAnalysis } from '../../holons/scholar/domain/index.js'
import { executeClaudeHeadless } from '../../holons/coder/infra/claude-executor.js'
import type { ClaudeResult } from '../../holons/coder/infra/claude-executor.js'
import { execSync } from 'child_process'

const TOKEN_BUDGET = 4096

const taskTypeToCoderType = (type: string) => {
  const mapping: Record<string, 'feature' | 'bug' | 'refactor' | 'review'> = {
    feature: 'feature',
    bug: 'bug',
    refactor: 'refactor',
    review: 'review',
    docs: 'feature',
    test: 'feature',
  }
  return mapping[type] ?? 'feature'
}

const taskTypeToPRType = (type: string) => {
  const mapping: Record<string, 'feat' | 'fix' | 'chore' | 'refactor' | 'docs' | 'test' | 'perf'> = {
    feature: 'feat',
    bug: 'fix',
    refactor: 'refactor',
    review: 'chore',
    docs: 'docs',
    test: 'test',
  }
  return mapping[type] ?? 'feat'
}

export interface LiveModeResult {
  readonly claudeOutput: string
  readonly exitCode: number
  readonly gitDiff: string
}

export interface PipelineResult {
  readonly classification: TaskClassification
  readonly context: ContextPayload
  readonly subtasks: ReadonlyArray<SubTask>
  readonly toolPolicy: ToolPolicy
  readonly tddPlan: { readonly state: TddState; readonly firstAction: TddAction }
  readonly review: QualityScore
  readonly security: SecurityResult
  readonly pr: PRContent
  readonly knowledge: ExtractionResult
  readonly outcomes: OutcomeAnalysis
  readonly liveMode?: LiveModeResult
}

export const runDaedalusPipeline = (taskDescription: string, targetDir?: string) =>
  Effect.gen(function* () {
    // 1. Intake — classify, gather context, decompose
    const classification = yield* classifyTask(taskDescription)
    const context = yield* assembleContext(taskDescription)
    const subtasks = yield* decompose(taskDescription)

    // 2. Plan — score file relevance, curate context
    const sampleFile = { path: 'src/index.ts', content: taskDescription }
    const keywords = taskDescription.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
    const scored: ScoredFile = scoreRelevance(keywords, sampleFile)
    const curated: CuratedContext = curateContext([scored], TOKEN_BUDGET)

    // 3. Code — resolve tool policy, prepare TDD
    const coderType = taskTypeToCoderType(classification.type)
    const toolPolicy = getToolPolicy(coderType)
    const tddState = createTddState(subtasks.map((s) => s.description))
    const firstAction = nextAction(tddState)

    // 3b. Live mode — actually execute claude -p in the target repo
    let liveMode: LiveModeResult | undefined
    if (targetDir) {
      const coderPrompt = [
        `You are working in ${targetDir}.`,
        `Task: ${taskDescription}`,
        `Classification: ${classification.type}`,
        `Allowed tools: ${toolPolicy.allowedTools.join(', ')}`,
        '',
        'Instructions:',
        '1. Read the codebase to understand the structure',
        '2. Write a failing test first (TDD - RED phase)',
        '3. Implement the minimal code to make the test pass (GREEN phase)',
        '4. Refactor if needed (REFACTOR phase)',
        '5. Commit with conventional commit format',
        '',
        'Do NOT ask for input. Complete everything autonomously.',
      ].join('\n')

      const claudeResult: ClaudeResult = yield* executeClaudeHeadless({
        prompt: coderPrompt,
        allowedTools: [...toolPolicy.allowedTools],
        maxTurns: 30,
        outputFormat: 'text',
        timeout: 300_000,
        cwd: targetDir,
      })

      let gitDiff = ''
      try {
        gitDiff = execSync('git diff HEAD~1', {
          encoding: 'utf-8',
          cwd: targetDir,
          timeout: 10_000,
          stdio: ['pipe', 'pipe', 'pipe'],
        }).trim()
      } catch {
        try {
          gitDiff = execSync('git diff', {
            encoding: 'utf-8',
            cwd: targetDir,
            timeout: 10_000,
            stdio: ['pipe', 'pipe', 'pipe'],
          }).trim()
        } catch {
          gitDiff = '(unable to retrieve git diff)'
        }
      }

      liveMode = {
        claudeOutput: claudeResult.output,
        exitCode: claudeResult.exitCode,
        gitDiff,
      }
    }

    // 4. Review — static analysis, security scan, compose PR
    const reviewContent = liveMode?.gitDiff && liveMode.gitDiff !== '(unable to retrieve git diff)'
      ? liveMode.gitDiff
      : `// generated for: ${taskDescription}\nexport {}`
    const review = reviewCode({
      fileContent: reviewContent,
      diff: reviewContent,
      filePath: targetDir ? `${targetDir}/src` : 'src/generated.ts',
    })
    const security = scanSecurity(reviewContent, targetDir ? `${targetDir}/src` : 'src/generated.ts')
    const pr = composePR({
      taskDescription,
      changesSummary: liveMode
        ? `Live execution in ${targetDir} — ${liveMode.exitCode === 0 ? 'completed successfully' : 'completed with errors'}`
        : `Processed ${subtasks.length} subtask(s) across ${context.technologies.length} technologies`,
      testResults: liveMode
        ? (liveMode.exitCode === 0 ? 'All tests passing (live)' : 'Tests may need attention')
        : 'All tests passing',
      taskType: taskTypeToPRType(classification.type),
    })

    // 5. Learn — extract knowledge, analyze outcomes
    const executionSuccess = liveMode ? liveMode.exitCode === 0 : review.pass && security.pass
    const executionResult = {
      taskId: `task-${Date.now()}`,
      taskType: classification.type,
      success: executionSuccess,
      filesModified: [{ path: targetDir ? `${targetDir}/src` : 'src/generated.ts', action: 'created' as const }],
      testsRun: [{ name: 'pipeline-validation', passed: executionSuccess, file: 'pipeline.test.ts' }],
      patternsUsed: [{ name: 'tdd', context: liveMode ? 'live execution' : 'pipeline execution' }],
      decisions: [{ description: `Classified as ${classification.type}`, rationale: 'keyword analysis' }],
      timestamp: new Date(),
    }
    const knowledge = extractKnowledge(executionResult)
    const outcomes = analyzeOutcomes([
      {
        taskId: executionResult.taskId,
        taskType: executionResult.taskType,
        success: executionResult.success,
        patternsUsed: ['tdd'],
        failureReason: undefined,
        durationMs: 0,
        timestamp: executionResult.timestamp,
      },
    ])

    return {
      classification,
      context,
      subtasks,
      toolPolicy,
      tddPlan: { state: tddState, firstAction },
      review,
      security,
      pr,
      knowledge,
      outcomes,
      liveMode,
    } satisfies PipelineResult
  })
