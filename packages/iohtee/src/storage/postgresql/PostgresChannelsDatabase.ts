import { PaymentChannel } from '../../PaymentChannel'
import EnginePostgres from './EnginePostgres'
import AbstractChannelsDatabase from '../AbstractChannelsDatabase'

export default class PostgresChannelsDatabase extends AbstractChannelsDatabase<EnginePostgres> {
  save(paymentChannel: PaymentChannel): Promise<void> {
    return this.engine.exec((client: any) =>
      client.query(
        'INSERT INTO channel("channelId", kind, sender, receiver, value, spent, state, "tokenContract", "settlementPeriod", "settlingUntil") ' +
          'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [
          paymentChannel.channelId,
          this.kind,
          paymentChannel.sender,
          paymentChannel.receiver,
          paymentChannel.value.toString(),
          paymentChannel.spent.toString(),
          paymentChannel.state,
          paymentChannel.tokenContract,
          paymentChannel.settlementPeriod,
          paymentChannel.settlingUntil.toString(),
        ],
      ),
    )
  }

  firstById(channelId: `0x${string}`): Promise<PaymentChannel | null> {
    return this.engine
      .exec((client: any) =>
        client.query(
          'SELECT "channelId", kind, sender, receiver, value, spent, state, "tokenContract", "settlementPeriod", "settlingUntil" FROM channel ' +
            'WHERE "channelId" = $1 LIMIT 1',
          [channelId.toString()],
        ),
      )
      .then((res: any) => this.inflatePaymentChannel(res.rows[0]))
  }

  spend(channelId: `0x${string}`, spent: bigint): Promise<void> {
    return this.engine.exec((client: any) =>
      client.query('UPDATE channel SET spent = $2 WHERE "channelId" = $1', [
        channelId,
        spent.toString(),
      ]),
    )
  }

  async deposit(channelId: `0x${string}`, value: bigint): Promise<void> {
    return this.engine.exec(async (client: any) => {
      const channel = await this.firstById(channelId)

      if (!channel) {
        throw new Error('Channel not found.')
      }

      const newValue = channel.value + value

      return client.query(
        'UPDATE channel SET value = $2 WHERE "channelId" = $1',
        [channelId.toString(), newValue.toString()],
      )
    })
  }

  all(): Promise<Array<PaymentChannel>> {
    return this.engine
      .exec((client: any) =>
        client.query(
          'SELECT "channelId", kind, sender, receiver, value, spent, state, "tokenContract", "settlementPeriod", "settlingUntil" FROM channel',
        ),
      )
      .then((res: any) => this.inflatePaymentChannels(res.rows))
  }

  allOpen(): Promise<PaymentChannel[]> {
    return this.engine
      .exec((client) =>
        client.query(
          'SELECT "channelId", kind, sender, receiver, value, spent, state, "tokenContract", "settlementPeriod", "settlingUntil" FROM channel ' +
            'WHERE state = 0',
        ),
      )
      .then((res: any) => this.inflatePaymentChannels(res.rows))
      .then((chans: PaymentChannel[]) => this.filterByState(0, chans))
  }

  async findUsable(
    sender: `0x${string}`,
    receiver: `0x${string}`,
    amount: bigint,
  ): Promise<PaymentChannel | null> {
    const res = await this.engine.exec((client) =>
      client.query(
        'SELECT "channelId", kind, sender, receiver, value, spent, state, "tokenContract", "settlementPeriod", "settlingUntil" FROM channel ' +
          'WHERE sender = $1 AND receiver = $2 AND value >= spent + $3 AND state = 0',
        [sender, receiver, amount.toString()],
      ),
    )
    const channels = await Promise.all(
      res.rows.map((r) => this.inflatePaymentChannel(r)),
    )
    const nonEmpty = channels.reduce<Array<PaymentChannel>>((acc, chan) => {
      if (chan) {
        acc.push(chan)
      }
      return acc
    }, [])
    if (nonEmpty.length) {
      return this.filterByState(0, nonEmpty)[0]
    } else {
      return null
    }
  }

  findBySenderReceiver(
    sender: `0x${string}`,
    receiver: `0x${string}`,
  ): Promise<Array<PaymentChannel>> {
    return this.engine
      .exec((client: any) =>
        client.query(
          'SELECT "channelId", kind, sender, receiver, value, spent, state, "tokenContract", "settlementPeriod", "settlingUntil" FROM channel ' +
            'WHERE sender = $1 AND receiver = $2',
          [sender, receiver],
        ),
      )
      .then((res: any) => this.inflatePaymentChannels(res.rows))
  }

  findBySenderReceiverChannelId(
    sender: `0x${string}`,
    receiver: `0x${string}`,
    channelId: `0x${string}`,
  ): Promise<PaymentChannel | null> {
    return this.engine
      .exec((client: any) =>
        client.query(
          'SELECT "channelId", kind, sender, receiver, value, spent, state, "tokenContract", "settlementPeriod", "settlingUntil" FROM channel ' +
            'WHERE sender = $1 AND receiver = $2 AND "channelId" = $3 LIMIT 1',
          [sender, receiver, channelId.toString()],
        ),
      )
      .then((res: any) => this.inflatePaymentChannel(res.rows[0]))
  }

  updateState(channelId: `0x${string}`, state: number): Promise<void> {
    return this.engine.exec((client: any) =>
      client.query('UPDATE channel SET state = $1 WHERE "channelId" = $2', [
        state,
        channelId.toString(),
      ]),
    )
  }

  updateSettlingUntil(
    channelId: `0x${string}`,
    settlingUntil: bigint,
  ): Promise<void> {
    return this.engine.exec((client: any) =>
      client.query(
        'UPDATE channel SET "settlingUntil" = $1 WHERE "channelId" = $2',
        [settlingUntil.toString(), channelId],
      ),
    )
  }
}
