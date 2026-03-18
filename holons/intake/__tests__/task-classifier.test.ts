import { describe, it, expect } from 'vitest'
import { Effect } from 'effect'
import { classifyTask } from '../domain/task-classifier.js'

describe('classifyTask', () => {
  describe('type classification', () => {
    const typeTestCases = [
      { input: 'add user registration form', expectedType: 'feature' },
      { input: 'implement login page', expectedType: 'feature' },
      { input: 'create API endpoint for payments', expectedType: 'feature' },
      { input: 'build a new dashboard component', expectedType: 'feature' },
      { input: 'fix null pointer in payment flow', expectedType: 'bug' },
      { input: 'resolve crash when user submits empty form', expectedType: 'bug' },
      { input: 'bug: login fails on Safari', expectedType: 'bug' },
      { input: 'hotfix for broken email validation', expectedType: 'bug' },
      { input: 'refactor user service to use repository pattern', expectedType: 'refactor' },
      { input: 'extract common logic into shared module', expectedType: 'refactor' },
      { input: 'clean up deprecated API calls', expectedType: 'refactor' },
      { input: 'restructure folder layout for domain modules', expectedType: 'refactor' },
      { input: 'review PR #42 for security issues', expectedType: 'review' },
      { input: 'code review the authentication changes', expectedType: 'review' },
      { input: 'audit the payment module for OWASP issues', expectedType: 'review' },
      { input: 'write documentation for the API', expectedType: 'docs' },
      { input: 'update README with setup instructions', expectedType: 'docs' },
      { input: 'document the deployment process', expectedType: 'docs' },
      { input: 'add JSDoc comments to public functions', expectedType: 'docs' },
      { input: 'write unit tests for the user service', expectedType: 'test' },
      { input: 'add integration tests for payment flow', expectedType: 'test' },
      { input: 'increase test coverage for auth module', expectedType: 'test' },
    ] as const

    it.each(typeTestCases)('classifies "$input" as $expectedType', async ({ input, expectedType }) => {
      const result = await Effect.runPromise(classifyTask(input))
      expect(result.type).toBe(expectedType)
    })
  })

  describe('complexity classification', () => {
    const complexityTestCases = [
      { input: 'fix typo in README', expectedComplexity: 'low' },
      { input: 'rename variable in utils', expectedComplexity: 'low' },
      { input: 'add input validation to user registration', expectedComplexity: 'medium' },
      { input: 'implement search feature with filters', expectedComplexity: 'medium' },
      {
        input: 'redesign the entire authentication system with OAuth, SAML, and MFA support across multiple services',
        expectedComplexity: 'high',
      },
      {
        input: 'migrate database schema, update all services, add backward compatibility layer, and implement rollback strategy',
        expectedComplexity: 'high',
      },
    ] as const

    it.each(complexityTestCases)(
      'classifies "$input" as $expectedComplexity complexity',
      async ({ input, expectedComplexity }) => {
        const result = await Effect.runPromise(classifyTask(input))
        expect(result.complexity).toBe(expectedComplexity)
      },
    )
  })

  describe('risk classification', () => {
    const riskTestCases = [
      { input: 'fix typo in README', expectedRisk: 'low' },
      { input: 'add a new utility function', expectedRisk: 'low' },
      { input: 'update payment processing logic', expectedRisk: 'high' },
      { input: 'modify authentication flow', expectedRisk: 'high' },
      { input: 'change database migration script', expectedRisk: 'high' },
      { input: 'delete user data cleanup job', expectedRisk: 'high' },
      { input: 'update security headers configuration', expectedRisk: 'high' },
      { input: 'add new UI component for settings page', expectedRisk: 'medium' },
    ] as const

    it.each(riskTestCases)('classifies "$input" as $expectedRisk risk', async ({ input, expectedRisk }) => {
      const result = await Effect.runPromise(classifyTask(input))
      expect(result.risk).toBe(expectedRisk)
    })
  })

  describe('edge cases', () => {
    it('defaults to feature for ambiguous input', async () => {
      const result = await Effect.runPromise(classifyTask('do something with the codebase'))
      expect(result.type).toBe('feature')
    })

    it('returns consistent results for same input', async () => {
      const input = 'add user registration form'
      const first = await Effect.runPromise(classifyTask(input))
      const second = await Effect.runPromise(classifyTask(input))
      expect(first).toEqual(second)
    })

    it('handles empty-ish input gracefully', async () => {
      const result = await Effect.runPromise(classifyTask('   '))
      expect(result.type).toBeDefined()
      expect(result.complexity).toBeDefined()
      expect(result.risk).toBeDefined()
    })
  })
})
