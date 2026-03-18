import { describe, it, expect } from 'vitest'
import { Effect } from 'effect'
import { HolonId, createCorrelationContext } from '@holon/shared'
import { createActor } from '../src/actor.js'
import { createMessage } from '../src/message.js'
import { createMailbox } from '../src/mailbox.js'

describe('Actor', () => {
  it('processes messages and updates state', async () => {
    const actor = createActor<number, { increment: number }>({
      initialState: 0,
      handler: (state, message) => Effect.succeed(state + message.payload.increment),
    })

    expect(actor.getState()).toBe(0)

    const msg = createMessage(
      HolonId('sender'),
      HolonId('receiver'),
      'INCREMENT',
      { increment: 5 },
      createCorrelationContext('test'),
    )

    await Effect.runPromise(actor.receive(msg))
    expect(actor.getState()).toBe(5)

    const msg2 = createMessage(
      HolonId('sender'),
      HolonId('receiver'),
      'INCREMENT',
      { increment: 3 },
      createCorrelationContext('test'),
    )

    await Effect.runPromise(actor.receive(msg2))
    expect(actor.getState()).toBe(8)
  })

  it('processes messages in FIFO order', async () => {
    const processed: string[] = []

    const actor = createActor<null, { label: string }>({
      initialState: null,
      handler: (_state, message) => {
        processed.push(message.payload.label)
        return Effect.succeed(null)
      },
    })

    const makeMsg = (label: string) =>
      createMessage(
        HolonId('sender'),
        HolonId('receiver'),
        'LOG',
        { label },
        createCorrelationContext('test'),
      )

    await Effect.runPromise(actor.receive(makeMsg('first')))
    await Effect.runPromise(actor.receive(makeMsg('second')))
    await Effect.runPromise(actor.receive(makeMsg('third')))

    expect(processed).toEqual(['first', 'second', 'third'])
  })
})

describe('Mailbox', () => {
  it('maintains FIFO ordering', () => {
    const mailbox = createMailbox<string>()

    const makeMsg = (payload: string) =>
      createMessage(
        HolonId('a'),
        HolonId('b'),
        'TEST',
        payload,
        createCorrelationContext('test'),
      )

    mailbox.enqueue(makeMsg('first'))
    mailbox.enqueue(makeMsg('second'))
    mailbox.enqueue(makeMsg('third'))

    expect(mailbox.size()).toBe(3)
    expect(mailbox.dequeue()?.payload).toBe('first')
    expect(mailbox.dequeue()?.payload).toBe('second')
    expect(mailbox.dequeue()?.payload).toBe('third')
    expect(mailbox.isEmpty()).toBe(true)
  })

  it('peek returns first without removing', () => {
    const mailbox = createMailbox<string>()
    const msg = createMessage(
      HolonId('a'),
      HolonId('b'),
      'TEST',
      'peek-me',
      createCorrelationContext('test'),
    )

    mailbox.enqueue(msg)
    expect(mailbox.peek()?.payload).toBe('peek-me')
    expect(mailbox.size()).toBe(1)
  })

  it('drain returns all messages and clears queue', () => {
    const mailbox = createMailbox<string>()
    const makeMsg = (payload: string) =>
      createMessage(
        HolonId('a'),
        HolonId('b'),
        'TEST',
        payload,
        createCorrelationContext('test'),
      )

    mailbox.enqueue(makeMsg('a'))
    mailbox.enqueue(makeMsg('b'))

    const drained = mailbox.drain()
    expect(drained).toHaveLength(2)
    expect(mailbox.isEmpty()).toBe(true)
  })
})
