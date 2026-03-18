import { describe, it, expect } from 'vitest'
import { curateContext, type CuratedContext } from '../domain/context-curator.js'
import type { ScoredFile } from '../domain/relevance-scorer.js'

describe('context-curator', () => {
  const makeScoredFile = (path: string, content: string, score: number): ScoredFile => ({
    path,
    content,
    score,
  })

  describe('curateContext', () => {
    it('selects top files within token budget', () => {
      const files: ReadonlyArray<ScoredFile> = [
        makeScoredFile('a.ts', 'a'.repeat(400), 0.9),
        makeScoredFile('b.ts', 'b'.repeat(400), 0.7),
        makeScoredFile('c.ts', 'c'.repeat(400), 0.5),
      ]

      // 400 chars / 4 = 100 tokens each. Budget 150 fits only 1 file.
      const result = curateContext(files, 150)

      expect(result.files.length).toBe(1)
      expect(result.files[0].path).toBe('a.ts')
    })

    it('prioritizes higher-scored files', () => {
      const files: ReadonlyArray<ScoredFile> = [
        makeScoredFile('low.ts', 'x'.repeat(100), 0.1),
        makeScoredFile('high.ts', 'x'.repeat(100), 0.9),
        makeScoredFile('mid.ts', 'x'.repeat(100), 0.5),
      ]

      const result = curateContext(files, 1000)

      expect(result.files[0].path).toBe('high.ts')
      expect(result.files[1].path).toBe('mid.ts')
      expect(result.files[2].path).toBe('low.ts')
    })

    it('respects token budget by excluding large files', () => {
      const files: ReadonlyArray<ScoredFile> = [
        makeScoredFile('small.ts', 'x'.repeat(200), 0.9),
        makeScoredFile('huge.ts', 'x'.repeat(10000), 0.8),
        makeScoredFile('medium.ts', 'x'.repeat(400), 0.7),
      ]

      const result = curateContext(files, 300)

      expect(result.files.some((f) => f.path === 'small.ts')).toBe(true)
      expect(result.files.some((f) => f.path === 'huge.ts')).toBe(false)
    })

    it('tracks total token count accurately', () => {
      const content = 'a'.repeat(400)
      const files: ReadonlyArray<ScoredFile> = [makeScoredFile('a.ts', content, 0.9)]

      const result = curateContext(files, 200)

      expect(result.totalTokens).toBe(100)
    })

    it('returns empty context for zero budget', () => {
      const files: ReadonlyArray<ScoredFile> = [makeScoredFile('a.ts', 'content', 0.9)]

      const result = curateContext(files, 0)

      expect(result.files).toHaveLength(0)
      expect(result.totalTokens).toBe(0)
    })

    it('returns empty context for empty file list', () => {
      const result = curateContext([], 1000)

      expect(result.files).toHaveLength(0)
      expect(result.totalTokens).toBe(0)
    })

    it('excludes zero-scored files', () => {
      const files: ReadonlyArray<ScoredFile> = [
        makeScoredFile('relevant.ts', 'x'.repeat(100), 0.8),
        makeScoredFile('irrelevant.ts', 'x'.repeat(100), 0),
      ]

      const result = curateContext(files, 1000)

      expect(result.files).toHaveLength(1)
      expect(result.files[0].path).toBe('relevant.ts')
    })

    it('fills budget greedily with sorted files', () => {
      const files: ReadonlyArray<ScoredFile> = [
        makeScoredFile('a.ts', 'x'.repeat(400), 0.9),
        makeScoredFile('b.ts', 'x'.repeat(400), 0.8),
        makeScoredFile('c.ts', 'x'.repeat(400), 0.7),
      ]

      // 400 chars / 4 = 100 tokens each. Budget 150 fits only 1 file.
      const result = curateContext(files, 150)

      expect(result.files).toHaveLength(1)
      expect(result.totalTokens).toBeLessThanOrEqual(150)
    })
  })
})
