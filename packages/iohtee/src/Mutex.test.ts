import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import Mutex from './Mutex'

function wait(time: number): Promise<number> {
  return new Promise((resolve) => setTimeout(() => resolve(time), time))
}

function now<T>(task: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    setImmediate(() => {
      task().then(resolve).catch(reject)
    })
  })
}

describe('Mutex', () => {
  it('should process tasks in order', async () => {
    const outs: Array<number> = []
    const mutex = new Mutex()

    await Promise.all([
      now(() => mutex.synchronize(() => wait(2)).then((num) => outs.push(num))),
      now(() => mutex.synchronize(() => wait(7)).then((num) => outs.push(num))),
      now(() => mutex.synchronize(() => wait(3)).then((num) => outs.push(num))),
    ])

    assert.deepEqual(outs, [2, 7, 3])
  })

  it('should process tasks in order by queue name', async () => {
    const outs: Array<string> = []
    const mutex = new Mutex()

    await Promise.all([
      now(() =>
        mutex
          .synchronizeOn('honk', () => wait(20))
          .then(() => outs.push('honk-1')),
      ),
      now(() =>
        mutex
          .synchronizeOn('beep', () => wait(1))
          .then(() => outs.push('beep-1')),
      ),
      now(() =>
        mutex
          .synchronizeOn('honk', () => wait(5))
          .then(() => outs.push('honk-2')),
      ),
    ])

    assert.equal(outs.length, 3)
    assert.ok(outs.includes('beep-1'))
    assert.ok(outs.indexOf('honk-1') < outs.indexOf('honk-2'))
  })
})
