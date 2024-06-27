import { CallbackFunction } from 'db-migrate-base'

export function up(db: any, callback: CallbackFunction) {
  const createTableOptions = {
    columns: {
      token: 'string',
      kind: 'string',
      channelId: {
        type: 'string',
        notNull: true,
      },
    },
    ifNotExists: true,
  }
  db.createTable('token', createTableOptions, callback)
}

export function down(db: any, callback: CallbackFunction) {
  db.dropTable('token', callback)
}
