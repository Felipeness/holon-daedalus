import { describe, it, expect } from 'vitest'
import { scoreRelevance, type ScoredFile, type FileEntry } from '../domain/relevance-scorer.js'

describe('relevance-scorer', () => {
  const makeFile = (path: string, content: string): FileEntry => ({ path, content })

  describe('scoreRelevance', () => {
    it('returns high score when keywords match file path', () => {
      const file = makeFile('src/domain/user-service.ts', 'export class UserService {}')
      const result = scoreRelevance(['user', 'service'], file)

      expect(result.score).toBeGreaterThan(0.5)
      expect(result.path).toBe(file.path)
    })

    it('returns high score when keywords match file content', () => {
      const file = makeFile('src/utils/helpers.ts', 'function validateUserEmail(user: User) { return user.email }')
      const result = scoreRelevance(['user', 'email'], file)

      expect(result.score).toBeGreaterThan(0.3)
    })

    it('returns zero score for completely irrelevant files', () => {
      const file = makeFile('src/config/database.ts', 'export const DB_HOST = "localhost"')
      const result = scoreRelevance(['authentication', 'oauth'], file)

      expect(result.score).toBe(0)
    })

    it('scores path matches higher than content-only matches', () => {
      const pathMatch = makeFile('src/domain/payment.ts', 'some unrelated content here')
      const contentMatch = makeFile('src/utils/random.ts', 'process payment logic here')
      const keywords = ['payment']

      const pathResult = scoreRelevance(keywords, pathMatch)
      const contentResult = scoreRelevance(keywords, contentMatch)

      expect(pathResult.score).toBeGreaterThan(contentResult.score)
    })

    it('increases score with more keyword matches', () => {
      const singleMatch = makeFile('src/user.ts', 'user data')
      const multiMatch = makeFile('src/user-auth.ts', 'user authentication login credentials')
      const keywords = ['user', 'authentication', 'login']

      const singleResult = scoreRelevance(keywords, singleMatch)
      const multiResult = scoreRelevance(keywords, multiMatch)

      expect(multiResult.score).toBeGreaterThan(singleResult.score)
    })

    it('normalizes score between 0 and 1', () => {
      const file = makeFile('src/user-auth-service.ts', 'user authentication service login oauth')
      const result = scoreRelevance(['user', 'auth', 'service', 'login', 'oauth'], file)

      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(1)
    })

    it('handles empty keywords gracefully', () => {
      const file = makeFile('src/anything.ts', 'any content')
      const result = scoreRelevance([], file)

      expect(result.score).toBe(0)
    })

    it('handles empty content gracefully', () => {
      const file = makeFile('src/empty.ts', '')
      const result = scoreRelevance(['user'], file)

      expect(result.score).toBeGreaterThanOrEqual(0)
    })

    it('performs case-insensitive matching', () => {
      const file = makeFile('src/UserService.ts', 'const UserName = "test"')
      const result = scoreRelevance(['username', 'userservice'], file)

      expect(result.score).toBeGreaterThan(0)
    })
  })
})
