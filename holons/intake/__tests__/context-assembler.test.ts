import { describe, it, expect } from 'vitest'
import { Effect } from 'effect'
import { assembleContext } from '../domain/context-assembler.js'

describe('assembleContext', () => {
  describe('URL extraction', () => {
    it('extracts HTTP URLs from text', async () => {
      const input = 'check https://github.com/org/repo/issues/42 for details'
      const result = await Effect.runPromise(assembleContext(input))
      expect(result.urls).toEqual(['https://github.com/org/repo/issues/42'])
    })

    it('extracts multiple URLs', async () => {
      const input =
        'see https://docs.example.com/api and http://localhost:3000/test for reference'
      const result = await Effect.runPromise(assembleContext(input))
      expect(result.urls).toHaveLength(2)
      expect(result.urls).toContain('https://docs.example.com/api')
      expect(result.urls).toContain('http://localhost:3000/test')
    })

    it('returns empty array when no URLs present', async () => {
      const input = 'add a new button to the dashboard'
      const result = await Effect.runPromise(assembleContext(input))
      expect(result.urls).toEqual([])
    })
  })

  describe('file path extraction', () => {
    it('extracts Unix-style file paths', async () => {
      const input = 'update the file at src/components/Button.tsx'
      const result = await Effect.runPromise(assembleContext(input))
      expect(result.filePaths).toContain('src/components/Button.tsx')
    })

    it('extracts paths with common extensions', async () => {
      const input =
        'modify packages/shared/src/types.ts and holons/intake/domain/classifier.ts'
      const result = await Effect.runPromise(assembleContext(input))
      expect(result.filePaths).toContain('packages/shared/src/types.ts')
      expect(result.filePaths).toContain('holons/intake/domain/classifier.ts')
    })

    it('extracts dotfiles', async () => {
      const input = 'update .eslintrc.json and .gitignore'
      const result = await Effect.runPromise(assembleContext(input))
      expect(result.filePaths).toContain('.eslintrc.json')
      expect(result.filePaths).toContain('.gitignore')
    })

    it('returns empty array when no paths present', async () => {
      const input = 'improve performance of the search feature'
      const result = await Effect.runPromise(assembleContext(input))
      expect(result.filePaths).toEqual([])
    })
  })

  describe('technology keyword extraction', () => {
    it('identifies TypeScript-related keywords', async () => {
      const input = 'add TypeScript interfaces for the API response types'
      const result = await Effect.runPromise(assembleContext(input))
      expect(result.technologies).toContain('typescript')
    })

    it('identifies React-related keywords', async () => {
      const input = 'create a new React component with useState hooks'
      const result = await Effect.runPromise(assembleContext(input))
      expect(result.technologies).toContain('react')
    })

    it('identifies multiple technologies', async () => {
      const input =
        'set up PostgreSQL database with Docker and add GraphQL resolvers'
      const result = await Effect.runPromise(assembleContext(input))
      expect(result.technologies).toContain('postgresql')
      expect(result.technologies).toContain('docker')
      expect(result.technologies).toContain('graphql')
    })

    it('identifies Effect-TS keywords', async () => {
      const input = 'implement the service using Effect.gen and Layer for DI'
      const result = await Effect.runPromise(assembleContext(input))
      expect(result.technologies).toContain('effect')
    })

    it('returns empty array when no tech keywords found', async () => {
      const input = 'make the button bigger'
      const result = await Effect.runPromise(assembleContext(input))
      expect(result.technologies).toEqual([])
    })

    it('deduplicates technology keywords', async () => {
      const input = 'use React for the React component with React hooks'
      const result = await Effect.runPromise(assembleContext(input))
      const reactCount = result.technologies.filter((t) => t === 'react').length
      expect(reactCount).toBe(1)
    })
  })

  describe('structured output', () => {
    it('returns all fields in the payload', async () => {
      const input =
        'fix the bug in src/auth/login.ts using React, see https://github.com/issue/1'
      const result = await Effect.runPromise(assembleContext(input))

      expect(result).toHaveProperty('urls')
      expect(result).toHaveProperty('filePaths')
      expect(result).toHaveProperty('technologies')
      expect(result).toHaveProperty('rawDescription')
      expect(result.rawDescription).toBe(input)
    })
  })
})
