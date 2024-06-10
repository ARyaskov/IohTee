// import { memoize } from 'decko'
import { PublicClient, WalletClient } from 'viem'
import ChannelInflator from './ChannelInflator'
import Storage from './Storage'
import MachinomyOptions from './MachinomyOptions'
import ChannelContract from './ChannelContract'
import IChannelManager from './IChannelManager'
import ChannelManager from './ChannelManager'
import PaymentManager from './PaymentManager'
import ChainManager from './ChainManager'
import Client, { ClientImpl } from './client'
import { Transport } from './transport'
import { Unidirectional } from '@riaskov/machinomy-contracts'

export default class Registry {
  account: `0x${string}`
  mnemonic: string
  publicClient: PublicClient
  walletClient: WalletClient
  options: MachinomyOptions
  unidirectional: Unidirectional | null = null

  constructor(
    account: `0x${string}`,
    publicClient: PublicClient,
    walletClient: WalletClient,
    mnemonic: string,
    options: MachinomyOptions,
  ) {
    this.account = account
    this.publicClient = publicClient
    this.walletClient = walletClient
    this.options = options
    this.mnemonic = mnemonic
  }

  // @memoize
  async inflator(): Promise<ChannelInflator> {
    const channelEthContract = await this.channelEthContract()
    // const channelTokenContract = await this.channelTokenContract()
    return new ChannelInflator(channelEthContract)
  }

  async channelEthContract(): Promise<Unidirectional> {
    if (!this.unidirectional) {
      this.unidirectional = new Unidirectional({
        publicClient: this.publicClient as any,
        walletClient: this.walletClient as any,
        cachePeriod: this.options.chainCachePeriod || 0,
        network: this.publicClient.chain as any,
        mnemonic: this.mnemonic,
      })
    }
    return this.unidirectional
  }

  // @memoize
  // async channelTokenContract (): Promise<ChannelTokenContract> {
  //   return new ChannelTokenContract(this.web3, this.options.chainCachePeriod || 0)
  // }

  // @memoize
  async channelContract(): Promise<ChannelContract> {
    const channelEthContract = await this.channelEthContract()
    // const channelTokenContract = await this.channelTokenContract()
    const storage = await this.storage()
    const channelsDatabase = storage.channelsDatabase
    return new ChannelContract(
      this.publicClient,
      this.walletClient,
      channelsDatabase,
      channelEthContract,
      // channelTokenContract,
    )
  }

  // @memoize
  async storage(): Promise<Storage> {
    const inflator = await this.inflator()
    return Storage.build(this.options.databaseUrl, inflator)
  }

  // @memoize
  async chainManager(): Promise<ChainManager> {
    return new ChainManager(this.walletClient)
  }

  // @memoize
  async paymentManager(): Promise<PaymentManager> {
    let chainManager = await this.chainManager()
    let channelContract = await this.channelContract()
    return new PaymentManager(chainManager, channelContract, this.options)
  }

  // @memoize
  async client(): Promise<Client> {
    let transport = this.options.transport
      ? this.options.transport
      : new Transport()
    let channelManager = await this.channelManager()
    return new ClientImpl(transport, channelManager)
  }

  // @memoize
  async channelManager(): Promise<IChannelManager> {
    let storage = await this.storage()
    let payments = storage.paymentsDatabase
    let channels = storage.channelsDatabase
    let tokens = storage.tokensDatabase
    let channelContract = await this.channelContract()
    let paymentManager = await this.paymentManager()
    return new ChannelManager(
      this.account,
      this.publicClient,
      this.walletClient,
      channels,
      payments,
      tokens,
      channelContract,
      paymentManager,
      this.options,
    )
  }
}
