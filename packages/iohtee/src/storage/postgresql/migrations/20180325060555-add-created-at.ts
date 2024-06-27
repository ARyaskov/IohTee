import { CallbackFunction } from 'db-migrate-base'

export function up(db: any, callback: CallbackFunction) {
  return db.addColumn(
    'payment',
    'createdAt',
    {
      type: 'bigint',
    },
    callback,
  )
}

export function down(db: any, callback: CallbackFunction) {
  return db.removeColumn('payment', 'createdAt', callback)
}
