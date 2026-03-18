import { describe, it, expect } from 'vitest'
import {
  TddPhase,
  createTddState,
  nextAction,
  advancePhase,
  type TddState,
} from '../domain/tdd-engine.js'

describe('TddEngine', () => {
  describe('createTddState', () => {
    it('starts in RED phase at criterion index 0', () => {
      const state = createTddState(['criterion-1', 'criterion-2'])

      expect(state.phase).toBe(TddPhase.RED)
      expect(state.criterionIndex).toBe(0)
      expect(state.criteria).toEqual(['criterion-1', 'criterion-2'])
      expect(state.completed).toBe(false)
    })
  })

  describe('nextAction', () => {
    it('returns "write test" action during RED phase', () => {
      const state = createTddState(['adds user validation'])
      const action = nextAction(state)

      expect(action.type).toBe('write_test')
      expect(action.criterion).toBe('adds user validation')
    })

    it('returns "implement" action during GREEN phase', () => {
      const state: TddState = {
        phase: TddPhase.GREEN,
        criterionIndex: 0,
        criteria: ['adds user validation'],
        completed: false,
      }
      const action = nextAction(state)

      expect(action.type).toBe('implement')
      expect(action.criterion).toBe('adds user validation')
    })

    it('returns "refactor" action during REFACTOR phase', () => {
      const state: TddState = {
        phase: TddPhase.REFACTOR,
        criterionIndex: 0,
        criteria: ['adds user validation'],
        completed: false,
      }
      const action = nextAction(state)

      expect(action.type).toBe('refactor')
      expect(action.criterion).toBe('adds user validation')
    })

    it('returns "done" action when completed', () => {
      const state: TddState = {
        phase: TddPhase.RED,
        criterionIndex: 1,
        criteria: ['criterion-1'],
        completed: true,
      }
      const action = nextAction(state)

      expect(action.type).toBe('done')
    })
  })

  describe('advancePhase', () => {
    it('transitions RED -> GREEN', () => {
      const state = createTddState(['c1', 'c2'])
      const next = advancePhase(state)

      expect(next.phase).toBe(TddPhase.GREEN)
      expect(next.criterionIndex).toBe(0)
      expect(next.completed).toBe(false)
    })

    it('transitions GREEN -> REFACTOR', () => {
      const state: TddState = {
        phase: TddPhase.GREEN,
        criterionIndex: 0,
        criteria: ['c1', 'c2'],
        completed: false,
      }
      const next = advancePhase(state)

      expect(next.phase).toBe(TddPhase.REFACTOR)
      expect(next.criterionIndex).toBe(0)
      expect(next.completed).toBe(false)
    })

    it('transitions REFACTOR -> RED with incremented criterion index', () => {
      const state: TddState = {
        phase: TddPhase.REFACTOR,
        criterionIndex: 0,
        criteria: ['c1', 'c2'],
        completed: false,
      }
      const next = advancePhase(state)

      expect(next.phase).toBe(TddPhase.RED)
      expect(next.criterionIndex).toBe(1)
      expect(next.completed).toBe(false)
    })

    it('marks completed when REFACTOR advances past last criterion', () => {
      const state: TddState = {
        phase: TddPhase.REFACTOR,
        criterionIndex: 1,
        criteria: ['c1', 'c2'],
        completed: false,
      }
      const next = advancePhase(state)

      expect(next.completed).toBe(true)
      expect(next.criterionIndex).toBe(2)
    })

    it('returns same state when already completed', () => {
      const state: TddState = {
        phase: TddPhase.RED,
        criterionIndex: 2,
        criteria: ['c1', 'c2'],
        completed: true,
      }
      const next = advancePhase(state)

      expect(next).toEqual(state)
    })

    describe('full cycle through multiple criteria', () => {
      it('cycles RED -> GREEN -> REFACTOR -> RED for each criterion', () => {
        let state = createTddState(['c1', 'c2'])

        // Criterion 1: RED -> GREEN -> REFACTOR
        expect(state.phase).toBe(TddPhase.RED)
        state = advancePhase(state)
        expect(state.phase).toBe(TddPhase.GREEN)
        state = advancePhase(state)
        expect(state.phase).toBe(TddPhase.REFACTOR)
        state = advancePhase(state)

        // Criterion 2: RED -> GREEN -> REFACTOR
        expect(state.phase).toBe(TddPhase.RED)
        expect(state.criterionIndex).toBe(1)
        state = advancePhase(state)
        expect(state.phase).toBe(TddPhase.GREEN)
        state = advancePhase(state)
        expect(state.phase).toBe(TddPhase.REFACTOR)
        state = advancePhase(state)

        // Done
        expect(state.completed).toBe(true)
      })
    })
  })
})
