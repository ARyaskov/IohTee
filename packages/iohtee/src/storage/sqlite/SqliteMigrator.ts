import Logger from '../../log'
import SqlMigrator from '../SqlMigrator'
import { EngineSqlite } from './EngineSqlite'

const log = new Logger('migrator:sqlite')
const LATEST_VERSION = 1

export class SqliteMigrator extends SqlMigrator {
  private readonly engine: EngineSqlite

  constructor(engine: EngineSqlite) {
    super(log)
    this.engine = engine
  }

  protected latestVersion(): number {
    return LATEST_VERSION
  }

  protected async ensureMetaTable(): Promise<void> {
    await this.engine.exec((client) => {
      client.run(
        'CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER NOT NULL)',
      )

      const row = client.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM schema_migrations',
      )

      if (!row || row.count === 0) {
        client.run('INSERT INTO schema_migrations(version) VALUES (0)')
      }
    })
  }

  protected async readVersion(): Promise<number> {
    return this.engine.exec((client) => {
      const row = client.get<{ version: number }>(
        'SELECT version FROM schema_migrations LIMIT 1',
      )
      return row?.version ?? 0
    })
  }

  protected async writeVersion(version: number): Promise<void> {
    await this.engine.exec((client) => {
      client.run('UPDATE schema_migrations SET version = $version', { version })
    })
  }

  protected async ensureSchema(): Promise<void> {
    await this.engine.exec((client) => {
      client.run(`
        CREATE TABLE IF NOT EXISTS channel (
          channelId TEXT PRIMARY KEY,
          kind TEXT,
          sender TEXT,
          receiver TEXT,
          value TEXT,
          spent TEXT,
          state INTEGER,
          tokenContract TEXT,
          settlementPeriod TEXT,
          settlingUntil TEXT
        )
      `)

      client.run(`
        CREATE TABLE IF NOT EXISTS token (
          token TEXT,
          kind TEXT,
          channelId TEXT NOT NULL,
          FOREIGN KEY(channelId) REFERENCES channel(channelId) ON DELETE CASCADE
        )
      `)

      client.run(`
        CREATE TABLE IF NOT EXISTS payment (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          channelId TEXT NOT NULL,
          kind TEXT,
          token TEXT NOT NULL UNIQUE,
          sender TEXT,
          receiver TEXT,
          price TEXT,
          value TEXT,
          channelValue TEXT,
          v INTEGER,
          r TEXT,
          s TEXT,
          meta TEXT,
          contractAddress TEXT,
          tokenContract TEXT,
          createdAt INTEGER,
          FOREIGN KEY(channelId) REFERENCES channel(channelId) ON DELETE CASCADE
        )
      `)
    })
  }
}
