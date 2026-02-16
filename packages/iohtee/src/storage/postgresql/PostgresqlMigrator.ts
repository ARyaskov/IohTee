import Logger from '../../log'
import SqlMigrator from '../SqlMigrator'
import EnginePostgres from './EnginePostgres'

const log = new Logger('migrator:postgresql')
const LATEST_VERSION = 1

export default class PostgresqlMigrator extends SqlMigrator {
  private readonly engine: EnginePostgres

  constructor(engine: EnginePostgres) {
    super(log)
    this.engine = engine
  }

  protected latestVersion(): number {
    return LATEST_VERSION
  }

  protected async ensureMetaTable(): Promise<void> {
    await this.engine.exec(async (client) => {
      await client.query(
        'CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER NOT NULL)',
      )

      const row = await client.query<{ count: string }>(
        'SELECT COUNT(*) as count FROM schema_migrations',
      )
      const count = Number(row.rows[0]?.count ?? 0)

      if (count === 0) {
        await client.query('INSERT INTO schema_migrations(version) VALUES (0)')
      }
    })
  }

  protected async readVersion(): Promise<number> {
    return this.engine.exec(async (client) => {
      const row = await client.query<{ version: number }>(
        'SELECT version FROM schema_migrations LIMIT 1',
      )
      return Number(row.rows[0]?.version ?? 0)
    })
  }

  protected async writeVersion(version: number): Promise<void> {
    await this.engine.exec((client) =>
      client.query('UPDATE schema_migrations SET version = $1', [version]),
    )
  }

  protected async ensureSchema(): Promise<void> {
    await this.engine.exec(async (client) => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS channel (
          "channelId" TEXT PRIMARY KEY,
          kind TEXT,
          sender TEXT,
          receiver TEXT,
          value TEXT,
          spent TEXT,
          state SMALLINT,
          "tokenContract" TEXT,
          "settlementPeriod" TEXT,
          "settlingUntil" TEXT
        )
      `)

      await client.query(`
        CREATE TABLE IF NOT EXISTS token (
          token TEXT,
          kind TEXT,
          "channelId" TEXT NOT NULL,
          FOREIGN KEY ("channelId") REFERENCES channel("channelId") ON DELETE CASCADE
        )
      `)

      await client.query(`
        CREATE TABLE IF NOT EXISTS payment (
          id SERIAL PRIMARY KEY,
          "channelId" TEXT NOT NULL,
          kind TEXT,
          token TEXT NOT NULL UNIQUE,
          sender TEXT,
          receiver TEXT,
          price TEXT,
          value TEXT,
          "channelValue" TEXT,
          v INTEGER,
          r TEXT,
          s TEXT,
          meta TEXT,
          "contractAddress" TEXT,
          "tokenContract" TEXT,
          "createdAt" BIGINT,
          FOREIGN KEY ("channelId") REFERENCES channel("channelId") ON DELETE CASCADE
        )
      `)
    })
  }
}
