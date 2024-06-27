import { MigrateOption } from './MigrateOption'
import { Transport } from './transport'

/**
 * Params for IohTee. Currently IohTee supports nedb, SQLite3 and PostgreSQL as a database engine.
 * Nedb is a default engine.
 */
export interface IohTeeOptions {
  databaseUrl: string
  minimumChannelAmount?: bigint
  minimumSettlementPeriod?: number
  settlementPeriod?: number
  closeOnInvalidPayment?: boolean
  migrate?: MigrateOption
  chainCachePeriod?: number
  transport?: Transport
}

export namespace IohTeeOptions {
  export function defaults(options?: IohTeeOptions): IohTeeOptions {
    let defaultOptions = {
      databaseUrl: 'nedb://iohtee',
    }
    return Object.assign({}, defaultOptions, options)
  }
}

export default IohTeeOptions
