import { Brand } from 'effect'

export type TaskId = string & Brand.Brand<'TaskId'>
export const TaskId = Brand.nominal<TaskId>()

export type EntityId = string & Brand.Brand<'EntityId'>
export const EntityId = Brand.nominal<EntityId>()

export type RelationId = string & Brand.Brand<'RelationId'>
export const RelationId = Brand.nominal<RelationId>()

export type HolonId = string & Brand.Brand<'HolonId'>
export const HolonId = Brand.nominal<HolonId>()

export type BlueprintId = string & Brand.Brand<'BlueprintId'>
export const BlueprintId = Brand.nominal<BlueprintId>()

export type CorrelationId = string & Brand.Brand<'CorrelationId'>
export const CorrelationId = Brand.nominal<CorrelationId>()

export type CausationId = string & Brand.Brand<'CausationId'>
export const CausationId = Brand.nominal<CausationId>()

export type IdempotencyKey = string & Brand.Brand<'IdempotencyKey'>
export const IdempotencyKey = Brand.nominal<IdempotencyKey>()
