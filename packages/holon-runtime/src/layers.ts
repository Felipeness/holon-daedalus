import type { HolonId } from '@holon/shared'

export interface SkinLayer {
  readonly holonId: HolonId
  readonly receiveExternal: (input: unknown) => unknown
  readonly emitExternal: (output: unknown) => void
}

export interface BrainLayer {
  readonly decide: (input: unknown) => unknown
  readonly plan: (goal: string) => ReadonlyArray<string>
}

export interface MemoryLayer {
  readonly store: (key: string, value: unknown) => void
  readonly recall: (key: string) => unknown | null
  readonly forget: (key: string) => void
}

export interface ImmuneLayer {
  readonly validate: (input: unknown) => boolean
  readonly sanitize: (input: unknown) => unknown
  readonly rateLimit: (operationId: string) => boolean
}

export interface HolonLayers {
  readonly skin: SkinLayer
  readonly brain: BrainLayer
  readonly memory: MemoryLayer
  readonly immune: ImmuneLayer
}
