import IExec from '../IExec'
import IEngine from '../IEngine'
import fs from 'fs'
import sqlite from 'sqlite3'
import SqliteDatastore from './SqliteDatastore'

let db = new Map<string, SqliteDatastore>()

export class EngineSqlite implements IEngine, IExec<SqliteDatastore> {
  private readonly datastore: SqliteDatastore

  constructor (url: string) {
    if (url.startsWith('sqlite://')) {
      url = url.replace('sqlite://', '')
    }
    let found = db.get(url)
    if (found) {
      this.datastore = found
    } else {
      this.datastore = new SqliteDatastore(new sqlite.Database(url))
      db.set(url, this.datastore)
    }
  }

  isConnected (): boolean {
    return true
  }

  async connect (): Promise<any> {
    return Promise.resolve()
  }

  async close (): Promise<void> {
    return this.exec(async client => {
      return client.close()
    })
  }

  async drop (): Promise<any> {
    return this.exec(async client => {
      let row = await client.get<{file: string}>('PRAGMA database_list')
      if (row && row.file && row.file.length > 0) {
        fs.unlinkSync(row.file)
      }
    })
  }

  async exec <B> (fn: (client: SqliteDatastore) => B): Promise<B> {
    return fn(this.datastore)
  }
}
