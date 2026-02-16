import { PublicClient, WalletClient } from 'viem'
import ChannelInflator from './ChannelInflator'
import Storage from './Storage'
import IohTeeOptions from './IohTeeOptions'
import ChannelContract from './ChannelContract'
import IChannelManager from './IChannelManager'
import ChannelManager from './ChannelManager'
import PaymentManager from './PaymentManager'
import ChainManager from './ChainManager'
import Client, { ClientImpl } from './client'
import { Transport } from './transport'
import { Unidirectional } from '@riaskov/iohtee-contracts'
import { type LocalAccount } from 'viem/accounts'
import ChannelTokenContract from './ChannelTokenContract'

export default class Registry {
  readonly account: `0x${string}`
  readonly mnemonic: string
  readonly publicClient: PublicClient
  readonly walletClient: WalletClient
  readonly options: IohTeeOptions
  readonly signerAccount: LocalAccount
  readonly hdPath: `m/44'/60'/${string}`

  unidirectional: Unidirectional | null = null
  tokenUnidirectional: ChannelTokenContract | null = null
  channelInflator: ChannelInflator | null = null
  _channelContract: ChannelContract | null = null
  _storage: Storage | null = null
  _chainManager: ChainManager | null = null
  _paymentManager: PaymentManager | null = null
  _client: Client | null = null
  _channelManager: IChannelManager | null = null

  constructor(
    account: `0x${string}`,
    publicClient: PublicClient,
    walletClient: WalletClient,
    mnemonic: string,
    hdPath: `m/44'/60'/${string}`,
    signerAccount: LocalAccount,
    options: IohTeeOptions,
  ) {
    this.account = account
    this.publicClient = publicClient
    this.walletClient = walletClient
    this.options = options
    this.mnemonic = mnemonic
    this.hdPath = hdPath
    this.signerAccount = signerAccount
  }

  async inflator(): Promise<ChannelInflator> {
    if (!this.channelInflator) {
      const channelEthContract = await this.channelEthContract()
      const tokenContract = this.channelTokenContractOrNull()
      this.channelInflator = new ChannelInflator(
        channelEthContract,
        tokenContract,
      )
    }
    return this.channelInflator
  }

  async channelEthContract(): Promise<Unidirectional> {
    if (!this.unidirectional) {
      this.unidirectional = new Unidirectional(null, {
        publicClientViem: this.publicClient as never,
        walletClientViem: this.walletClient as never,
      })
    }
    return this.unidirectional
  }

  async channelContract(): Promise<ChannelContract> {
    if (!this._channelContract) {
      const channelEthContract = await this.channelEthContract()
      const channelTokenContract = this.channelTokenContractOrNull()
      const storage = await this.storage()
      const channelsDatabase = storage.channelsDatabase
      this._channelContract = new ChannelContract(
        this.publicClient,
        this.walletClient,
        channelsDatabase,
        channelEthContract,
        channelTokenContract,
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
      this._chainManager = new ChainManager(this.signerAccount)
    }
    return this._chainManager
  }

  async paymentManager(): Promise<PaymentManager> {
    if (!this._paymentManager) {
      const chainManager = await this.chainManager()
      const channelContract = await this.channelContract()
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
      const transport = this.options.transport ?? new Transport()
      const channelManager = await this.channelManager()
      this._client = new ClientImpl(transport, channelManager)
    }
    return this._client
  }

  async channelManager(): Promise<IChannelManager> {
    if (!this._channelManager) {
      const storage = await this.storage()
      const payments = storage.paymentsDatabase
      const channels = storage.channelsDatabase
      const tokens = storage.tokensDatabase
      const channelContract = await this.channelContract()
      const paymentManager = await this.paymentManager()
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

  private channelTokenContractOrNull(): ChannelTokenContract | null {
    if (this.tokenUnidirectional) {
      return this.tokenUnidirectional
    }

    const configuredAddress =
      this.options.tokenUnidirectionalAddress ??
      this.readTokenUnidirectionalAddressFromEnv()

    if (!configuredAddress || configuredAddress === '0x') {
      return null
    }

    this.tokenUnidirectional = new ChannelTokenContract(
      this.publicClient,
      this.walletClient,
      configuredAddress,
    )
    return this.tokenUnidirectional
  }

  private readTokenUnidirectionalAddressFromEnv(): `0x${string}` | undefined {
    if (
      typeof process === 'undefined' ||
      !process.env ||
      typeof process.env.TOKEN_UNIDIRECTIONAL_ADDRESS !== 'string'
    ) {
      return undefined
    }

    return process.env.TOKEN_UNIDIRECTIONAL_ADDRESS as `0x${string}`
  }
}
