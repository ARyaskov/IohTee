import { CallbackFunction } from 'db-migrate-base'

export function up(db: any, callback: CallbackFunction) {
  return db.addColumn(
    'channel',
    'settlingUntil',
    {
      type: 'string',
    },
    callback,
  )
}

export function down(db: any, callback: CallbackFunction) {
  return db.removeColumn('channel', 'settlingUntil', callback)
}
