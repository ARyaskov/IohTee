import { CallbackFunction } from 'db-migrate-base'

export function up(db: any, callback: CallbackFunction) {
  const createTableOptions = {
    columns: {
      token: 'string',
      kind: 'string',
      channelId: {
        type: 'string',
        notNull: true,
        foreignKey: {
          name: 'tokens_channel_id_fk',
          table: 'channel',
          mapping: 'channelId',
          rules: {
            onDelete: 'CASCADE',
          },
        },
      },
    },
    ifNotExists: true,
  }
  db.createTable('token', createTableOptions, callback)
}

export function down(db: any, callback: CallbackFunction) {
  db.dropTable('token', callback)
}
