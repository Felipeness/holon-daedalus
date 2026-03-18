import type { ScoredFile } from './relevance-scorer.js'

export interface CuratedContext {
  readonly files: ReadonlyArray<ScoredFile>
  readonly totalTokens: number
}

const CHARS_PER_TOKEN = 4

const estimateTokens = (content: string): number =>
  Math.ceil(content.length / CHARS_PER_TOKEN)

export const curateContext = (
  files: ReadonlyArray<ScoredFile>,
  tokenBudget: number,
): CuratedContext => {
  if (files.length === 0 || tokenBudget <= 0) {
    return { files: [], totalTokens: 0 }
  }

  const ranked = [...files]
    .filter((f) => f.score > 0)
    .sort((a, b) => b.score - a.score)

  const selected: ScoredFile[] = []
  let totalTokens = 0

  for (const file of ranked) {
    const fileTokens = estimateTokens(file.content)

    if (totalTokens + fileTokens > tokenBudget) {
      continue
    }

    selected.push(file)
    totalTokens += fileTokens
  }

  return { files: selected, totalTokens }
}
