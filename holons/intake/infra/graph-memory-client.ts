import { Context, Effect } from 'effect'
import type { Entity, ScoredEntity } from '@holon/graph-memory'

export interface GraphMemoryClientService {
  readonly findSimilarTasks: (
    queryText: string,
    limit: number,
  ) => Effect.Effect<ReadonlyArray<ScoredEntity>>
  readonly getTaskById: (id: string) => Effect.Effect<Entity | null>
}

export class GraphMemoryClient extends Context.Tag('intake/GraphMemoryClient')<
  GraphMemoryClient,
  GraphMemoryClientService
>() {}
