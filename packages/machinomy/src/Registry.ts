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
import { HDNodeWallet, Wallet } from 'ethers'
import * as path from 'node:path'

export default class Registry {
  account: `0x${string}`
  mnemonic: string
  publicClient: PublicClient
  walletClient: WalletClient
  options: MachinomyOptions
  unidirectional: Unidirectional | null = null
  channelInflator: ChannelInflator | null = null
  _channelContract: ChannelContract | null = null
  _storage: Storage | null = null
  _chainManager: ChainManager | null = null
  _paymentManager: PaymentManager | null = null
  _client: Client | null = null
  _channelManager: IChannelManager | null = null
  ethersWallet: Wallet | null = null
  hdPath: `m/44'/60'/${string}`

  constructor(
    account: `0x${string}`,
    publicClient: PublicClient,
    walletClient: WalletClient,
    mnemonic: string,
    hdPath: `m/44'/60'/${string}`,
    ethersWallet: Wallet,
    options: MachinomyOptions,
  ) {
    this.account = account
    this.publicClient = publicClient
    this.walletClient = walletClient
    this.options = options
    this.mnemonic = mnemonic
    this.hdPath = hdPath
    this.ethersWallet = ethersWallet
  }

  async inflator(): Promise<ChannelInflator> {
    if (!this.channelInflator) {
      const channelEthContract = await this.channelEthContract()
      // const channelTokenContract = await this.channelTokenContract()
      this.channelInflator = new ChannelInflator(channelEthContract)
    }
    return this.channelInflator
  }

  async channelEthContract(): Promise<Unidirectional> {
    if (!this.unidirectional) {
      this.unidirectional = new Unidirectional({
        publicClient: this.publicClient as any,
        walletClient: this.walletClient as any,
        cachePeriod: this.options.chainCachePeriod || 0,
        network: this.publicClient.chain as any,
        mnemonic: this.mnemonic,
        hdPath: this.hdPath,
      })
    }
    return this.unidirectional
  }

  // @memoize
  // async channelTokenContract (): Promise<ChannelTokenContract> {
  //   return new ChannelTokenContract(this.web3, this.options.chainCachePeriod || 0)
  // }

  async channelContract(): Promise<ChannelContract> {
    if (!this._channelContract) {
      const channelEthContract = await this.channelEthContract()
      // const channelTokenContract = await this.channelTokenContract()
      const storage = await this.storage()
      const channelsDatabase = storage.channelsDatabase
      this._channelContract = new ChannelContract(
        this.publicClient,
        this.walletClient,
        channelsDatabase,
        channelEthContract,
        // channelTokenContract,
      )
    }

    return this._channelContract
  }

  async storage(): Promise<Storage> {
    if (!this._storage) {
      const inflator = await this.inflator()
      this._storage = await Storage.build(this.options.databaseUrl, inflator)
    }
    return this._storage
  }

  async chainManager(): Promise<ChainManager> {
    if (!this._chainManager) {
      this._chainManager = new ChainManager(this.ethersWallet!)
    }
    return this._chainManager
  }

  async paymentManager(): Promise<PaymentManager> {
    if (!this._paymentManager) {
      let chainManager = await this.chainManager()
      let channelContract = await this.channelContract()
      this._paymentManager = new PaymentManager(
        chainManager,
        channelContract,
        this.options,
      )
    }
    return this._paymentManager
  }

  async client(): Promise<Client> {
    if (!this._client) {
      let transport = this.options.transport
        ? this.options.transport
        : new Transport()
      let channelManager = await this.channelManager()
      this._client = new ClientImpl(transport, channelManager)
    }
    return this._client
  }

  async channelManager(): Promise<IChannelManager> {
    if (!this._channelManager) {
      let storage = await this.storage()
      let payments = storage.paymentsDatabase
      let channels = storage.channelsDatabase
      let tokens = storage.tokensDatabase
      let channelContract = await this.channelContract()
      let paymentManager = await this.paymentManager()
      this._channelManager = new ChannelManager(
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
    return this._channelManager
  }
}
