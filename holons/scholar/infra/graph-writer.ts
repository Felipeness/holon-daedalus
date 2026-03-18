import { Effect } from 'effect'
import { IdempotencyKey, type CorrelationContext } from '@holon/shared'
import { addEntity, addRelation, type Entity, type Relation } from '@holon/graph-memory'
import type { ExtractedEntity, ExtractedRelation } from '../domain/knowledge-extractor.js'

const entityRef = (entity: ExtractedEntity): string => `${entity.type.toLowerCase()}:${entity.name}`

const makeIdempotencyKey = (prefix: string, identifier: string): IdempotencyKey =>
  IdempotencyKey(`scholar:${prefix}:${identifier}`)

export const writeEntities = (
  entities: ReadonlyArray<ExtractedEntity>,
  correlationContext: CorrelationContext,
) =>
  Effect.all(
    entities.map((extracted) =>
      addEntity({
        type: extracted.type,
        name: extracted.name,
        properties: extracted.properties,
        idempotencyKey: makeIdempotencyKey('entity', entityRef(extracted)),
        correlationContext,
      }),
    ),
    { concurrency: 'unbounded' },
  )

export const writeRelations = (
  relations: ReadonlyArray<ExtractedRelation>,
  entityMap: ReadonlyMap<string, Entity>,
  correlationContext: CorrelationContext,
) =>
  Effect.all(
    relations.flatMap((extracted) => {
      const fromEntity = entityMap.get(extracted.fromEntityRef)
      const toEntity = entityMap.get(extracted.toEntityRef)
      if (!fromEntity || !toEntity) return []

      return [
        addRelation({
          fromId: fromEntity.id,
          toId: toEntity.id,
          type: extracted.type,
          idempotencyKey: makeIdempotencyKey(
            'relation',
            `${extracted.fromEntityRef}->${extracted.type}->${extracted.toEntityRef}`,
          ),
          correlationContext,
        }),
      ]
    }),
    { concurrency: 'unbounded' },
  )

export const writeKnowledge = (
  entities: ReadonlyArray<ExtractedEntity>,
  relations: ReadonlyArray<ExtractedRelation>,
  correlationContext: CorrelationContext,
) =>
  Effect.gen(function* () {
    const createdEntities = yield* writeEntities(entities, correlationContext)

    const entityMap = new Map<string, Entity>()
    for (let i = 0; i < entities.length; i++) {
      entityMap.set(entityRef(entities[i]), createdEntities[i])
    }

    const createdRelations = yield* writeRelations(relations, entityMap, correlationContext)

    return { entities: createdEntities, relations: createdRelations }
  })
