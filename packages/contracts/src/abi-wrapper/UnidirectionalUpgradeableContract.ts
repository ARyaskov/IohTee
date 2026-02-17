/* eslint-disable */
/* tslint:disable */
import {
  TransactionReceipt,
  parseEventLogs,
  ParseEventLogsReturnType,
} from 'viem'
import {
  BaseContractViem,
  TxOptions,
  CtorParamsViem as CtorParams,
  isCtorAccountParamPure,
} from '@riaskov/iohtee-abi-wrapper'
export { isCtorAccountParamPure, CtorParams, TxOptions }

export interface UnidirectionalUpgradeableEvent {
  eventName: string
  args: unknown
  address: `0x${string}`
  blockHash: `0x${string}`
  blockNumber: bigint
  data: `0x${string}`
  logIndex: number
  removed: boolean
  topics: [] | [`0x${string}`, ...`0x${string}`[]]
  transactionHash: `0x${string}`
  transactionIndex: number
}

export interface DidClaim {
  args: {
    channelId: `0x${string}`
  }
}

export interface DidDeposit {
  args: {
    channelId: `0x${string}`
    deposit: bigint
  }
}

export interface DidOpen {
  args: {
    channelId: `0x${string}`
    sender: `0x${string}`
    receiver: `0x${string}`
    value: bigint
  }
}

export interface DidSettle {
  args: {
    channelId: `0x${string}`
  }
}

export interface DidStartSettling {
  args: {
    channelId: `0x${string}`
  }
}

export interface Initialized {
  args: {
    version: bigint
  }
}

export interface OwnershipTransferStarted {
  args: {
    previousOwner: `0x${string}`
    newOwner: `0x${string}`
  }
}

export interface OwnershipTransferred {
  args: {
    previousOwner: `0x${string}`
    newOwner: `0x${string}`
  }
}

export interface Paused {
  args: {
    account: `0x${string}`
  }
}

export interface Unpaused {
  args: {
    account: `0x${string}`
  }
}

export interface Upgraded {
  args: {
    implementation: `0x${string}`
  }
}
export enum UnidirectionalUpgradeableEventName {
  DidClaim = 'DidClaim',
  DidDeposit = 'DidDeposit',
  DidOpen = 'DidOpen',
  DidSettle = 'DidSettle',
  DidStartSettling = 'DidStartSettling',
  Initialized = 'Initialized',
  OwnershipTransferStarted = 'OwnershipTransferStarted',
  OwnershipTransferred = 'OwnershipTransferred',
  Paused = 'Paused',
  Unpaused = 'Unpaused',
  Upgraded = 'Upgraded',
}

const abi = JSON.parse(
  `[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"target","type":"address"}],"name":"AddressEmptyCode","type":"error"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"ChannelAlreadyExists","type":"error"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"ChannelDoesNotExist","type":"error"},{"inputs":[{"internalType":"address","name":"implementation","type":"address"}],"name":"ERC1967InvalidImplementation","type":"error"},{"inputs":[],"name":"ERC1967NonPayable","type":"error"},{"inputs":[],"name":"EnforcedPause","type":"error"},{"inputs":[],"name":"EthTransferFailed","type":"error"},{"inputs":[],"name":"ExpectedPause","type":"error"},{"inputs":[],"name":"FailedInnerCall","type":"error"},{"inputs":[],"name":"InvalidInitialization","type":"error"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"InvalidSignature","type":"error"},{"inputs":[],"name":"NotInitializing","type":"error"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"},{"internalType":"address","name":"caller","type":"address"}],"name":"NotReceiver","type":"error"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"},{"internalType":"address","name":"caller","type":"address"}],"name":"NotSender","type":"error"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"NotSettling","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"},{"internalType":"uint256","name":"currentBlock","type":"uint256"},{"internalType":"uint256","name":"settleAt","type":"uint256"}],"name":"SettleWindowNotReached","type":"error"},{"inputs":[],"name":"UUPSUnauthorizedCallContext","type":"error"},{"inputs":[{"internalType":"bytes32","name":"slot","type":"bytes32"}],"name":"UUPSUnsupportedProxiableUUID","type":"error"},{"inputs":[],"name":"ZeroAddress","type":"error"},{"inputs":[],"name":"ZeroSettlementPeriod","type":"error"},{"inputs":[],"name":"ZeroValue","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"DidClaim","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"channelId","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"deposit","type":"uint256"}],"name":"DidDeposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"channelId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"address","name":"receiver","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"DidOpen","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"DidSettle","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"DidStartSettling","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint64","name":"version","type":"uint64"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferStarted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Unpaused","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"implementation","type":"address"}],"name":"Upgraded","type":"event"},{"inputs":[],"name":"UPGRADE_INTERFACE_VERSION","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"acceptOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"},{"internalType":"uint256","name":"payment","type":"uint256"},{"internalType":"address","name":"origin","type":"address"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"canClaim","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"},{"internalType":"address","name":"origin","type":"address"}],"name":"canDeposit","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"canSettle","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"},{"internalType":"address","name":"origin","type":"address"}],"name":"canStartSettling","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"channels","outputs":[{"internalType":"address payable","name":"sender","type":"address"},{"internalType":"address payable","name":"receiver","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"settlingPeriod","type":"uint256"},{"internalType":"uint256","name":"settlingUntil","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"},{"internalType":"uint256","name":"payment","type":"uint256"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"deposit","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"initialOwner","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"isAbsent","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"isOpen","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"isPresent","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"isSettling","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"},{"internalType":"address","name":"receiver","type":"address"},{"internalType":"uint256","name":"settlingPeriod","type":"uint256"}],"name":"open","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"},{"internalType":"uint256","name":"payment","type":"uint256"}],"name":"paymentDigest","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pendingOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"proxiableUUID","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"settle","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"startSettling","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"upgradeToAndCall","outputs":[],"stateMutability":"payable","type":"function"}]`,
)

export class UnidirectionalUpgradeableContract extends BaseContractViem {
  /// GETTERS

  async UPGRADE_INTERFACE_VERSION(): Promise<string> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: 'UPGRADE_INTERFACE_VERSION',
      args: [],
    })) as never as string
  }

  async canClaim(
    channelId: `0x${string}`,
    payment: bigint,
    origin: `0x${string}`,
    signature: `0x${string}`,
  ): Promise<boolean> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: 'canClaim',
      args: [channelId, payment, origin, signature],
    })) as never as boolean
  }

  async canDeposit(
    channelId: `0x${string}`,
    origin: `0x${string}`,
  ): Promise<boolean> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: 'canDeposit',
      args: [channelId, origin],
    })) as never as boolean
  }

  async canSettle(channelId: `0x${string}`): Promise<boolean> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: 'canSettle',
      args: [channelId],
    })) as never as boolean
  }

  async canStartSettling(
    channelId: `0x${string}`,
    origin: `0x${string}`,
  ): Promise<boolean> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: 'canStartSettling',
      args: [channelId, origin],
    })) as never as boolean
  }

  async channels(
    param0: `0x${string}`,
  ): Promise<[`0x${string}`, `0x${string}`, bigint, bigint, bigint]> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: 'channels',
      args: [param0],
    })) as never as [`0x${string}`, `0x${string}`, bigint, bigint, bigint]
  }

  async isAbsent(channelId: `0x${string}`): Promise<boolean> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: 'isAbsent',
      args: [channelId],
    })) as never as boolean
  }

  async isOpen(channelId: `0x${string}`): Promise<boolean> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: 'isOpen',
      args: [channelId],
    })) as never as boolean
  }

  async isPresent(channelId: `0x${string}`): Promise<boolean> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: 'isPresent',
      args: [channelId],
    })) as never as boolean
  }

  async isSettling(channelId: `0x${string}`): Promise<boolean> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: 'isSettling',
      args: [channelId],
    })) as never as boolean
  }

  async owner(): Promise<`0x${string}`> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: 'owner',
      args: [],
    })) as never as `0x${string}`
  }

  async paused(): Promise<boolean> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: 'paused',
      args: [],
    })) as never as boolean
  }

  async paymentDigest(
    channelId: `0x${string}`,
    payment: bigint,
  ): Promise<`0x${string}`> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: 'paymentDigest',
      args: [channelId, payment],
    })) as never as `0x${string}`
  }

  async pendingOwner(): Promise<`0x${string}`> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: 'pendingOwner',
      args: [],
    })) as never as `0x${string}`
  }

  async proxiableUUID(): Promise<`0x${string}`> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: 'proxiableUUID',
      args: [],
    })) as never as `0x${string}`
  }

  /// SETTERS

  async acceptOwnership(options?: TxOptions): Promise<TransactionReceipt> {
    const { request } = await this.publicClient().simulateContract({
      chain: this.walletClient().chain,
      address: this.address(),
      abi: this.abi(),
      functionName: 'acceptOwnership',
      args: [],
      account: this.walletClient().account,
      value: options?.value,
    })
    const txId = await this.walletClient().writeContract(request)

    return await this.publicClient().waitForTransactionReceipt({
      hash: txId,
      confirmations: 3,
      timeout: 45_000,
    })
  }

  async claim(
    channelId: `0x${string}`,
    payment: bigint,
    signature: `0x${string}`,
    options?: TxOptions,
  ): Promise<TransactionReceipt> {
    const { request } = await this.publicClient().simulateContract({
      chain: this.walletClient().chain,
      address: this.address(),
      abi: this.abi(),
      functionName: 'claim',
      args: [channelId, payment, signature],
      account: this.walletClient().account,
      value: options?.value,
    })
    const txId = await this.walletClient().writeContract(request)

    return await this.publicClient().waitForTransactionReceipt({
      hash: txId,
      confirmations: 3,
      timeout: 45_000,
    })
  }

  async deposit(
    channelId: `0x${string}`,
    options?: TxOptions,
  ): Promise<TransactionReceipt> {
    const { request } = await this.publicClient().simulateContract({
      chain: this.walletClient().chain,
      address: this.address(),
      abi: this.abi(),
      functionName: 'deposit',
      args: [channelId],
      account: this.walletClient().account,
      value: options?.value,
    })
    const txId = await this.walletClient().writeContract(request)

    return await this.publicClient().waitForTransactionReceipt({
      hash: txId,
      confirmations: 3,
      timeout: 45_000,
    })
  }

  async initialize(
    initialOwner: `0x${string}`,
    options?: TxOptions,
  ): Promise<TransactionReceipt> {
    const { request } = await this.publicClient().simulateContract({
      chain: this.walletClient().chain,
      address: this.address(),
      abi: this.abi(),
      functionName: 'initialize',
      args: [initialOwner],
      account: this.walletClient().account,
      value: options?.value,
    })
    const txId = await this.walletClient().writeContract(request)

    return await this.publicClient().waitForTransactionReceipt({
      hash: txId,
      confirmations: 3,
      timeout: 45_000,
    })
  }

  async open(
    channelId: `0x${string}`,
    receiver: `0x${string}`,
    settlingPeriod: bigint,
    options?: TxOptions,
  ): Promise<TransactionReceipt> {
    const { request } = await this.publicClient().simulateContract({
      chain: this.walletClient().chain,
      address: this.address(),
      abi: this.abi(),
      functionName: 'open',
      args: [channelId, receiver, settlingPeriod],
      account: this.walletClient().account,
      value: options?.value,
    })
    const txId = await this.walletClient().writeContract(request)

    return await this.publicClient().waitForTransactionReceipt({
      hash: txId,
      confirmations: 3,
      timeout: 45_000,
    })
  }

  async pause(options?: TxOptions): Promise<TransactionReceipt> {
    const { request } = await this.publicClient().simulateContract({
      chain: this.walletClient().chain,
      address: this.address(),
      abi: this.abi(),
      functionName: 'pause',
      args: [],
      account: this.walletClient().account,
      value: options?.value,
    })
    const txId = await this.walletClient().writeContract(request)

    return await this.publicClient().waitForTransactionReceipt({
      hash: txId,
      confirmations: 3,
      timeout: 45_000,
    })
  }

  async renounceOwnership(options?: TxOptions): Promise<TransactionReceipt> {
    const { request } = await this.publicClient().simulateContract({
      chain: this.walletClient().chain,
      address: this.address(),
      abi: this.abi(),
      functionName: 'renounceOwnership',
      args: [],
      account: this.walletClient().account,
      value: options?.value,
    })
    const txId = await this.walletClient().writeContract(request)

    return await this.publicClient().waitForTransactionReceipt({
      hash: txId,
      confirmations: 3,
      timeout: 45_000,
    })
  }

  async settle(
    channelId: `0x${string}`,
    options?: TxOptions,
  ): Promise<TransactionReceipt> {
    const { request } = await this.publicClient().simulateContract({
      chain: this.walletClient().chain,
      address: this.address(),
      abi: this.abi(),
      functionName: 'settle',
      args: [channelId],
      account: this.walletClient().account,
      value: options?.value,
    })
    const txId = await this.walletClient().writeContract(request)

    return await this.publicClient().waitForTransactionReceipt({
      hash: txId,
      confirmations: 3,
      timeout: 45_000,
    })
  }

  async startSettling(
    channelId: `0x${string}`,
    options?: TxOptions,
  ): Promise<TransactionReceipt> {
    const { request } = await this.publicClient().simulateContract({
      chain: this.walletClient().chain,
      address: this.address(),
      abi: this.abi(),
      functionName: 'startSettling',
      args: [channelId],
      account: this.walletClient().account,
      value: options?.value,
    })
    const txId = await this.walletClient().writeContract(request)

    return await this.publicClient().waitForTransactionReceipt({
      hash: txId,
      confirmations: 3,
      timeout: 45_000,
    })
  }

  async transferOwnership(
    newOwner: `0x${string}`,
    options?: TxOptions,
  ): Promise<TransactionReceipt> {
    const { request } = await this.publicClient().simulateContract({
      chain: this.walletClient().chain,
      address: this.address(),
      abi: this.abi(),
      functionName: 'transferOwnership',
      args: [newOwner],
      account: this.walletClient().account,
      value: options?.value,
    })
    const txId = await this.walletClient().writeContract(request)

    return await this.publicClient().waitForTransactionReceipt({
      hash: txId,
      confirmations: 3,
      timeout: 45_000,
    })
  }

  async unpause(options?: TxOptions): Promise<TransactionReceipt> {
    const { request } = await this.publicClient().simulateContract({
      chain: this.walletClient().chain,
      address: this.address(),
      abi: this.abi(),
      functionName: 'unpause',
      args: [],
      account: this.walletClient().account,
      value: options?.value,
    })
    const txId = await this.walletClient().writeContract(request)

    return await this.publicClient().waitForTransactionReceipt({
      hash: txId,
      confirmations: 3,
      timeout: 45_000,
    })
  }

  async upgradeToAndCall(
    newImplementation: `0x${string}`,
    data: `0x${string}`,
    options?: TxOptions,
  ): Promise<TransactionReceipt> {
    const { request } = await this.publicClient().simulateContract({
      chain: this.walletClient().chain,
      address: this.address(),
      abi: this.abi(),
      functionName: 'upgradeToAndCall',
      args: [newImplementation, data],
      account: this.walletClient().account,
      value: options?.value,
    })
    const txId = await this.walletClient().writeContract(request)

    return await this.publicClient().waitForTransactionReceipt({
      hash: txId,
      confirmations: 3,
      timeout: 45_000,
    })
  }

  /// EVENTS

  isDidClaimEvent(eventName: string): boolean {
    return eventName === 'DidClaim'
  }

  isDidDepositEvent(eventName: string): boolean {
    return eventName === 'DidDeposit'
  }

  isDidOpenEvent(eventName: string): boolean {
    return eventName === 'DidOpen'
  }

  isDidSettleEvent(eventName: string): boolean {
    return eventName === 'DidSettle'
  }

  isDidStartSettlingEvent(eventName: string): boolean {
    return eventName === 'DidStartSettling'
  }

  isInitializedEvent(eventName: string): boolean {
    return eventName === 'Initialized'
  }

  isOwnershipTransferStartedEvent(eventName: string): boolean {
    return eventName === 'OwnershipTransferStarted'
  }

  isOwnershipTransferredEvent(eventName: string): boolean {
    return eventName === 'OwnershipTransferred'
  }

  isPausedEvent(eventName: string): boolean {
    return eventName === 'Paused'
  }

  isUnpausedEvent(eventName: string): boolean {
    return eventName === 'Unpaused'
  }

  isUpgradedEvent(eventName: string): boolean {
    return eventName === 'Upgraded'
  }

  static parseLogs(receipt: TransactionReceipt): ParseEventLogsReturnType {
    return parseEventLogs({
      abi: abi as any,
      logs: receipt.logs,
    }) as ParseEventLogsReturnType
  }

  static hasEvent(
    receipt: TransactionReceipt,
    eventName: UnidirectionalUpgradeableEventName,
  ): boolean {
    return this.parseLogs(receipt).some(
      (log: any) => log.eventName === eventName,
    )
  }

  static extractEventFromReceipt<T>(
    receipt: TransactionReceipt,
    eventName: UnidirectionalUpgradeableEventName,
  ): T {
    return this.parseLogs(receipt).find(
      (log: any) => log.eventName === eventName,
    ) as T
  }

  static parseEvents(
    receipt: TransactionReceipt,
  ): UnidirectionalUpgradeableEvent[] {
    return this.parseLogs(receipt).map((log: any) => ({
      eventName: log.eventName,
      args: log.args,
      address: log.address,
      blockHash: log.blockHash,
      blockNumber: log.blockNumber,
      data: log.data,
      logIndex: log.logIndex,
      removed: log.removed,
      topics: log.topics,
      transactionHash: log.transactionHash,
      transactionIndex: log.transactionIndex,
    }))
  }

  constructor(deployedContractAddress: `0x${string}`, params: CtorParams) {
    super(deployedContractAddress, params, abi)
  }
}
