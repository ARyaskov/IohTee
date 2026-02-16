import { MigrateOption } from './MigrateOption'
import { Transport } from './transport'
import { join } from 'node:path'
import { homedir } from 'node:os'

export interface IohTeeOptions {
  databaseUrl: string
  tokenUnidirectionalAddress?: `0x${string}`
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
    const defaultOptions: IohTeeOptions = {
      databaseUrl: `sqlite://${join(homedir(), '.iohtee', 'storage.db')}`,
    }
    return Object.assign({}, defaultOptions, options)
  }
}

export default IohTeeOptions
