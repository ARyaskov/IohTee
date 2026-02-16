import ChannelInflator from './ChannelInflator'
import IMigrator from './storage/IMigrator'
import ITokensDatabase from './storage/ITokensDatabase'
import IPaymentsDatabase from './storage/IPaymentsDatabase'
import IChannelsDatabase from './storage/IChannelsDatabase'
import IEngine from './storage/IEngine'
import Logger from './log'

import { EngineSqlite } from './storage/sqlite/EngineSqlite'
import { SqliteTokensDatabase } from './storage/sqlite/SqliteTokensDatabase'
import { SqlitePaymentsDatabase } from './storage/sqlite/SqlitePaymentsDatabase'
import { SqliteChannelsDatabase } from './storage/sqlite/SqliteChannelsDatabase'
import { SqliteMigrator } from './storage/sqlite/SqliteMigrator'

import EnginePostgres from './storage/postgresql/EnginePostgres'
import PostgresTokensDatabase from './storage/postgresql/PostgresTokensDatabase'
import PostgresPaymentsDatabase from './storage/postgresql/PostgresPaymentsDatabase'
import PostgresChannelsDatabase from './storage/postgresql/PostgresChannelsDatabase'
import PostgresqlMigrator from './storage/postgresql/PostgresqlMigrator'
import * as path from 'node:path'

export interface Storage {
  engine: IEngine
  tokensDatabase: ITokensDatabase
  paymentsDatabase: IPaymentsDatabase
  channelsDatabase: IChannelsDatabase
  migrator: IMigrator
}

async function buildSqlite(
  databaseUrl: string,
  inflator: ChannelInflator,
  namespace: string,
): Promise<Storage> {
  const engine = new EngineSqlite(databaseUrl)
  return {
    engine,
    tokensDatabase: new SqliteTokensDatabase(engine, namespace),
    paymentsDatabase: new SqlitePaymentsDatabase(engine, namespace),
    channelsDatabase: new SqliteChannelsDatabase(engine, inflator, namespace),
    migrator: new SqliteMigrator(engine),
  }
}

async function buildPostgres(
  databaseUrl: string,
  inflator: ChannelInflator,
  namespace: string,
): Promise<Storage> {
  const engine = new EnginePostgres(databaseUrl)
  return {
    engine,
    tokensDatabase: new PostgresTokensDatabase(engine, namespace),
    paymentsDatabase: new PostgresPaymentsDatabase(engine, namespace),
    channelsDatabase: new PostgresChannelsDatabase(engine, inflator, namespace),
    migrator: new PostgresqlMigrator(engine),
  }
}

const log = new Logger('storage')

export namespace Storage {
  export function build(
    databaseUrl: string,
    inflator: ChannelInflator,
  ): Promise<Storage> {
    const splits = databaseUrl.split('://')
    const protocol = splits[0]
    const namespace = 'shared'

    log.info('Found protocol %s', protocol)

    switch (protocol) {
      case 'postgresql':
      case 'postgres':
        log.info('Use postgresql database')
        return buildPostgres(databaseUrl, inflator, namespace)
      case 'sqlite': {
        const dbPath = splits[1]
        if (!path.isAbsolute(dbPath)) {
          throw new Error(
            'Please specify sqlite path as "sqlite://absolute-path-to-db"',
          )
        }
        log.info('Use sqlite database')
        return buildSqlite(databaseUrl, inflator, namespace)
      }
      default:
        throw new Error(`Unsupported database protocol: ${protocol}`)
    }
  }
}

export default Storage
