import IExec from '../IExec'
import IEngine from '../IEngine'
import { rmSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import SqliteDatastore from './SqliteDatastore'

const db = new Map<string, SqliteDatastore>()

export class EngineSqlite implements IEngine, IExec<SqliteDatastore> {
  private readonly datastore: SqliteDatastore

  constructor(url: string) {
    const normalized = url.startsWith('sqlite://')
      ? url.slice('sqlite://'.length)
      : url
    const found = db.get(normalized)
    if (found) {
      this.datastore = found
      return
    }

    const database = new DatabaseSync(normalized)
    database.exec('PRAGMA journal_mode = WAL')

    this.datastore = new SqliteDatastore(database)
    db.set(normalized, this.datastore)
  }

  isConnected(): boolean {
    return true
  }

  async connect(): Promise<void> {
    return
  }

  async close(): Promise<void> {
    await this.exec((client) => client.close())
  }

  async drop(): Promise<void> {
    const row = this.datastore.get<{ file?: string }>('PRAGMA database_list')
    if (row?.file) {
      rmSync(row.file, { force: true })
    }
  }

  async exec<B>(fn: (client: SqliteDatastore) => B): Promise<B> {
    return fn(this.datastore)
  }
}
