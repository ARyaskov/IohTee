import IChannelsDatabase from './storage/IChannelsDatabase'
import PaymentManager from './PaymentManager'
import ChannelContract from './ChannelContract'
import Mutex from './Mutex'
import Payment from './payment'
import IohTeeOptions from './IohTeeOptions'
import IChannelManager from './IChannelManager'
import ChannelId from './ChannelId'
import { EventEmitter } from 'events'
import IPaymentsDatabase from './storage/IPaymentsDatabase'
import ITokensDatabase from './storage/ITokensDatabase'
import Logger from '@machinomy/logger'
import { PaymentChannel } from './PaymentChannel'
import ChannelInflator from './ChannelInflator'
import * as uuid from 'uuid'
import {
  keccak256,
  stringToHex,
  toHex,
  WriteContractReturnType,
  PublicClient,
  WalletClient,
  GetBlockNumberReturnType,
  TransactionReceipt,
} from 'viem'
import { PaymentNotValidError, InvalidChannelError } from './Exceptions'
import { RemoteChannelInfo } from './RemoteChannelInfo'
import { recoverPersonalSignature } from '@metamask/eth-sig-util'
import { ChannelState } from '@riaskov/iohtee-contracts'

const LOG = new Logger('channel-manager')

const DAY_IN_SECONDS = 86400
const NEW_BLOCK_TIME_IN_SECONDS = 15

function generateToken(payment: any): string {
  const dataString =
    JSON.stringify({
      ...payment,
      price: payment.price.toString(),
      value: payment.value.toString(),
      channelValue: payment.channelValue.toString(),
    }) + new Date().toISOString()
  const hash = keccak256(stringToHex(dataString))
  return toHex(hash)
}

export default class ChannelManager
  extends EventEmitter
  implements IChannelManager
{
  /** Default settlement period for a payment channel */
  static DEFAULT_SETTLEMENT_PERIOD: bigint = BigInt(
    (2 * DAY_IN_SECONDS) / NEW_BLOCK_TIME_IN_SECONDS,
  )

  private account: `0x${string}`
  private publicClient: PublicClient
  private walletClient: WalletClient
  private channelsDao: IChannelsDatabase
  private paymentsDao: IPaymentsDatabase
  private tokensDao: ITokensDatabase
  private channelContract: ChannelContract
  private paymentManager: PaymentManager
  private mutex: Mutex = new Mutex()
  private iohteeOptions: IohTeeOptions

  constructor(
    account: `0x${string}`,
    publicClient: PublicClient,
    walletClient: WalletClient,
    channelsDao: IChannelsDatabase,
    paymentsDao: IPaymentsDatabase,
    tokensDao: ITokensDatabase,
    channelContract: ChannelContract,
    paymentManager: PaymentManager,
    iohteeOptions: IohTeeOptions,
  ) {
    super()
    this.account = account
    this.publicClient = publicClient
    this.walletClient = walletClient
    this.channelsDao = channelsDao
    this.paymentsDao = paymentsDao
    this.tokensDao = tokensDao
    this.channelContract = channelContract
    this.paymentManager = paymentManager
    this.iohteeOptions = iohteeOptions
  }

  openChannel(
    sender: `0x${string}`,
    receiver: `0x${string}`,
    amount: bigint,
    minDepositAmount?: bigint,
    channelId?: `0x${string}`,
    tokenContract?: `0x${string}`,
  ): Promise<PaymentChannel> {
    return this.mutex.synchronize(async () => {
      return this.internalOpenChannel(
        sender,
        receiver,
        amount,
        minDepositAmount,
        channelId,
        tokenContract,
      )
    })
  }

  closeChannel(channelId: `0x${string}`): Promise<TransactionReceipt> {
    return this.mutex.synchronizeOn(channelId, () =>
      this.internalCloseChannel(channelId),
    )
  }

  deposit(
    channelId: `0x${string}`,
    value: bigint,
  ): Promise<TransactionReceipt> {
    return this.mutex.synchronizeOn(channelId, async () => {
      const channel = await this.channelById(channelId)

      if (!channel) {
        throw new Error('No payment channel found.')
      }

      const res = await this.channelContract.deposit(
        channelId,
        value,
        channel.tokenContract,
      )
      await this.channelsDao.deposit(channelId, value)
      return res
    })
  }

  nextPayment(
    channelId: `0x${string}`,
    amount: bigint,
    meta: string,
  ): Promise<Payment> {
    return this.mutex.synchronizeOn(channelId.toString(), async () => {
      const channel = await this.channelById(channelId)

      if (!channel) {
        throw new Error(`Channel with id ${channelId.toString()} not found.`)
      }

      const toSpend = channel.spent + amount

      if (toSpend > channel.value) {
        throw new Error(
          `Total spend ${toSpend} is larger than channel value ${channel.value}`,
        )
      }

      return this.paymentManager.buildPaymentForChannel(
        channel,
        amount,
        toSpend,
        meta,
      )
    })
  }

  async spendChannel(payment: Payment, token?: string): Promise<Payment> {
    const chan = PaymentChannel.fromPayment(payment)
    await this.channelsDao.saveOrUpdate(chan)
    let _token = token || payment.token || uuid.v4().replace(/-/g, '')
    await this.paymentsDao.save(_token, payment)
    return payment
  }

  async acceptPayment(payment: Payment): Promise<string> {
    const isPaymentInTokens = ChannelInflator.isTokenContractDefined(
      payment.tokenContract,
    )
    if (isPaymentInTokens) {
      LOG.info(
        `Queueing payment of ${payment.price.toString()} token(s) to channel with ID ${
          payment.channelId
        }.`,
      )
    } else {
      LOG.info(
        `Queueing payment of ${payment.price.toString()} Wei to channel with ID ${
          payment.channelId
        }.`,
      )
    }

    return this.mutex.synchronizeOn(payment.channelId, async () => {
      const channel = await this.findChannel(payment)

      if (isPaymentInTokens) {
        LOG.info(
          `Adding ${payment.price.toString()} token(s) to channel with ID ${channel.channelId.toString()}.`,
        )
      } else {
        LOG.info(
          `Adding ${payment.price.toString()} Wei to channel with ID ${channel.channelId.toString()}.`,
        )
      }
      const valid = await this.paymentManager.isValid(payment, channel)

      if (valid) {
        channel.spent = payment.value
        const token = generateToken(payment)

        await Promise.all([
          this.channelsDao.saveOrUpdate(channel),
          this.tokensDao.save(token, payment.channelId),
          this.paymentsDao.save(token, payment),
        ])
        return token
      }

      if (this.machinomyOptions.closeOnInvalidPayment) {
        LOG.info(`Received invalid payment from ${payment.sender}!`)
        const existingChannel =
          await this.channelsDao.findBySenderReceiverChannelId(
            payment.sender,
            payment.receiver,
            payment.channelId,
          )

        if (existingChannel) {
          LOG.info(
            `Found existing channel with id ${payment.channelId} between ${payment.sender} and ${payment.receiver}.`,
          )
          LOG.info('Closing channel due to malfeasance.')
          await this.internalCloseChannel(channel.channelId)
        }
      }

      throw new PaymentNotValidError()
    })
  }

  requireOpenChannel(
    sender: `0x${string}`,
    receiver: `0x${string}`,
    amount: bigint,
    minDepositAmount?: bigint,
    tokenContract?: `0x${string}`,
  ): Promise<PaymentChannel> {
    return this.mutex.synchronize(async () => {
      if (
        !minDepositAmount &&
        this.machinomyOptions &&
        this.machinomyOptions.minimumChannelAmount
      ) {
        minDepositAmount = this.machinomyOptions.minimumChannelAmount
      }
      let channel = await this.channelsDao.findUsable(sender, receiver, amount)
      return (
        channel ||
        this.internalOpenChannel(
          sender,
          receiver,
          amount,
          minDepositAmount,
          undefined,
          tokenContract,
        )
      )
    })
  }

  channels(): Promise<PaymentChannel[]> {
    return this.channelsDao.all()
  }

  openChannels(): Promise<PaymentChannel[]> {
    return this.channelsDao.allOpen()
  }

  settlingChannels(): Promise<PaymentChannel[]> {
    return this.channelsDao.allSettling()
  }

  async channelById(channelId: `0x${string}`): Promise<PaymentChannel | null> {
    let channel = await this.channelsDao.firstById(channelId)
    let channelC = await this.channelContract.channel(channelId)
    if (channel && channelC) {
      channel.value = channelC.value
      return channel
    } else {
      return this.handleUnknownChannel(channelId)
    }
  }

  verifyToken(token: string): Promise<boolean> {
    return this.tokensDao.isPresent(token)
  }

  async lastPayment(channelId: string | ChannelId): Promise<Payment | null> {
    channelId = channelId.toString()
    return this.paymentsDao.firstMaximum(channelId)
  }

  private async internalOpenChannel(
    sender: `0x${string}`,
    receiver: `0x${string}`,
    amount: bigint,
    minDepositAmount: bigint = BigInt(0),
    channelId?: `0x${string}`,
    tokenContract?: `0x${string}`,
  ): Promise<PaymentChannel> {
    let depositAmount = amount * BigInt(10)

    if (minDepositAmount > 0 && minDepositAmount > depositAmount) {
      depositAmount = minDepositAmount
    }

    this.emit('willOpenChannel', sender, receiver, depositAmount)
    let settlementPeriod = BigInt(
      this.machinomyOptions.settlementPeriod ||
        ChannelManager.DEFAULT_SETTLEMENT_PERIOD,
    )
    let paymentChannel = await this.buildChannel(
      sender,
      receiver,
      depositAmount,
      settlementPeriod,
      undefined,
      channelId,
      tokenContract,
    )
    await this.channelsDao.save(paymentChannel)
    this.emit('didOpenChannel', paymentChannel)
    return paymentChannel
  }

  private async internalCloseChannel(channelId: `0x${string}`) {
    let channel =
      (await this.channelById(channelId)) ||
      (await this.handleUnknownChannel(channelId))

    if (!channel) {
      throw new Error(`Channel ${channelId} not found.`)
    }

    this.emit('willCloseChannel', channel)

    let res: Promise<TransactionReceipt>

    if (channel.sender === this.account) {
      res = this.settle(channel)
    } else {
      res = this.claim(channel)
    }

    const txn = await res
    this.emit('didCloseChannel', channel)
    return txn
  }

  private settle(channel: PaymentChannel): Promise<TransactionReceipt> {
    return this.channelContract
      .channelState(channel.channelId)
      .then(async (state: number) => {
        if (state === ChannelState.Settled) {
          throw new Error(`Channel ${channel.channelId} is already settled.`)
        }

        switch (state) {
          case ChannelState.Open: {
            const block: GetBlockNumberReturnType =
              await this.publicClient.getBlockNumber()
            const settlingUntil = block + channel.settlementPeriod
            const res = await this.channelContract.startSettle(
              channel.channelId,
            )
            await this.channelsDao.updateState(
              channel.channelId,
              ChannelState.Settling,
            )
            await this.channelsDao.updateSettlingUntil(
              channel.channelId,
              settlingUntil,
            )
            return res
          }
          case ChannelState.Settling:
            return this.channelContract
              .finishSettle(channel.channelId)
              .then((res: TransactionReceipt) =>
                this.channelsDao
                  .updateState(channel.channelId, ChannelState.Settled)
                  .then(() => res),
              )
          default:
            throw new Error(`Unknown state: ${state}`)
        }
      })
  }

  private async claim(channel: PaymentChannel): Promise<TransactionReceipt> {
    let payment = await this.lastPayment(channel.channelId)
    if (payment) {
      let result = await this.channelContract.claim(
        channel.channelId,
        payment.value,
        payment.signature,
        channel.receiver,
      )
      await this.channelsDao.updateState(
        channel.channelId,
        ChannelState.Settled,
      )
      return result
    } else {
      throw new Error('Can not claim unknown channel')
    }
  }

  private async buildChannel(
    sender: `0x${string}`,
    receiver: `0x${string}`,
    price: bigint,
    settlementPeriod: bigint,
    settlingUntil: bigint | undefined,
    channelId?: `0x${string}`,
    tokenContract?: `0x${string}`,
  ): Promise<PaymentChannel> {
    const channel = await this.channelContract.open(
      receiver,
      price,
      settlementPeriod,
      channelId,
      tokenContract,
    )
    const _channelId = channel.channelId
    return new PaymentChannel(
      sender,
      receiver,
      _channelId,
      price,
      BigInt(0),
      0,
      tokenContract,
      settlementPeriod,
      settlingUntil,
    )
  }

  private async handleUnknownChannel(
    channelId: `0x${string}`,
  ): Promise<PaymentChannel | null> {
    const channel = await this.channelContract.channel(channelId)
    if (!channel) return null
    const sender = channel.sender
    const receiver = channel.receiver
    const value = channel.value
    const settlingUntil = channel.settlingUntil

    if (sender !== this.account && receiver !== this.account) {
      return null
    }

    const chan = new PaymentChannel(
      sender,
      receiver,
      channelId,
      value,
      BigInt(0),
      settlingUntil === BigInt(0) ? 0 : 1,
      '0x',
      undefined,
      settlingUntil,
    )
    await this.channelsDao.save(chan)
    return chan
  }

  private async findChannel(payment: Payment): Promise<PaymentChannel> {
    let chan = await this.channelsDao.findBySenderReceiverChannelId(
      payment.sender,
      payment.receiver,
      payment.channelId,
    )

    if (chan) {
      return chan
    }

    chan = PaymentChannel.fromPayment(payment)
    chan.spent = BigInt(0)
    return chan
  }
}
