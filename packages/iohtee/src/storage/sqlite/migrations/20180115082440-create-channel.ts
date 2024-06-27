import bigNumberColumn from './util/bigNumberColumn'
import { CallbackFunction } from 'db-migrate-base'

export async function up(db: any, callback: CallbackFunction) {
  const createTableOptions = {
    columns: {
      channelId: {
        type: 'string',
        primaryKey: true,
      },
      kind: 'string',
      sender: 'string',
      receiver: 'string',
      value: bigNumberColumn,
      spent: bigNumberColumn,
      state: 'smallint',
      contractAddress: 'string',
      tokenContract: 'string',
      settlementPeriod: 'string',
      settlingUntil: 'string',
    },
    ifNotExists: true,
  }
  db.createTable('channel', createTableOptions, callback)
}

export function down(db: any, callback: CallbackFunction) {
  db.dropTable('channel', callback)
}
