import { CallbackFunction } from 'db-migrate-base'
import removeColumn from './util/removeColumn'

export function up(db: any, callback: CallbackFunction) {
  return db.addColumn(
    'payment',
    'tokenContract',
    {
      type: 'string',
    },
    callback,
  )
}

export function down(db: any, callback: CallbackFunction) {
  removeColumn(db, 'payment', 'tokenContract', callback)
}
