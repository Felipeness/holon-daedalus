export interface FileEntry {
  readonly path: string
  readonly content: string
}

export interface ScoredFile {
  readonly path: string
  readonly content: string
  readonly score: number
}

const PATH_WEIGHT = 0.6
const CONTENT_WEIGHT = 0.4

const countOccurrences = (text: string, keyword: string): number => {
  const regex = new RegExp(keyword, 'gi')
  return (text.match(regex) || []).length
}

const computeTermFrequency = (text: string, keyword: string): number => {
  const words = text.toLowerCase().split(/[\W_]+/).filter(Boolean)
  if (words.length === 0) return 0

  const occurrences = countOccurrences(text, keyword)
  return occurrences / words.length
}

export const scoreRelevance = (keywords: ReadonlyArray<string>, file: FileEntry): ScoredFile => {
  if (keywords.length === 0) {
    return { path: file.path, content: file.content, score: 0 }
  }

  const pathLower = file.path.toLowerCase()
  const contentLower = file.content.toLowerCase()

  let pathScore = 0
  let contentScore = 0

  for (const keyword of keywords) {
    const kw = keyword.toLowerCase()

    if (pathLower.includes(kw)) {
      pathScore += 1 / keywords.length
    }

    const tf = computeTermFrequency(contentLower, kw)
    contentScore += tf > 0 ? 1 / keywords.length : 0
  }

  const rawScore = pathScore * PATH_WEIGHT + contentScore * CONTENT_WEIGHT
  const score = Math.min(1, Math.max(0, rawScore))

  return { path: file.path, content: file.content, score }
}
