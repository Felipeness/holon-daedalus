import { Effect } from 'effect'
import type { TaskClassification, TaskClassificationType, Complexity, Risk } from './types.js'

const typeKeywords: ReadonlyArray<{
  readonly type: TaskClassificationType
  readonly keywords: ReadonlyArray<string>
  readonly weight: number
}> = [
  {
    type: 'bug',
    keywords: [
      'fix',
      'bug',
      'crash',
      'broken',
      'error',
      'issue',
      'hotfix',
      'patch',
      'resolve',
      'regression',
      'fails',
      'failure',
      'not working',
      'incorrect',
      'wrong',
    ],
    weight: 1,
  },
  {
    type: 'refactor',
    keywords: [
      'refactor',
      'restructure',
      'reorganize',
      'clean up',
      'cleanup',
      'simplify',
      'extract',
      'decouple',
      'consolidate',
      'modernize',
      'improve code',
      'reduce complexity',
    ],
    weight: 1,
  },
  {
    type: 'review',
    keywords: [
      'review',
      'audit',
      'inspect',
      'evaluate',
      'assess',
      'check code',
      'code review',
      'pr review',
      'pull request',
    ],
    weight: 2,
  },
  {
    type: 'docs',
    keywords: [
      'document',
      'documentation',
      'readme',
      'jsdoc',
      'docstring',
      'comment',
      'api docs',
      'write docs',
      'update docs',
      'changelog',
      'guide',
    ],
    weight: 1,
  },
  {
    type: 'test',
    keywords: [
      'test',
      'testing',
      'unit test',
      'integration test',
      'e2e test',
      'coverage',
      'spec',
      'assertion',
      'test case',
      'add tests',
      'write tests',
    ],
    weight: 1,
  },
  {
    type: 'feature',
    keywords: [
      'add',
      'create',
      'implement',
      'build',
      'develop',
      'introduce',
      'new',
      'support',
      'enable',
      'integrate',
    ],
    weight: 0.5,
  },
]

const highComplexitySignals: ReadonlyArray<string> = [
  'entire',
  'redesign',
  'migrate',
  'multiple services',
  'across',
  'all services',
  'backward compatibility',
  'rollback',
  'oauth',
  'saml',
  'mfa',
  'multi-factor',
  'distributed',
  'architecture',
  'microservice',
]

const lowComplexitySignals: ReadonlyArray<string> = [
  'typo',
  'rename',
  'update text',
  'fix wording',
  'change label',
  'bump version',
  'simple',
  'minor',
  'small',
  'trivial',
]

const highRiskKeywords: ReadonlyArray<string> = [
  'payment',
  'auth',
  'authentication',
  'authorization',
  'security',
  'database',
  'migration',
  'delete',
  'remove user',
  'production',
  'deploy',
  'credential',
  'password',
  'token',
  'encrypt',
  'ssl',
  'certificate',
  'pii',
  'gdpr',
  'billing',
  'subscription',
  'financial',
]

const classifyType = (lower: string): TaskClassificationType => {
  const scores = new Map<TaskClassificationType, number>()

  for (const { type, keywords, weight } of typeKeywords) {
    let score = 0
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        score += weight
      }
    }
    if (score > 0) {
      scores.set(type, (scores.get(type) ?? 0) + score)
    }
  }

  if (scores.size === 0) return 'feature'

  let bestType: TaskClassificationType = 'feature'
  let bestScore = 0

  for (const [type, score] of scores) {
    if (score > bestScore) {
      bestScore = score
      bestType = type
    }
  }

  return bestType
}

const classifyComplexity = (lower: string): Complexity => {
  const wordCount = lower.split(/\s+/).filter(Boolean).length

  const hasHighSignal = highComplexitySignals.some((s) => lower.includes(s))
  const hasLowSignal = lowComplexitySignals.some((s) => lower.includes(s))

  if (hasLowSignal && !hasHighSignal) return 'low'
  if (hasHighSignal) return 'high'
  if (wordCount > 20) return 'high'
  if (wordCount <= 4) return 'low'
  return 'medium'
}

const classifyRisk = (lower: string): Risk => {
  const highRiskMatches = highRiskKeywords.filter((k) => lower.includes(k))

  if (highRiskMatches.length >= 1) return 'high'

  const mediumRiskSignals = [
    'update',
    'modify',
    'change',
    'api',
    'endpoint',
    'service',
    'config',
    'component',
    'page',
    'ui',
  ]
  const hasMediumSignal = mediumRiskSignals.some((s) => lower.includes(s))

  if (hasMediumSignal) return 'medium'

  return 'low'
}

export const classifyTask = (description: string): Effect.Effect<TaskClassification> => {
  const lower = description.toLowerCase().trim()

  return Effect.succeed({
    type: classifyType(lower),
    complexity: classifyComplexity(lower),
    risk: classifyRisk(lower),
  })
}
