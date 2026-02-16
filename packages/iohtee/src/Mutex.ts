export type Task<T> = () => Promise<T>

export default class Mutex {
  private static readonly DEFAULT_QUEUE = '__MUTEX_DEFAULT_QUEUE'
  private readonly queues = new Map<string, Promise<void>>()

  synchronize<T>(task: Task<T>): Promise<T> {
    return this.synchronizeOn(Mutex.DEFAULT_QUEUE, task)
  }

  async synchronizeOn<T>(key: string, task: Task<T>): Promise<T> {
    const previous = this.queues.get(key) ?? Promise.resolve()

    let release: () => void = () => undefined
    const current = new Promise<void>((resolve) => {
      release = resolve
    })
    const tail = previous.then(() => current)

    this.queues.set(key, tail)

    await previous
    try {
      return await task()
    } finally {
      release()
      if (this.queues.get(key) === tail) {
        this.queues.delete(key)
      }
    }
  }
}
