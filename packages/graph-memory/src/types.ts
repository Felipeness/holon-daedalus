import type { EntityId, RelationId, IdempotencyKey, CorrelationContext } from '@holon/shared'

export interface Entity {
  readonly id: EntityId
  readonly type: string
  readonly name: string
  readonly properties: Record<string, unknown>
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface Relation {
  readonly id: RelationId
  readonly fromId: EntityId
  readonly toId: EntityId
  readonly type: string
  readonly weight: number
  readonly properties: Record<string, unknown>
  readonly createdAt: Date
}

export interface GraphEvent {
  readonly id: string
  readonly aggregateId: string
  readonly type: string
  readonly version: number
  readonly payload: Record<string, unknown>
  readonly idempotencyKey: IdempotencyKey
  readonly correlationContext: CorrelationContext
  readonly createdAt: Date
}

export interface GraphPattern {
  readonly entityType?: string
  readonly relationTypes?: ReadonlyArray<string>
  readonly propertyFilters?: Record<string, unknown>
  readonly namePattern?: string
}

export interface TraverseOpts {
  readonly startId: EntityId
  readonly direction: 'outbound' | 'inbound' | 'both'
  readonly maxDepth: number
  readonly relationTypes?: ReadonlyArray<string>
  readonly strategy: 'bfs' | 'dfs'
}

export interface ScoredEntity {
  readonly entity: Entity
  readonly score: number
  readonly distance: number
}
