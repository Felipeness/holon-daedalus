import { describe, it, expect } from 'vitest'
import { buildBlueprint, type BlueprintInput } from '../domain/blueprint-builder.js'
import { TaskId, BlueprintId, HolonId, TaskState } from '@holon/shared'
import type { BlueprintNode } from '@holon/blueprint-engine'

describe('blueprint-builder', () => {
  const defaultInput: BlueprintInput = {
    taskDescription: 'add input validation to user registration',
    taskType: 'CODE_GENERATION',
    blueprintId: BlueprintId('bp-001'),
    assignedHolon: HolonId('coder-001'),
  }

  describe('buildBlueprint', () => {
    it('creates a valid blueprint with all required node types', () => {
      const blueprint = buildBlueprint(defaultInput)

      const tags = blueprint.nodes.map((n) => n._tag)
      expect(tags).toContain('Deterministic')
      expect(tags).toContain('Agentic')
      expect(tags).toContain('Gate')
    })

    it('includes lint, code, test, review gate, and commit nodes', () => {
      const blueprint = buildBlueprint(defaultInput)

      const names = blueprint.nodes.map((n) => n.name)
      expect(names).toContain('lint')
      expect(names).toContain('code')
      expect(names).toContain('test')
      expect(names).toContain('review-gate')
      expect(names).toContain('commit')
    })

    it('creates a valid DAG with correct dependencies', () => {
      const blueprint = buildBlueprint(defaultInput)
      const nodeIds = new Set(blueprint.nodes.map((n) => n.id))

      for (const node of blueprint.nodes) {
        for (const dep of node.dependsOn) {
          expect(nodeIds.has(dep)).toBe(true)
        }
      }
    })

    it('sets all nodes to PENDING state initially', () => {
      const blueprint = buildBlueprint(defaultInput)

      for (const node of blueprint.nodes) {
        expect(node.state).toBe(TaskState.PENDING)
      }
    })

    it('assigns the correct blueprint ID to all nodes', () => {
      const blueprint = buildBlueprint(defaultInput)

      for (const node of blueprint.nodes) {
        expect(node.blueprintId).toBe(defaultInput.blueprintId)
      }
    })

    it('has lint as the first node with no dependencies', () => {
      const blueprint = buildBlueprint(defaultInput)
      const lintNode = blueprint.nodes.find((n) => n.name === 'lint')

      expect(lintNode).toBeDefined()
      expect(lintNode!.dependsOn).toHaveLength(0)
    })

    it('has code depending on lint', () => {
      const blueprint = buildBlueprint(defaultInput)
      const lintNode = blueprint.nodes.find((n) => n.name === 'lint')!
      const codeNode = blueprint.nodes.find((n) => n.name === 'code')!

      expect(codeNode.dependsOn).toContain(lintNode.id)
    })

    it('has test depending on code', () => {
      const blueprint = buildBlueprint(defaultInput)
      const codeNode = blueprint.nodes.find((n) => n.name === 'code')!
      const testNode = blueprint.nodes.find((n) => n.name === 'test')!

      expect(testNode.dependsOn).toContain(codeNode.id)
    })

    it('has review gate depending on test', () => {
      const blueprint = buildBlueprint(defaultInput)
      const testNode = blueprint.nodes.find((n) => n.name === 'test')!
      const gateNode = blueprint.nodes.find((n) => n.name === 'review-gate')!

      expect(gateNode.dependsOn).toContain(testNode.id)
    })

    it('has commit depending on review gate', () => {
      const blueprint = buildBlueprint(defaultInput)
      const gateNode = blueprint.nodes.find((n) => n.name === 'review-gate')!
      const commitNode = blueprint.nodes.find((n) => n.name === 'commit')!

      expect(commitNode.dependsOn).toContain(gateNode.id)
    })

    it('sets agentic node with correct properties', () => {
      const blueprint = buildBlueprint(defaultInput)
      const codeNode = blueprint.nodes.find((n) => n.name === 'code')!

      expect(codeNode._tag).toBe('Agentic')
      if (codeNode._tag === 'Agentic') {
        expect(codeNode.assignedHolon).toBe(defaultInput.assignedHolon)
        expect(codeNode.prompt).toContain(defaultInput.taskDescription)
        expect(codeNode.maxIterations).toBeGreaterThan(0)
        expect(codeNode.qualityThreshold).toBeGreaterThan(0)
      }
    })

    it('does not create circular dependencies', () => {
      const blueprint = buildBlueprint(defaultInput)
      const visited = new Set<string>()
      const visiting = new Set<string>()

      const hasCycle = (nodeId: string): boolean => {
        if (visiting.has(nodeId)) return true
        if (visited.has(nodeId)) return false

        visiting.add(nodeId)
        const node = blueprint.nodes.find((n) => n.id === nodeId)
        if (node) {
          for (const dep of node.dependsOn) {
            if (hasCycle(dep as string)) return true
          }
        }
        visiting.delete(nodeId)
        visited.add(nodeId)
        return false
      }

      for (const node of blueprint.nodes) {
        expect(hasCycle(node.id as string)).toBe(false)
      }
    })
  })
})
