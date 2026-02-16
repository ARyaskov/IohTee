import Logger from './log'
import ChannelInflator from './ChannelInflator'
import IChannelsDatabase from './storage/IChannelsDatabase'
import Payment from './payment'
import { PublicClient, TransactionReceipt, WalletClient } from 'viem'
import {
  Channel,
  channelId,
  ChannelState,
  Unidirectional,
} from '@riaskov/iohtee-contracts'
import ChannelTokenContract from './ChannelTokenContract'

const LOG = new Logger('channel-contract')

type ChannelContractLike = {
  claim: (
    channelId: `0x${string}`,
    value: bigint,
    signature: `0x${string}`,
  ) => Promise<TransactionReceipt>
  channelState: (channelId: `0x${string}`) => Promise<ChannelState>
  getSettlementPeriod: (channelId: `0x${string}`) => Promise<bigint>
  startSettling: (channelId: `0x${string}`) => Promise<TransactionReceipt>
  settle: (channelId: `0x${string}`) => Promise<TransactionReceipt>
  canClaim: (
    channelId: `0x${string}`,
    payment: bigint,
    receiver: `0x${string}`,
    signature: `0x${string}`,
  ) => Promise<boolean>
  channel: (channelId: `0x${string}`) => Promise<Channel>
}

export default class ChannelContract {
  publicClient: PublicClient
  walletClient: WalletClient
  channelEthContract: Unidirectional
  channelTokenContract: ChannelTokenContract | null
  channelsDao: IChannelsDatabase

  constructor(
    publicClient: PublicClient,
    walletClient: WalletClient,
    channelsDao: IChannelsDatabase,
    channelEthContract: Unidirectional,
    channelTokenContract: ChannelTokenContract | null,
  ) {
    this.publicClient = publicClient
    this.walletClient = walletClient
    this.channelEthContract = channelEthContract
    this.channelTokenContract = channelTokenContract
    this.channelsDao = channelsDao
  }

  async open(
    receiver: `0x${string}`,
    value: bigint,
    settlementPeriod: bigint,
    channelIdentifier?: `0x${string}`,
    tokenContract?: string,
  ): Promise<Channel> {
    if (!channelIdentifier) {
      channelIdentifier = channelId()
    }

    if (ChannelInflator.isTokenContractDefined(tokenContract)) {
      if (!this.channelTokenContract) {
        throw new Error(
          'TokenUnidirectional contract is not configured. Set options.tokenUnidirectionalAddress.',
        )
      }
      return this.channelTokenContract.openChannel(
        channelIdentifier,
        receiver,
        settlementPeriod,
        tokenContract as `0x${string}`,
        value,
      )
    } else {
      return this.channelEthContract.openChannel(
        channelIdentifier,
        receiver,
        settlementPeriod,
        {
          value,
        },
      )
    }
  }

  async claim(
    channelId: `0x${string}`,
    value: bigint,
    signature: `0x${string}`,
    receiver: `0x${string}`,
  ): Promise<TransactionReceipt> {
    const contract = await this.getContractByChannelId(channelId)
    return contract.claim(channelId, value, signature)
  }

  async deposit(
    channelId: `0x${string}`,
    value: bigint,
    tokenContract?: `0x${string}`,
  ): Promise<TransactionReceipt> {
    if (ChannelInflator.isTokenContractDefined(tokenContract)) {
      if (!this.channelTokenContract) {
        throw new Error(
          'TokenUnidirectional contract is not configured. Set options.tokenUnidirectionalAddress.',
        )
      }
      return this.channelTokenContract.deposit(
        channelId,
        value,
        tokenContract as `0x${string}`,
      )
    } else {
      return this.channelEthContract.deposit(channelId, {
        value,
      })
    }
  }

  async channelState(channelId: `0x${string}`): Promise<ChannelState> {
    const contract = await this.getContractByChannelId(channelId)
    return contract.channelState(channelId)
  }

  async getSettlementPeriod(channelId: `0x${string}`): Promise<bigint> {
    const contract = await this.getContractByChannelId(channelId)
    return contract.getSettlementPeriod(channelId)
  }

  async startSettle(channelId: `0x${string}`): Promise<TransactionReceipt> {
    const contract = await this.getContractByChannelId(channelId)
    return contract.startSettling(channelId)
  }

  async finishSettle(channelId: `0x${string}`): Promise<TransactionReceipt> {
    const contract = await this.getContractByChannelId(channelId)
    return contract.settle(channelId)
  }

  async paymentDigest(
    channelId: `0x${string}`,
    value: bigint,
  ): Promise<`0x${string}`> {
    const channel = await this.channelsDao.firstById(channelId)
    if (channel) {
      const tokenContract = channel.tokenContract
      if (ChannelInflator.isTokenContractDefined(tokenContract)) {
        if (!this.channelTokenContract) {
          throw new Error(
            'TokenUnidirectional contract is not configured. Set options.tokenUnidirectionalAddress.',
          )
        }
        return this.channelTokenContract.paymentDigest(
          channelId,
          value,
          tokenContract as `0x${string}`,
        )
      } else {
        return this.channelEthContract.paymentDigest(channelId, value)
      }
    } else {
      throw new Error(`Channel ${channelId} is not found`)
    }
  }

  async canClaim(payment: Payment): Promise<boolean> {
    const channelId: `0x${string}` = payment.channelId
    const value: bigint = payment.value
    const receiver: `0x${string}` = payment.receiver
    const signature: `0x${string}` = payment.signature
    if (ChannelInflator.isTokenContractDefined(payment.tokenContract)) {
      if (!this.channelTokenContract) {
        throw new Error(
          'TokenUnidirectional contract is not configured. Set options.tokenUnidirectionalAddress.',
        )
      }
      return this.channelTokenContract.canClaim(
        channelId,
        value,
        receiver,
        signature,
      )
    } else {
      return this.channelEthContract.canClaim(
        channelId,
        value,
        receiver,
        signature,
      )
    }
  }

  async channel(channelId: `0x${string}`): Promise<Channel> {
    const contract = await this.getContractByChannelId(channelId)
    return contract.channel(channelId)
  }

  async getContractByChannelId(
    channelId: `0x${string}`,
  ): Promise<ChannelContractLike> {
    const channel = await this.channelsDao.firstById(channelId)
    if (channel) {
      const tokenContract = channel.tokenContract
      if (ChannelInflator.isTokenContractDefined(tokenContract)) {
        if (!this.channelTokenContract) {
          throw new Error(
            'TokenUnidirectional contract is not configured. Set options.tokenUnidirectionalAddress.',
          )
        }
        return this.channelTokenContract
      }
      return this.channelEthContract
    } else {
      LOG.info(`getContractByChannelId(): Channel ${channelId} is undefined`)
      return this.channelEthContract
    }
  }
}
