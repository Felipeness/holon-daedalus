import { Effect } from 'effect'
import type { HolonMessage } from './message.js'
import { createMailbox, type Mailbox } from './mailbox.js'

export interface Actor<S, T = unknown> {
  readonly receive: (message: HolonMessage<T>) => Effect.Effect<void>
  readonly getState: () => S
  readonly mailbox: Mailbox<T>
}

export interface ActorConfig<S, T> {
  readonly initialState: S
  readonly handler: (state: S, message: HolonMessage<T>) => Effect.Effect<S>
}

export const createActor = <S, T = unknown>(config: ActorConfig<S, T>): Actor<S, T> => {
  let state = config.initialState
  const mailbox = createMailbox<T>()

  const receive = (message: HolonMessage<T>): Effect.Effect<void> =>
    Effect.gen(function* () {
      mailbox.enqueue(message)
      const msg = mailbox.dequeue()
      if (msg) {
        state = yield* config.handler(state, msg)
      }
    })

  const getState = () => state

  return { receive, getState, mailbox }
}
