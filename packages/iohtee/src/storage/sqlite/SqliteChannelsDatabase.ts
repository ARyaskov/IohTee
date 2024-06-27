import ChannelId from '../../ChannelId'
import { PaymentChannel, PaymentChannelJSON } from '../../PaymentChannel'
import { EngineSqlite } from './EngineSqlite'
import AbstractChannelsDatabase from '../AbstractChannelsDatabase'

export class SqliteChannelsDatabase extends AbstractChannelsDatabase<EngineSqlite> {
  async save(paymentChannel: PaymentChannel): Promise<void> {
    return this.engine.exec(async (client) => {
      await client.run(
        'INSERT INTO channel("channelId", kind, sender, receiver, value, spent, state, "tokenContract", "settlementPeriod", "settlingUntil") ' +
          'VALUES ($channelId, $kind, $sender, $receiver, $value, $spent, $state, $tokenContract, $settlementPeriod, $settlingUntil)',
        {
          channelId: paymentChannel.channelId,
          kind: this.kind,
          sender: paymentChannel.sender,
          receiver: paymentChannel.receiver,
          value: paymentChannel.value.toString(),
          spent: paymentChannel.spent.toString(),
          state: paymentChannel.state,
          tokenContract: paymentChannel.tokenContract,
          settlementPeriod: paymentChannel.settlementPeriod,
          settlingUntil: paymentChannel.settlingUntil.toString(),
        },
      )
    })
  }

  async firstById(channelId: `0x${string}`): Promise<PaymentChannel | null> {
    return this.engine.exec(async (client) => {
      let raw = await client.get<PaymentChannelJSON>(
        'SELECT "channelId", kind, sender, receiver, value, spent, state, "tokenContract", "settlementPeriod", "settlingUntil" FROM channel ' +
          'WHERE "channelId" = $channelId LIMIT 1',
        {
          channelId: channelId,
        },
      )
      return raw ? this.inflatePaymentChannel(raw) : null
    })
  }

  async spend(channelId: `0x${string}`, spent: bigint): Promise<void> {
    return this.engine.exec(async (client) => {
      return client.run(
        'UPDATE channel SET spent = $spent WHERE "channelId" = $channelId',
        {
          channelId: channelId,
          spent: spent.toString(),
        },
      )
    })
  }

  async deposit(channelId: `0x${string}`, value: bigint): Promise<void> {
    return this.engine.exec(async (client) => {
      let channel = await this.firstById(channelId)
      if (!channel) {
        throw new Error('Channel not found.')
      }

      const newValue = channel.value + value

      return client.run(
        'UPDATE channel SET value = $value WHERE "channelId" = $channelId',
        {
          channelId: channelId,
          value: newValue.toString(),
        },
      )
    })
  }

  async all(): Promise<Array<PaymentChannel>> {
    return this.engine.exec(async (client) => {
      let raw = await client.all<PaymentChannelJSON>(
        'SELECT "channelId", kind, sender, receiver, value, spent, state, "tokenContract", "settlementPeriod", "settlingUntil" FROM channel',
      )
      return this.inflatePaymentChannels(raw)
    })
  }

  async allOpen(): Promise<Array<PaymentChannel>> {
    return this.engine.exec(async (client) => {
      let raw = await client.all<PaymentChannelJSON>(
        'SELECT "channelId", kind, sender, receiver, value, spent, state, "tokenContract", "settlementPeriod", "settlingUntil" FROM channel ' +
          'WHERE state = 0',
      )
      let channels = await this.inflatePaymentChannels(raw)
      return this.filterByState(0, channels)
    })
  }

  async findUsable(
    sender: `0x${string}`,
    receiver: `0x${string}`,
    amount: bigint,
  ): Promise<PaymentChannel | null> {
    return this.engine.exec(async (client) => {
      let raw = await client.get<PaymentChannelJSON>(
        'SELECT "channelId", kind, sender, receiver, value, spent, state, "tokenContract", "settlementPeriod", "settlingUntil" FROM channel ' +
          'WHERE sender = $sender AND receiver = $receiver AND value >= spent + $amount AND state = 0',
        {
          sender: sender,
          receiver: receiver,
          amount: amount.toString(),
        },
      )
      if (raw) {
        let channel = await this.inflatePaymentChannel(raw)
        if (channel && channel.state === 0) {
          return channel
        }
        return null
      } else {
        return null
      }
    })
  }

  async findBySenderReceiver(
    sender: `0x${string}`,
    receiver: `0x${string}`,
  ): Promise<Array<PaymentChannel>> {
    return this.engine.exec(async (client) => {
      let rows = await client.all<PaymentChannelJSON>(
        'SELECT "channelId", kind, sender, receiver, value, spent, state, "tokenContract", "settlementPeriod", "settlingUntil" FROM channel ' +
          'WHERE sender = $sender AND receiver = $receiver',
        {
          sender: sender,
          receiver: receiver,
        },
      )
      return this.inflatePaymentChannels(rows)
    })
  }

  async findBySenderReceiverChannelId(
    sender: `0x${string}`,
    receiver: `0x${string}`,
    channelId: `0x${string}`,
  ): Promise<PaymentChannel | null> {
    return this.engine.exec(async (client) => {
      let row = await client.get<PaymentChannelJSON>(
        'SELECT "channelId", kind, sender, receiver, value, spent, state, "tokenContract", "settlementPeriod", "settlingUntil" FROM channel ' +
          'WHERE sender = $sender AND receiver = $receiver AND "channelId" = $channelId LIMIT 1',
        {
          sender: sender,
          receiver: receiver,
          channelId: channelId,
        },
      )
      return row ? this.inflatePaymentChannel(row) : null
    })
  }

  async updateState(
    channelId: ChannelId | string,
    state: number,
  ): Promise<void> {
    return this.engine.exec(async (client) => {
      return client.run(
        'UPDATE channel SET state = $state WHERE "channelId" = $channelId',
        {
          state: state,
          channelId: channelId.toString(),
        },
      )
    })
  }

  async updateSettlingUntil(
    channelId: `0x${string}`,
    settlingUntil: bigint,
  ): Promise<void> {
    return this.engine.exec(async (client) => {
      return client.run(
        'UPDATE channel SET "settlingUntil" = $settlingUntil WHERE "channelId" = $channelId',
        {
          settlingUntil: settlingUntil.toString(),
          channelId: channelId,
        },
      )
    })
  }
}
