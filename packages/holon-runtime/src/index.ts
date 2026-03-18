export type { Actor, ActorConfig } from './actor.js'
export { createActor } from './actor.js'

export type { Mailbox } from './mailbox.js'
export { createMailbox } from './mailbox.js'

export type { HolonMessage } from './message.js'
export { createMessage } from './message.js'

export { RestartStrategy } from './supervisor.js'
export type { SupervisorConfig, SupervisorState } from './supervisor.js'
export { createSupervisor, shouldRestart, recordRestart } from './supervisor.js'

export type { SkinLayer, BrainLayer, MemoryLayer, ImmuneLayer, HolonLayers } from './layers.js'
