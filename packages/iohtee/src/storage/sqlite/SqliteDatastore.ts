import * as betterSQLite3 from 'better-sqlite3'

export default class SqliteDatastore {
  database: betterSQLite3.Database

  constructor(database: betterSQLite3.Database) {
    this.database = database
  }

  run(query: string, params?: any): void {
    try {
      this.database.prepare(query).run(params)
    } catch (error) {
      console.error('Error executing run:', error)
      throw error
    }
  }

  close(): void {
    try {
      this.database.close()
    } catch (error) {
      console.error('Error closing the database:', error)
      throw error
    }
  }

  get<A>(query: string, params?: any): A | null {
    try {
      return this.database.prepare(query).get(params) as A | null
    } catch (error) {
      console.error('Error executing get:', error)
      throw error
    }
  }

  all<A>(query: string, params?: any): Array<A> {
    try {
      return this.database.prepare(query).all(params) as Array<A>
    } catch (error) {
      console.error('Error executing all:', error)
      throw error
    }
  }
}
