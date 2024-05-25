import sqlite3 from 'sqlite3'

export default class SqliteDatastore {
  database: sqlite3.Database

  constructor (database: sqlite3.Database) {
    this.database = database
  }

  run (query: string, params?: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.database.run(query, params, (error: Error | null) => {
        error ? reject(error) : resolve()
      })
    })
  }

  close (): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.database.close((error: Error | null) => {
        error ? reject(error) : resolve()
      })
    })
  }

  get <A> (query: string, params?: any): Promise<A | null> {
    return new Promise<A>((resolve, reject) => {
      this.database.get(query, params, (error: Error | null, row: any) => {
        error ? reject(error) : resolve(row)
      })
    })
  }

  all <A> (query: string, params?: any): Promise<Array<A>> {
    return new Promise<Array<A>>((resolve, reject) => {
      this.database.all(query, params, (error: Error | null, rows: any) => {
        error ? reject(error) : resolve(rows)
      })
    })
  }
}
