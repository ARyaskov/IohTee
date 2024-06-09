import ChannelInflator from './ChannelInflator'
import IMigrator from './storage/IMigrator'
import ITokensDatabase from './storage/ITokensDatabase'
import IPaymentsDatabase from './storage/IPaymentsDatabase'
import IChannelsDatabase from './storage/IChannelsDatabase'
import IEngine from './storage/IEngine'
import Logger from '@machinomy/logger'

import { EngineNedb } from './storage/nedb/EngineNedb'
import { NedbTokensDatabase } from './storage/nedb/NedbTokensDatabase'
import { NedbPaymentsDatabase } from './storage/nedb/NedbPaymentsDatabase'
import { NedbChannelsDatabase } from './storage/nedb/NedbChannelsDatabase'
import { NedbMigrator } from './storage/nedb/NedbMigrator'

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

export interface Storage {
  engine: IEngine
  tokensDatabase: ITokensDatabase
  paymentsDatabase: IPaymentsDatabase
  channelsDatabase: IChannelsDatabase
  migrator: IMigrator
}

async function buildNedb(
  databaseUrl: string,
  inflator: ChannelInflator,
  namespace: string,
): Promise<Storage> {
  // let EngineNedb = (await import('./storage/nedb/EngineNedb.js')).default
  // let NedbTokensDatabase = (await import('./storage/nedb/NedbTokensDatabase.js')).default
  // let NedbPaymentsDatabase = (await import('./storage/nedb/NedbPaymentsDatabase.js')).default
  // let NedbChannelsDatabase = (await import('./storage/nedb/NedbChannelsDatabase.js')).default
  // let NedbMigrator = (await import('./storage/nedb/NedbMigrator.js')).default

  let engine = new EngineNedb(databaseUrl, false)
  return {
    engine: engine,
    tokensDatabase: new NedbTokensDatabase(engine, namespace),
    paymentsDatabase: new NedbPaymentsDatabase(engine, namespace),
    channelsDatabase: new NedbChannelsDatabase(engine, inflator, namespace),
    migrator: new NedbMigrator(),
  }
}

async function buildSqlite(
  databaseUrl: string,
  inflator: ChannelInflator,
  namespace: string,
): Promise<Storage> {
  // let EngineSqlite = (await import('./storage/sqlite/EngineSqlite')).default
  // let SqliteTokensDatabase = (await import('./storage/sqlite/SqliteTokensDatabase')).default
  // let SqlitePaymentsDatabase = (await import('./storage/sqlite/SqlitePaymentsDatabase')).default
  // let SqliteChannelsDatabase = (await import('./storage/sqlite/SqliteChannelsDatabase')).default
  // let SqliteMigrator = (await import('./storage/sqlite/SqliteMigrator')).default

  let engine = new EngineSqlite(databaseUrl)
  return {
    engine: engine,
    tokensDatabase: new SqliteTokensDatabase(engine, namespace),
    paymentsDatabase: new SqlitePaymentsDatabase(engine, namespace),
    channelsDatabase: new SqliteChannelsDatabase(engine, inflator, namespace),
    migrator: new SqliteMigrator(databaseUrl),
  }
}

async function buildPostgres(
  databaseUrl: string,
  inflator: ChannelInflator,
  namespace: string,
): Promise<Storage> {
  // let EnginePostgres = (await import('./storage/postgresql/EnginePostgres')).default
  // let PostgresTokensDatabase = (await import('./storage/postgresql/PostgresTokensDatabase')).default
  // let PostgresPaymentsDatabase = (await import('./storage/postgresql/PostgresPaymentsDatabase')).default
  // let PostgresChannelsDatabase = (await import('./storage/postgresql/PostgresChannelsDatabase')).default
  // let PostgresqlMigrator = (await import('./storage/postgresql/PostgresqlMigrator')).default

  let engine = new EnginePostgres(databaseUrl)
  return {
    engine: engine,
    tokensDatabase: new PostgresTokensDatabase(engine, namespace),
    paymentsDatabase: new PostgresPaymentsDatabase(engine, namespace),
    channelsDatabase: new PostgresChannelsDatabase(engine, inflator, namespace),
    migrator: new PostgresqlMigrator(databaseUrl),
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
    const namespace = 'shared' // TODO Namespace

    log.info('Found protocol %s', protocol)

    switch (protocol) {
      case 'nedb':
        log.info('Use nedb database')
        return buildNedb(splits[1], inflator, namespace)
      case 'postgresql':
        log.info('Use postgresql database')
        return buildPostgres(databaseUrl, inflator, namespace)
      case 'sqlite':
        log.info('Use sqlite database')
        return buildSqlite(databaseUrl, inflator, namespace)
      default:
        throw new Error(`Unsupported database protocol: ${protocol}`)
    }
  }
}

export default Storage
