import AbstractChannelsDatabase from '../AbstractChannelsDatabase'
import IChannelsDatabase from '../IChannelsDatabase'
import { EngineNedb } from './EngineNedb'
import { PaymentChannel, PaymentChannelJSON } from '../../PaymentChannel'

/**
 * Database layer for {PaymentChannel}
 */
export class NedbChannelsDatabase
  extends AbstractChannelsDatabase<EngineNedb>
  implements IChannelsDatabase
{
  async save(paymentChannel: PaymentChannel): Promise<void> {
    const document = {
      kind: this.kind,
      sender: paymentChannel.sender,
      receiver: paymentChannel.receiver,
      value: paymentChannel.value.toString(),
      spent: paymentChannel.spent.toString(),
      channelId: paymentChannel.channelId,
      state: paymentChannel.state,
      tokenContract: paymentChannel.tokenContract,
      settlementPeriod: paymentChannel.settlementPeriod,
      settlingUntil: paymentChannel.settlingUntil.toString(),
    }

    await this.engine.exec((client) => {
      return client.insert(document)
    })
  }

  async firstById(
    channelId: `0x${string}`,
  ): Promise<PaymentChannel | null> {
    const query = {
      kind: this.kind,
      channelId: channelId,
    }

    return this.engine.exec(async (client) => {
      let doc = await client.find<PaymentChannelJSON>(query)
      return this.inflatePaymentChannel(doc[0])
    })
  }

  /**
   * Set amount of money spent on the channel.
   */
  async spend(channelId: `0x${string}`, spent: bigint): Promise<void> {
    const query = {
      kind: this.kind,
      channelId: channelId,
    }
    const update = {
      $set: {
        spent: spent.toString(),
      },
    }

    await this.engine.exec((client) => {
      return client.update(query, update, {})
    })
  }

  async deposit(
    channelId: `0x${string}`,
    value: bigint,
  ): Promise<void> {
    const channel = await this.firstById(channelId)
    if (!channel) {
      throw new Error('Channel not found.')
    }
    const query = { kind: this.kind, channelId: channelId }
    const newValue = channel.value + value
    const update = {
      $set: {
        value: newValue.toString(),
      },
    }
    await this.engine.exec((client) => {
      return client.update(query, update, {})
    })
  }

  /**
   * Retrieve all the payment channels stored.
   *
   * @return {Promise<PaymentChannel>}
   */
  async all(): Promise<Array<PaymentChannel>> {
    let raw = await this.engine.exec((client) => {
      return client.find<PaymentChannelJSON>({ kind: this.kind })
    })
    return this.inflatePaymentChannels(raw)
  }

  async allOpen(): Promise<PaymentChannel[]> {
    let raw = await this.engine.exec((client) => {
      return client.find<PaymentChannelJSON>({ kind: this.kind, state: 0 })
    })
    let channels = await this.inflatePaymentChannels(raw)
    return this.filterByState(0, channels)
  }

  async findUsable(
    sender: `0x${string}`,
    receiver: `0x${string}`,
    amount: bigint,
  ): Promise<PaymentChannel | null> {
    const query = {
      kind: this.kind,
      state: 0,
      sender,
      receiver,
    }
    let raw = await this.engine.exec((client) => {
      return client.find<PaymentChannelJSON>(query)
    })
    let channels = await this.inflatePaymentChannels(raw)
    let filtered = this.filterByState(0, channels)
    return (
      filtered.find((chan: PaymentChannel) =>
        chan.value >= (chan.spent + amount)
      ) || null
    )
  }

  async findBySenderReceiver(
    sender: `0x${string}`,
    receiver: `0x${string}`,
  ): Promise<Array<PaymentChannel>> {
    let raw = await this.engine.exec((client) => {
      return client.find<PaymentChannelJSON>({
        sender,
        receiver,
        kind: this.kind,
      })
    })
    return this.inflatePaymentChannels(raw)
  }

  async findBySenderReceiverChannelId(
    sender: `0x${string}`,
    receiver: `0x${string}`,
    channelId: `0x${string}`,
  ): Promise<PaymentChannel | null> {
    let query = {
      sender,
      receiver,
      channelId: channelId,
      kind: this.kind,
    }
    let res = await this.engine.exec((client) => {
      return client.find<PaymentChannelJSON>(query)
    })
    return this.inflatePaymentChannel(res[0])
  }

  async updateState(
    channelId: `0x${string}`,
    state: number,
  ): Promise<void> {
    const query = {
      kind: this.kind,
      channelId: channelId,
    }
    const update = {
      $set: {
        state,
      },
    }
    await this.engine.exec((client) => {
      return client.update(query, update, {})
    })
  }

  async updateSettlingUntil(
    channelId: `0x${string}`,
    settlingUntil: bigint,
  ): Promise<void> {
    const query = {
      kind: this.kind,
      channelId: channelId,
    }
    const update = {
      $set: {
        settlingUntil: settlingUntil.toString(),
      },
    }
    await this.engine.exec((client) => {
      return client.update(query, update, {})
    })
  }
}
