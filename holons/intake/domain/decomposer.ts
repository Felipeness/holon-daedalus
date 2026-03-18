import { Effect } from 'effect'
import type { SubTask } from './types.js'

const COMPOUND_PHRASES = ['drag and drop', 'copy and paste', 'search and replace', 'lock and key', 'back and forth', 'pros and cons', 'trial and error', 'read and write'] as const

const splitByNumberedSteps = (text: string): ReadonlyArray<string> | null => {
  const pattern = /(?:^|\s)(\d+)[.)]\s+/
  if (!pattern.test(text)) return null

  const parts = text.split(/(?:^|\s)\d+[.)]\s+/).filter((s) => s.trim().length > 0)
  return parts.length > 1 ? parts.map((s) => s.trim()) : null
}

const splitByBulletPoints = (text: string): ReadonlyArray<string> | null => {
  if (!text.includes('\n')) return null

  const lines = text
    .split('\n')
    .map((l) => l.replace(/^[\s]*[-*•]\s*/, '').trim())
    .filter((l) => l.length > 0)

  return lines.length > 1 ? lines : null
}

const splitBySemicolons = (text: string): ReadonlyArray<string> | null => {
  if (!text.includes(';')) return null

  const parts = text.split(';').map((s) => s.trim()).filter((s) => s.length > 0)
  return parts.length > 1 ? parts : null
}

const splitByThen = (text: string): { parts: ReadonlyArray<string>; sequential: boolean } | null => {
  const lower = text.toLowerCase()
  const thenIndex = lower.indexOf(' then ')
  if (thenIndex === -1) return null

  const before = text.slice(0, thenIndex).trim()
  const after = text.slice(thenIndex + 6).trim()

  if (before.length === 0 || after.length === 0) return null

  return { parts: [before, after], sequential: true }
}

const splitByAnd = (text: string): ReadonlyArray<string> | null => {
  const lower = text.toLowerCase()

  for (const phrase of COMPOUND_PHRASES) {
    if (lower.includes(phrase)) return null
  }

  const andIndex = lower.indexOf(' and ')
  if (andIndex === -1) return null

  const before = text.slice(0, andIndex).trim()
  const after = text.slice(andIndex + 5).trim()

  if (before.length === 0 || after.length === 0) return null

  const beforeHasVerb = /^(add|create|implement|build|fix|update|write|remove|delete|refactor|test|migrate|deploy)/i.test(before)
  const afterHasVerb = /^(add|create|implement|build|fix|update|write|remove|delete|refactor|test|migrate|deploy)/i.test(after)

  if (!beforeHasVerb || !afterHasVerb) return null

  return [before, after]
}

export const decompose = (description: string): Effect.Effect<ReadonlyArray<SubTask>> => {
  const trimmed = description.trim()

  const numbered = splitByNumberedSteps(trimmed)
  if (numbered) {
    return Effect.succeed(
      numbered.map((desc, index) => ({
        index,
        description: desc,
        dependencies: [],
      })),
    )
  }

  const bullets = splitByBulletPoints(trimmed)
  if (bullets) {
    return Effect.succeed(
      bullets.map((desc, index) => ({
        index,
        description: desc,
        dependencies: [],
      })),
    )
  }

  const semicolons = splitBySemicolons(trimmed)
  if (semicolons) {
    return Effect.succeed(
      semicolons.map((desc, index) => ({
        index,
        description: desc,
        dependencies: [],
      })),
    )
  }

  const thenResult = splitByThen(trimmed)
  if (thenResult) {
    return Effect.succeed(
      thenResult.parts.map((desc, index) => ({
        index,
        description: desc,
        dependencies: index > 0 ? [index - 1] : [],
      })),
    )
  }

  const andResult = splitByAnd(trimmed)
  if (andResult) {
    return Effect.succeed(
      andResult.map((desc, index) => ({
        index,
        description: desc,
        dependencies: [],
      })),
    )
  }

  return Effect.succeed([
    {
      index: 0,
      description: trimmed,
      dependencies: [],
    },
  ])
}
