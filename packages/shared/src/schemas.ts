import { Schema } from 'effect'

export const EntityIdSchema = Schema.String.pipe(Schema.brand('EntityId'))
export const RelationIdSchema = Schema.String.pipe(Schema.brand('RelationId'))
export const TaskIdSchema = Schema.String.pipe(Schema.brand('TaskId'))
export const HolonIdSchema = Schema.String.pipe(Schema.brand('HolonId'))
export const BlueprintIdSchema = Schema.String.pipe(Schema.brand('BlueprintId'))
export const CorrelationIdSchema = Schema.String.pipe(Schema.brand('CorrelationId'))
export const CausationIdSchema = Schema.String.pipe(Schema.brand('CausationId'))
export const IdempotencyKeySchema = Schema.String.pipe(Schema.brand('IdempotencyKey'))

export const CreateEntityInput = Schema.Struct({
  type: Schema.String,
  name: Schema.String,
  properties: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
  idempotencyKey: IdempotencyKeySchema,
})

export const CreateRelationInput = Schema.Struct({
  fromId: EntityIdSchema,
  toId: EntityIdSchema,
  type: Schema.String,
  weight: Schema.optional(Schema.Number),
  properties: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  idempotencyKey: IdempotencyKeySchema,
})

export type CreateEntityInput = typeof CreateEntityInput.Type
export type CreateRelationInput = typeof CreateRelationInput.Type
