import Logger from '@machinomy/logger'
import SqlMigrator from '../SqlMigrator'
import * as path from 'path'

export function migrationsConfig(connectionUrl: string) {
  const filename = connectionUrl.split('sqlite://')[1]
  return {
    cmdOptions: {
      'migrations-dir': path.resolve(__dirname, './migrations/'),
      env: 'defaultSqlite',
    },
    config: {
      defaultEnv: 'defaultSqlite',
      defaultSqlite: {
        driver: 'sqlite3',
        filename: filename,
      },
    },
  }
}

const log = new Logger('migrator:sqlite')

export class SqliteMigrator extends SqlMigrator {
  constructor(databaseUrl: string) {
    super(log, migrationsConfig(databaseUrl))
  }
}
