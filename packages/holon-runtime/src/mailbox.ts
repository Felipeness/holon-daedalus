import type { HolonMessage } from './message.js'

export interface Mailbox<T = unknown> {
  readonly enqueue: (message: HolonMessage<T>) => void
  readonly dequeue: () => HolonMessage<T> | null
  readonly peek: () => HolonMessage<T> | null
  readonly size: () => number
  readonly isEmpty: () => boolean
  readonly drain: () => ReadonlyArray<HolonMessage<T>>
}

export const createMailbox = <T = unknown>(): Mailbox<T> => {
  const queue: HolonMessage<T>[] = []

  return {
    enqueue: (message) => {
      queue.push(message)
    },
    dequeue: () => queue.shift() ?? null,
    peek: () => queue[0] ?? null,
    size: () => queue.length,
    isEmpty: () => queue.length === 0,
    drain: () => {
      const messages = [...queue]
      queue.length = 0
      return messages
    },
  }
}
