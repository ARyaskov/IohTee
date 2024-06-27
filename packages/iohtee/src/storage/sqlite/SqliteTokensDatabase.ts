import AbstractTokensDatabase from '../AbstractTokensDatabase'
import { EngineSqlite } from './EngineSqlite'
import ChannelId from '../../ChannelId'

export class SqliteTokensDatabase extends AbstractTokensDatabase<EngineSqlite> {
  async save(token: string, channelId: ChannelId | string): Promise<void> {
    return this.engine.exec(async (client) => {
      return client.run(
        'INSERT INTO token(token, "channelId", kind) VALUES ($token, $channelId, $kind)',
        {
          token: token,
          channelId: channelId.toString(),
          kind: this.kind,
        },
      )
    })
  }

  async isPresent(token: string): Promise<boolean> {
    return this.engine.exec(async (client) => {
      let rows = client.get<any>(
        'SELECT COUNT(*) as count FROM token WHERE token=$token',
        {
          token: token,
        },
      )
      return rows ? rows.count > 0 : false
    })
  }
}
