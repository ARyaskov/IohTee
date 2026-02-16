import type { DatabaseSync, StatementSync } from 'node:sqlite'

export default class SqliteDatastore {
  readonly database: DatabaseSync

  constructor(database: DatabaseSync) {
    this.database = database
  }

  run(query: string, params?: Record<string, any>) {
    const statement = this.database.prepare(query)
    if (params) {
      statement.run(params as any)
      return
    }
    statement.run()
  }

  close() {
    this.database.close()
  }

  get<A>(query: string, params?: Record<string, any>): A | null {
    const statement: StatementSync = this.database.prepare(query)
    const result = params ? statement.get(params as any) : statement.get()
    return (result as A | undefined) ?? null
  }

  all<A>(query: string, params?: Record<string, any>): Array<A> {
    const statement: StatementSync = this.database.prepare(query)
    const result = params ? statement.all(params as any) : statement.all()
    return result as Array<A>
  }
}
