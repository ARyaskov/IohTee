import { CallbackFunction } from 'db-migrate-base'
import removeColumn from './util/removeColumn'

export function up(db: any, callback: CallbackFunction) {
  return db.addColumn(
    'channel',
    'settlementPeriod',
    {
      type: 'string',
    },
    callback,
  )
}

export function down(db: any, callback: CallbackFunction) {
  removeColumn(db, 'channel', 'settlementPeriod', callback)
}
