import { describe, it, expect } from 'vitest'
import { TaskState } from '@holon/shared'
import { transition, canTransition, Start, Complete, Skip, Fail, Reset } from '../src/dfa.js'

describe('DFA state machine', () => {
  describe('valid transitions', () => {
    it('PENDING -> IN_PROGRESS via Start', () => {
      const result = transition(TaskState.PENDING, Start)
      expect(result.success).toBe(true)
      expect(result.from).toBe(TaskState.PENDING)
      expect(result.to).toBe(TaskState.IN_PROGRESS)
    })

    it('IN_PROGRESS -> COMPLETED via Complete', () => {
      const result = transition(TaskState.IN_PROGRESS, Complete)
      expect(result.success).toBe(true)
      expect(result.to).toBe(TaskState.COMPLETED)
    })

    it('IN_PROGRESS -> FAILED via Fail', () => {
      const result = transition(TaskState.IN_PROGRESS, Fail('timeout'))
      expect(result.success).toBe(true)
      expect(result.to).toBe(TaskState.FAILED)
    })

    it('IN_PROGRESS -> SKIPPED via Skip', () => {
      const result = transition(TaskState.IN_PROGRESS, Skip('not needed'))
      expect(result.success).toBe(true)
      expect(result.to).toBe(TaskState.SKIPPED)
    })

    it('PENDING -> SKIPPED via Skip', () => {
      const result = transition(TaskState.PENDING, Skip('precondition failed'))
      expect(result.success).toBe(true)
      expect(result.to).toBe(TaskState.SKIPPED)
    })

    it('FAILED -> PENDING via Reset', () => {
      const result = transition(TaskState.FAILED, Reset)
      expect(result.success).toBe(true)
      expect(result.to).toBe(TaskState.PENDING)
    })

    it('SKIPPED -> PENDING via Reset', () => {
      const result = transition(TaskState.SKIPPED, Reset)
      expect(result.success).toBe(true)
      expect(result.to).toBe(TaskState.PENDING)
    })
  })

  describe('invalid transitions', () => {
    it('COMPLETED cannot transition to anything', () => {
      expect(transition(TaskState.COMPLETED, Start).success).toBe(false)
      expect(transition(TaskState.COMPLETED, Complete).success).toBe(false)
      expect(transition(TaskState.COMPLETED, Fail('x')).success).toBe(false)
      expect(transition(TaskState.COMPLETED, Reset).success).toBe(false)
    })

    it('PENDING cannot complete directly', () => {
      const result = transition(TaskState.PENDING, Complete)
      expect(result.success).toBe(false)
      expect(result.reason).toBeDefined()
    })

    it('PENDING cannot fail directly', () => {
      const result = transition(TaskState.PENDING, Fail('error'))
      expect(result.success).toBe(false)
    })
  })

  describe('canTransition', () => {
    it('returns true for valid transitions', () => {
      expect(canTransition(TaskState.PENDING, TaskState.IN_PROGRESS)).toBe(true)
      expect(canTransition(TaskState.IN_PROGRESS, TaskState.COMPLETED)).toBe(true)
    })

    it('returns false for invalid transitions', () => {
      expect(canTransition(TaskState.COMPLETED, TaskState.PENDING)).toBe(false)
      expect(canTransition(TaskState.PENDING, TaskState.COMPLETED)).toBe(false)
    })
  })
})
