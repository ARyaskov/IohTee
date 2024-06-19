import IExec from '../IExec'
import IEngine from '../IEngine'
import * as fs from 'fs'
import Database from 'better-sqlite3'
import SqliteDatastore from './SqliteDatastore'

let db = new Map<string, SqliteDatastore>()

export class EngineSqlite implements IEngine, IExec<SqliteDatastore> {
  private datastore: SqliteDatastore | null = null

  constructor(url: string) {
    if (url.startsWith('sqlite://')) {
      url = url.replace('sqlite://', '')
    }
    let found = db.get(url)
    if (found) {
      this.datastore = found
    } else {
      const database = new Database(url, { verbose: console.log })
      database.pragma('journal_mode = WAL')
      this.datastore = new SqliteDatastore(database)
      db.set(url, this.datastore)
    }
  }

  isConnected(): boolean {
    return true
  }

  async connect(): Promise<any> {
    return Promise.resolve()
  }

  async close(): Promise<void> {
    return this.exec(async (client) => {
      return client.close()
    })
  }

  async drop(): Promise<void> {
    try {
      const row: any = this.datastore!.database.prepare(
        'PRAGMA database_list',
      ).get()
      if (row && row['file'] && row['file'].length > 0) {
        fs.unlinkSync(row['file'])
        console.log(`Database file ${row['file']} deleted.`)
      } else {
        console.log('No database file to delete.')
      }
    } catch (error) {
      console.error('Error dropping the database:', error)
      throw error
    }
  }

  async exec<B>(fn: (client: SqliteDatastore) => B): Promise<B> {
    return fn(this.datastore!)
  }
}
