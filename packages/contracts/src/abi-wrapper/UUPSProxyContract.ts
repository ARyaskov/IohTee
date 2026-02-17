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

export interface UUPSProxyEvent {
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

export interface Upgraded {
  args: {
    implementation: `0x${string}`
  }
}
export enum UUPSProxyEventName {
  Upgraded = 'Upgraded',
}

const abi = JSON.parse(
  `[{"inputs":[{"internalType":"address","name":"implementation","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"target","type":"address"}],"name":"AddressEmptyCode","type":"error"},{"inputs":[{"internalType":"address","name":"implementation","type":"address"}],"name":"ERC1967InvalidImplementation","type":"error"},{"inputs":[],"name":"ERC1967NonPayable","type":"error"},{"inputs":[],"name":"FailedInnerCall","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"implementation","type":"address"}],"name":"Upgraded","type":"event"},{"stateMutability":"payable","type":"fallback"}]`,
)

export class UUPSProxyContract extends BaseContractViem {
  /// GETTERS

  /// SETTERS

  /// EVENTS

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
    eventName: UUPSProxyEventName,
  ): boolean {
    return this.parseLogs(receipt).some(
      (log: any) => log.eventName === eventName,
    )
  }

  static extractEventFromReceipt<T>(
    receipt: TransactionReceipt,
    eventName: UUPSProxyEventName,
  ): T {
    return this.parseLogs(receipt).find(
      (log: any) => log.eventName === eventName,
    ) as T
  }

  static parseEvents(receipt: TransactionReceipt): UUPSProxyEvent[] {
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
