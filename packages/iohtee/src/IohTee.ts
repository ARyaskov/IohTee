import { MigrateOption } from './MigrateOption'
import { PaymentChannel } from './PaymentChannel'
import Payment, { PaymentSerde } from './payment'
import { AcceptPaymentRequestSerde } from './accept_payment_request'
import { AcceptPaymentResponse } from './accept_payment_response'
import { AcceptTokenRequest } from './accept_token_request'
import { AcceptTokenResponse } from './accept_token_response'
import Registry from './Registry'
import IohTeeOptions from './IohTeeOptions'
import BuyOptions from './BuyOptions'
import NextPaymentResult from './NextPaymentResult'
import BuyResult from './BuyResult'
import { PaymentRequiredResponse } from './PaymentRequiredResponse'
import {
  createPublicClient,
  createWalletClient,
  http,
  type TransactionReceipt,
} from 'viem'
import * as chains from 'viem/chains'
import { mnemonicToAccount } from 'viem/accounts'

export interface MachinomyCtorParams {
  networkId: number
  httpRpcUrl: string
  mnemonic: string
  hdPath: `m/44'/60'/${string}`
  options?: IohTeeOptions
}

function assertCtorParams(
  input: unknown,
): asserts input is MachinomyCtorParams {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error(
      'IohTee constructor expects a single object argument: { networkId, httpRpcUrl, mnemonic, hdPath, options? }.',
    )
  }

  const params = input as Partial<MachinomyCtorParams> & Record<string, unknown>

  if (
    'currentProvider' in params ||
    'eth' in params ||
    'web3' in params ||
    'provider' in params
  ) {
    throw new Error(
      'Legacy Web3-style constructor is not supported. Use new IohTee({ networkId, httpRpcUrl, mnemonic, hdPath, options? }).',
    )
  }

  if (!Number.isInteger(params.networkId) || Number(params.networkId) <= 0) {
    throw new Error('Invalid IohTee constructor param "networkId".')
  }

  if (
    typeof params.httpRpcUrl !== 'string' ||
    params.httpRpcUrl.trim() === ''
  ) {
    throw new Error('Invalid IohTee constructor param "httpRpcUrl".')
  }

  if (typeof params.mnemonic !== 'string' || params.mnemonic.trim() === '') {
    throw new Error('Invalid IohTee constructor param "mnemonic".')
  }

  if (
    typeof params.hdPath !== 'string' ||
    !params.hdPath.startsWith("m/44'/60'/")
  ) {
    throw new Error(
      `Invalid IohTee constructor param "hdPath". Expected m/44'/60'/... path.`,
    )
  }
}

/**
 * Micropayments client for Ether/ERC20 channels over HTTP.
 * Handles channel lifecycle, payment creation and paywall interactions.
 */
export default class IohTee {
  readonly registry: Registry
  private readonly account: `0x${string}`
  private migrated = false
  private readonly _publicClient
  private readonly _walletClient

  /**
   * Creates a new IohTee instance bound to one signer account (derived from mnemonic + hdPath).
   * Also initializes internal viem public/wallet clients and lazy service registry.
   *
   * @param params Runtime configuration for chain connectivity, signer derivation and storage options.
   */
  constructor(params: MachinomyCtorParams) {
    assertCtorParams(params)

    const options = IohTeeOptions.defaults(params.options)
    const account = mnemonicToAccount(params.mnemonic, { path: params.hdPath })
    const chain = Object.values(chains).find(
      (value) =>
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        (value as { id?: number }).id === params.networkId,
    ) as any

    this._publicClient = createPublicClient({
      batch: { multicall: true },
      chain,
      transport: http(params.httpRpcUrl, { batch: true }),
    })

    this._walletClient = createWalletClient({
      account,
      chain,
      transport: http(params.httpRpcUrl, { batch: true }),
    })

    this.account = account.address

    this.registry = new Registry(
      this.account,
      this._publicClient as never,
      this._walletClient as never,
      params.mnemonic,
      params.hdPath,
      account,
      options,
    )
  }

  /**
   * Returns internal viem Public Client used for read operations.
   *
   * @returns Initialized viem public client.
   */
  publicClient() {
    return this._publicClient
  }

  /**
   * Returns internal viem Wallet Client used for signing/sending transactions.
   *
   * @returns Initialized viem wallet client.
   */
  walletClient() {
    return this._walletClient
  }

  /**
   * Performs full purchase flow against gateway.
   * Creates/signs next payment, sends it to gateway and stores resulting token locally.
   *
   * @param options Buy options including receiver, price, gateway and optional metadata.
   * @returns Gateway token and channel id used for this purchase.
   * @throws If gateway is missing or if channel/payment/gateway flow fails.
   */
  async buy(options: BuyOptions): Promise<BuyResult> {
    await this.checkMigrationsState()

    if (!options.gateway) {
      throw new Error('gateway must be specified.')
    }

    const client = await this.registry.client()
    const channelManager = await this.registry.channelManager()

    const payment = await this.nextPayment(options)
    const res = await client.doPayment(
      payment,
      options.gateway,
      options.purchaseMeta,
    )
    await channelManager.spendChannel(payment, res.token)
    return { token: res.token, channelId: payment.channelId }
  }

  /**
   * Creates next signed payment without sending it to gateway.
   * Persisted payment can be used later for manual transport flows.
   *
   * @param options Buy options used to resolve/open channel and build next payment state.
   * @returns Serialized payment payload ready to be sent to gateway.
   */
  async payment(options: BuyOptions): Promise<NextPaymentResult> {
    await this.checkMigrationsState()
    const channelManager = await this.registry.channelManager()
    const payment = await this.nextPayment(options)
    await channelManager.spendChannel(payment)
    return { payment: PaymentSerde.instance.serialize(payment) }
  }

  /**
   * Executes paywall preflight request (`402`/`200`) and parses paywall headers.
   *
   * @param uri Protected resource URL.
   * @param datetime Optional unix timestamp used for deterministic preflight checks.
   * @returns Parsed paywall requirements (price, receiver, gateway, etc).
   */
  async pry(uri: string, datetime?: number): Promise<PaymentRequiredResponse> {
    await this.checkMigrationsState()
    const client = await this.registry.client()
    return client.doPreflight(this.account, uri, datetime)
  }

  /**
   * High-level helper for URL purchase.
   * Runs preflight on target URL and then delegates to {@link buy}.
   *
   * @param uri Protected resource URL.
   * @returns Gateway token and channel id used for this purchase.
   */
  async buyUrl(uri: string): Promise<BuyResult> {
    await this.checkMigrationsState()
    const client = await this.registry.client()
    const req = await client.doPreflight(this.account, uri)
    return this.buy({
      receiver: req.receiver,
      price: req.price,
      gateway: req.gateway,
      meta: req.meta,
      tokenContract: req.tokenContract,
    })
  }

  /**
   * Adds value to an existing channel on-chain.
   *
   * @param channelId Existing channel id.
   * @param value Amount to deposit.
   * @returns Transaction receipt of deposit transaction.
   */
  async deposit(
    channelId: `0x${string}`,
    value: bigint,
  ): Promise<TransactionReceipt> {
    await this.checkMigrationsState()
    const channelManager = await this.registry.channelManager()
    return channelManager.deposit(channelId, value)
  }

  /**
   * Opens a new channel for the current sender account.
   *
   * @param receiver Receiver address.
   * @param value Initial channel value.
   * @param channelId Optional explicit channel id.
   * @param tokenContract Optional token contract address for token channels.
   * @returns Opened channel object.
   */
  async open(
    receiver: `0x${string}`,
    value: bigint,
    channelId?: `0x${string}`,
    tokenContract?: `0x${string}`,
  ): Promise<PaymentChannel> {
    await this.checkMigrationsState()
    const channelManager = await this.registry.channelManager()
    return channelManager.openChannel(
      this.account,
      receiver,
      value,
      BigInt(0),
      channelId,
      tokenContract,
    )
  }

  /**
   * Returns all channels known in local storage/sync context.
   *
   * @returns List of channels.
   */
  async channels(): Promise<PaymentChannel[]> {
    await this.checkMigrationsState()
    const channelManager = await this.registry.channelManager()
    return channelManager.channels()
  }

  /**
   * Returns channels currently in `Open` state.
   *
   * @returns List of open channels.
   */
  async openChannels(): Promise<PaymentChannel[]> {
    await this.checkMigrationsState()
    const channelManager = await this.registry.channelManager()
    return channelManager.openChannels()
  }

  /**
   * Returns channels currently in `Settling` state.
   *
   * @returns List of settling channels.
   */
  async settlingChannels(): Promise<PaymentChannel[]> {
    await this.checkMigrationsState()
    const channelManager = await this.registry.channelManager()
    return channelManager.settlingChannels()
  }

  /**
   * Loads channel by id from storage (with sync-aware manager logic).
   *
   * @param channelId Channel identifier.
   * @returns Channel when found, otherwise `null`.
   */
  async channelById(channelId: `0x${string}`): Promise<PaymentChannel | null> {
    await this.checkMigrationsState()
    const channelManager = await this.registry.channelManager()
    return channelManager.channelById(channelId)
  }

  /**
   * Closes/settles channel according to current role and on-chain status.
   *
   * @param channelId Channel identifier.
   * @returns Transaction receipt of executed close/settle action.
   */
  async close(channelId: `0x${string}`): Promise<TransactionReceipt> {
    await this.checkMigrationsState()
    const channelManager = await this.registry.channelManager()
    return channelManager.closeChannel(channelId)
  }

  /**
   * Accepts incoming payment payload produced by another IohTee client.
   *
   * @param req Raw request payload (deserialized/validated internally).
   * @returns Accepted token response containing generated paywall token.
   */
  async acceptPayment(req: unknown): Promise<AcceptPaymentResponse> {
    await this.checkMigrationsState()
    const client = await this.registry.client()
    return client.acceptPayment(
      AcceptPaymentRequestSerde.instance.deserialize(req),
    )
  }

  /**
   * Returns previously stored payment by token id.
   *
   * @param id Paywall token id.
   * @returns Stored payment or `null` when not found.
   */
  async paymentById(id: string): Promise<Payment | null> {
    await this.checkMigrationsState()
    const storage = await this.registry.storage()
    return storage.paymentsDatabase.findByToken(id)
  }

  /**
   * Verifies previously issued paywall token.
   *
   * @param req Token verification request.
   * @returns Verification result.
   */
  async acceptToken(req: AcceptTokenRequest): Promise<AcceptTokenResponse> {
    await this.checkMigrationsState()
    const client = await this.registry.client()
    return client.acceptVerify(req)
  }

  /**
   * Gracefully closes underlying storage engine resources.
   *
   * @returns Promise resolved when storage connections are closed.
   */
  async shutdown(): Promise<void> {
    await this.checkMigrationsState()
    const storage = await this.registry.storage()
    return storage.engine.close()
  }

  /**
   * Resolves channel and computes next signed payment for provided buy options.
   * Creates channel if needed via channel manager policy.
   *
   * @param options Buy options used to resolve receiver, amount and token contract.
   * @returns Signed payment entity for next channel state.
   */
  private async nextPayment(options: BuyOptions): Promise<Payment> {
    await this.checkMigrationsState()
    const price = options.price

    const channelManager = await this.registry.channelManager()
    const channel = await channelManager.requireOpenChannel(
      this.account,
      options.receiver,
      price,
      undefined,
      options.tokenContract,
    )
    return channelManager.nextPayment(
      channel.channelId,
      price,
      options.meta || '',
    )
  }

  /**
   * Ensures database migrations are checked/applied exactly once per instance.
   * Behavior depends on `options.migrate` strategy.
   *
   * @throws If non-applied migrations exist and migration mode is strict/non-silent.
   */
  private async checkMigrationsState(): Promise<void> {
    if (!this.migrated) {
      const storage = await this.registry.storage()
      const isLatest = await storage.migrator.isLatest()
      const needMigration = !isLatest

      if (needMigration) {
        if (
          this.registry.options.migrate === undefined ||
          this.registry.options.migrate === MigrateOption.Silent
        ) {
          this.migrated = true
          return storage.migrator.sync()
        }
        throw new Error('There are non-applied db-migrations!')
      }

      this.migrated = true
    }
  }
}
