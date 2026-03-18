import { describe, it, expect } from 'vitest'
import { Effect } from 'effect'
import { decompose } from '../domain/decomposer.js'

describe('decompose', () => {
  describe('single tasks', () => {
    it('keeps a simple task as a single subtask', async () => {
      const result = await Effect.runPromise(decompose('add user registration form'))
      expect(result).toHaveLength(1)
      expect(result[0]!.description).toBe('add user registration form')
      expect(result[0]!.dependencies).toEqual([])
    })

    it('keeps a task without conjunctions as single', async () => {
      const result = await Effect.runPromise(decompose('fix the login bug'))
      expect(result).toHaveLength(1)
    })
  })

  describe('compound tasks', () => {
    it('splits tasks joined by "and"', async () => {
      const result = await Effect.runPromise(
        decompose('add input validation and write unit tests'),
      )
      expect(result.length).toBeGreaterThanOrEqual(2)
      const descriptions = result.map((s) => s.description)
      expect(descriptions.some((d) => d.includes('input validation'))).toBe(true)
      expect(descriptions.some((d) => d.includes('unit tests'))).toBe(true)
    })

    it('splits tasks with numbered steps', async () => {
      const result = await Effect.runPromise(
        decompose('1. create the database schema 2. add the API endpoint 3. write tests'),
      )
      expect(result.length).toBe(3)
    })

    it('splits tasks with bullet points', async () => {
      const result = await Effect.runPromise(
        decompose('- add login page\n- add registration page\n- add password reset'),
      )
      expect(result.length).toBe(3)
    })

    it('splits tasks with "then" conjunction', async () => {
      const result = await Effect.runPromise(
        decompose('refactor the auth module then add OAuth support'),
      )
      expect(result.length).toBe(2)
    })

    it('splits tasks with semicolons', async () => {
      const result = await Effect.runPromise(
        decompose('fix the login bug; update the error messages; add retry logic'),
      )
      expect(result.length).toBe(3)
    })
  })

  describe('subtask properties', () => {
    it('assigns sequential indices to subtasks', async () => {
      const result = await Effect.runPromise(
        decompose('add login page and add registration page'),
      )
      expect(result[0]!.index).toBe(0)
      expect(result[1]!.index).toBe(1)
    })

    it('marks later subtasks as depending on earlier ones when using "then"', async () => {
      const result = await Effect.runPromise(
        decompose('create database schema then add API endpoint'),
      )
      expect(result[0]!.dependencies).toEqual([])
      expect(result[1]!.dependencies).toEqual([0])
    })

    it('marks parallel subtasks with no dependencies when using "and"', async () => {
      const result = await Effect.runPromise(
        decompose('add login page and add registration page'),
      )
      expect(result[0]!.dependencies).toEqual([])
      expect(result[1]!.dependencies).toEqual([])
    })
  })

  describe('edge cases', () => {
    it('handles "and" inside a single concept', async () => {
      const result = await Effect.runPromise(
        decompose('implement drag and drop for file uploads'),
      )
      expect(result).toHaveLength(1)
    })

    it('trims whitespace from subtask descriptions', async () => {
      const result = await Effect.runPromise(
        decompose('  add login page  and  add registration page  '),
      )
      for (const subtask of result) {
        expect(subtask.description).toBe(subtask.description.trim())
        expect(subtask.description.length).toBeGreaterThan(0)
      }
    })
  })
})
