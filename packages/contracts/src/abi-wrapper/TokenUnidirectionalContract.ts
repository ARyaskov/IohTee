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

export interface TokenUnidirectionalEvent {
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
    tokenContract: `0x${string}`
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
export enum TokenUnidirectionalEventName {
  DidClaim = 'DidClaim',
  DidDeposit = 'DidDeposit',
  DidOpen = 'DidOpen',
  DidSettle = 'DidSettle',
  DidStartSettling = 'DidStartSettling',
}

const abi = JSON.parse(
  `[{"inputs":[],"name":"ECDSAInvalidSignature","type":"error"},{"inputs":[{"internalType":"uint256","name":"length","type":"uint256"}],"name":"ECDSAInvalidSignatureLength","type":"error"},{"inputs":[{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"ECDSAInvalidSignatureS","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"DidClaim","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"channelId","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"deposit","type":"uint256"}],"name":"DidDeposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"channelId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"address","name":"receiver","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"},{"indexed":false,"internalType":"address","name":"tokenContract","type":"address"}],"name":"DidOpen","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"DidSettle","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"DidStartSettling","type":"event"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"},{"internalType":"uint256","name":"payment","type":"uint256"},{"internalType":"address","name":"origin","type":"address"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"canClaim","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"},{"internalType":"address","name":"origin","type":"address"}],"name":"canDeposit","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"canSettle","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"},{"internalType":"address","name":"origin","type":"address"}],"name":"canStartSettling","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"channels","outputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"receiver","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"settlingPeriod","type":"uint256"},{"internalType":"uint256","name":"settlingUntil","type":"uint256"},{"internalType":"address","name":"tokenContract","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"},{"internalType":"uint256","name":"payment","type":"uint256"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"isAbsent","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"isOpen","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"isPresent","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"isSettling","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"},{"internalType":"address","name":"receiver","type":"address"},{"internalType":"uint256","name":"settlingPeriod","type":"uint256"},{"internalType":"address","name":"tokenContract","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"open","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"},{"internalType":"uint256","name":"payment","type":"uint256"},{"internalType":"address","name":"tokenContract","type":"address"}],"name":"paymentDigest","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"settle","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"startSettling","outputs":[],"stateMutability":"nonpayable","type":"function"}]`,
)

export class TokenUnidirectionalContract extends BaseContractViem {
  /// GETTERS

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
  ): Promise<
    [`0x${string}`, `0x${string}`, bigint, bigint, bigint, `0x${string}`]
  > {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: 'channels',
      args: [param0],
    })) as never as [
      `0x${string}`,
      `0x${string}`,
      bigint,
      bigint,
      bigint,
      `0x${string}`,
    ]
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

  async paymentDigest(
    channelId: `0x${string}`,
    payment: bigint,
    tokenContract: `0x${string}`,
  ): Promise<`0x${string}`> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: 'paymentDigest',
      args: [channelId, payment, tokenContract],
    })) as never as `0x${string}`
  }

  /// SETTERS

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
    value: bigint,
    options?: TxOptions,
  ): Promise<TransactionReceipt> {
    const { request } = await this.publicClient().simulateContract({
      chain: this.walletClient().chain,
      address: this.address(),
      abi: this.abi(),
      functionName: 'deposit',
      args: [channelId, value],
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
    tokenContract: `0x${string}`,
    value: bigint,
    options?: TxOptions,
  ): Promise<TransactionReceipt> {
    const { request } = await this.publicClient().simulateContract({
      chain: this.walletClient().chain,
      address: this.address(),
      abi: this.abi(),
      functionName: 'open',
      args: [channelId, receiver, settlingPeriod, tokenContract, value],
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

  static parseLogs(receipt: TransactionReceipt): ParseEventLogsReturnType {
    return parseEventLogs({
      abi: abi as any,
      logs: receipt.logs,
    }) as ParseEventLogsReturnType
  }

  static hasEvent(
    receipt: TransactionReceipt,
    eventName: TokenUnidirectionalEventName,
  ): boolean {
    return this.parseLogs(receipt).some(
      (log: any) => log.eventName === eventName,
    )
  }

  static extractEventFromReceipt<T>(
    receipt: TransactionReceipt,
    eventName: TokenUnidirectionalEventName,
  ): T {
    return this.parseLogs(receipt).find(
      (log: any) => log.eventName === eventName,
    ) as T
  }

  static parseEvents(receipt: TransactionReceipt): TokenUnidirectionalEvent[] {
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
