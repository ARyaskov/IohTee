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

export interface SigTestEvent {
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

export enum SigTestEventName {}

const abi = JSON.parse(
  `[{"inputs":[],"name":"ECDSAInvalidSignature","type":"error"},{"inputs":[{"internalType":"uint256","name":"length","type":"uint256"}],"name":"ECDSAInvalidSignatureLength","type":"error"},{"inputs":[{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"ECDSAInvalidSignatureS","type":"error"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"},{"internalType":"uint256","name":"payment","type":"uint256"}],"name":"paymentDigest","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"},{"internalType":"uint256","name":"payment","type":"uint256"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"testSig","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}]`,
)

export class SigTestContract extends BaseContractViem {
  /// GETTERS

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

  async testSig(
    channelId: `0x${string}`,
    payment: bigint,
    signature: `0x${string}`,
  ): Promise<`0x${string}`> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: 'testSig',
      args: [channelId, payment, signature],
    })) as never as `0x${string}`
  }

  /// SETTERS

  /// EVENTS

  static parseLogs(receipt: TransactionReceipt): ParseEventLogsReturnType {
    return parseEventLogs({
      abi: abi as any,
      logs: receipt.logs,
    }) as ParseEventLogsReturnType
  }

  static hasEvent(
    receipt: TransactionReceipt,
    eventName: SigTestEventName,
  ): boolean {
    return this.parseLogs(receipt).some(
      (log: any) => log.eventName === eventName,
    )
  }

  static extractEventFromReceipt<T>(
    receipt: TransactionReceipt,
    eventName: SigTestEventName,
  ): T {
    return this.parseLogs(receipt).find(
      (log: any) => log.eventName === eventName,
    ) as T
  }

  static parseEvents(receipt: TransactionReceipt): SigTestEvent[] {
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
