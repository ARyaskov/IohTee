import { CallbackFunction } from 'db-migrate-base'

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
  return db.removeColumn('channel', 'settlementPeriod', callback)
}
