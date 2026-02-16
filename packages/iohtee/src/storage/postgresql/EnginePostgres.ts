import IEngine from '../IEngine'
import { Pool } from 'pg'
import IExec from '../IExec'

export default class EnginePostgres implements IEngine, IExec<Pool> {
  private readonly url?: string
  private pool?: Pool
  private connectionInProgress?: Promise<Pool>

  constructor(url?: string) {
    this.url = url
  }

  async connect(): Promise<void> {
    await this.ensureConnection()
  }

  isConnected(): boolean {
    return Boolean(this.pool)
  }

  async close(): Promise<void> {
    if (!this.pool) return
    await this.pool.end()
    this.pool = undefined
    this.connectionInProgress = undefined
  }

  async drop(): Promise<void> {
    await this.exec((client) =>
      Promise.all([
        client.query('TRUNCATE channel CASCADE'),
        client.query('TRUNCATE payment CASCADE'),
        client.query('TRUNCATE token CASCADE'),
      ]).then(() => undefined),
    )
  }

  async exec<B>(fn: (client: Pool) => B): Promise<B> {
    const client = await this.ensureConnection()
    return fn(client)
  }

  async ensureConnection(): Promise<Pool> {
    if (this.pool) {
      return this.pool
    }

    if (this.connectionInProgress) {
      return this.connectionInProgress
    }

    const pool = new Pool({ connectionString: this.url })

    this.connectionInProgress = pool.query('SELECT 1').then(() => {
      this.pool = pool
      return pool
    })

    return this.connectionInProgress
  }
}
