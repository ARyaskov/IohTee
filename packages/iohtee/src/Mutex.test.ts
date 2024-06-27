import Mutex from './Mutex'
import { expect } from 'expect'

describe('Mutex', () => {
  function wait(time: number): Promise<number> {
    return new Promise((resolve) => setTimeout(() => resolve(time), time))
  }

  // use setImmediate to mimic an async operation calling the method
  function now(task: Function) {
    return new Promise((resolve, reject) => {
      setImmediate(() => {
        task().then(resolve).catch(reject)
      })
    })
  }

  it('should process tasks in order', () => {
    let outs: Array<number> = []
    let mutex = new Mutex()

    return Promise.all([
      now(() => mutex.synchronize(() => wait(2)).then((num) => outs.push(num))),
      now(() => mutex.synchronize(() => wait(7)).then((num) => outs.push(num))),
      now(() => mutex.synchronize(() => wait(3)).then((num) => outs.push(num))),
    ]).then(() => expect(outs).toEqual([2, 7, 3]))
  })

  it('should process tasks in order by queue name', () => {
    let outs: Array<number> = []
    let mutex = new Mutex()

    return Promise.all([
      now(() =>
        mutex
          .synchronizeOn('honk', () => wait(2))
          .then((num) => outs.push(num)),
      ),
      now(() =>
        mutex
          .synchronizeOn('beep', () => wait(7))
          .then((num) => outs.push(num)),
      ),
      now(() =>
        mutex
          .synchronizeOn('honk', () => wait(3))
          .then((num) => outs.push(num)),
      ),
    ]).then(() => expect(outs).toEqual([2, 3, 7]))
  })
})
