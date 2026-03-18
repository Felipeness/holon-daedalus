export const TaskType = {
  CODE_GENERATION: 'CODE_GENERATION',
  CODE_REVIEW: 'CODE_REVIEW',
  REFACTORING: 'REFACTORING',
  BUG_FIX: 'BUG_FIX',
  RESEARCH: 'RESEARCH',
  TESTING: 'TESTING',
  DOCUMENTATION: 'DOCUMENTATION',
} as const
export type TaskType = (typeof TaskType)[keyof typeof TaskType]

export const HolonType = {
  INTAKE: 'INTAKE',
  PLANNER: 'PLANNER',
  CODER: 'CODER',
  REVIEWER: 'REVIEWER',
  SCHOLAR: 'SCHOLAR',
} as const
export type HolonType = (typeof HolonType)[keyof typeof HolonType]

export const EventType = {
  ENTITY_CREATED: 'ENTITY_CREATED',
  ENTITY_UPDATED: 'ENTITY_UPDATED',
  ENTITY_DELETED: 'ENTITY_DELETED',
  RELATION_CREATED: 'RELATION_CREATED',
  RELATION_UPDATED: 'RELATION_UPDATED',
  RELATION_DELETED: 'RELATION_DELETED',
  TASK_SUBMITTED: 'TASK_SUBMITTED',
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  TASK_COMPLETED: 'TASK_COMPLETED',
  TASK_FAILED: 'TASK_FAILED',
} as const
export type EventType = (typeof EventType)[keyof typeof EventType]

export const RelationType = {
  DEPENDS_ON: 'DEPENDS_ON',
  CONTAINS: 'CONTAINS',
  REFERENCES: 'REFERENCES',
  PRODUCED_BY: 'PRODUCED_BY',
  REVIEWED_BY: 'REVIEWED_BY',
  SIMILAR_TO: 'SIMILAR_TO',
  PARENT_OF: 'PARENT_OF',
  CHILD_OF: 'CHILD_OF',
} as const
export type RelationType = (typeof RelationType)[keyof typeof RelationType]

export const EntityType = {
  FILE: 'FILE',
  FUNCTION: 'FUNCTION',
  CLASS: 'CLASS',
  MODULE: 'MODULE',
  TASK: 'TASK',
  BLUEPRINT: 'BLUEPRINT',
  HOLON: 'HOLON',
  DECISION: 'DECISION',
  KNOWLEDGE: 'KNOWLEDGE',
} as const
export type EntityType = (typeof EntityType)[keyof typeof EntityType]

export const BlueprintNodeType = {
  DETERMINISTIC: 'DETERMINISTIC',
  AGENTIC: 'AGENTIC',
  GATE: 'GATE',
  PARALLEL: 'PARALLEL',
} as const
export type BlueprintNodeType = (typeof BlueprintNodeType)[keyof typeof BlueprintNodeType]

export const TaskState = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
  FAILED: 'FAILED',
} as const
export type TaskState = (typeof TaskState)[keyof typeof TaskState]
