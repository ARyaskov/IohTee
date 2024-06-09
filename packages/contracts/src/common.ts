import 'dotenv/config'
import {
  Abi,
  AbiEvent,
  bytesToHex,
  Chain,
  createPublicClient,
  createWalletClient,
  getContract,
  http,
  parseEventLogs,
  ParseEventLogsReturnType,
  PublicClient,
  WalletClient,
  WriteContractReturnType,
} from 'viem'
import { GetContractReturnType } from '@nomicfoundation/hardhat-viem/types'
import {
  bsc,
  bscTestnet,
  hardhat,
  mainnet,
  polygon,
  polygonAmoy,
  sepolia,
} from 'viem/chains'

export interface OpenProps {
  gas: number
}

export interface Channel {
  channelId: `0x${string}`
  sender: `0x${string}`
  receiver: `0x${string}`
  value: bigint
  settlingPeriod: bigint
  settlingUntil: bigint
}

export interface Event {
  eventName: string
  args: any
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

export const Network = {
  Mainnet: mainnet,
  Bsc: bsc,
  Polygon: polygon,
  Sepolia: sepolia,
  BscTestnet: bscTestnet,
  PolygonAmoy: polygonAmoy,
  Hardhat: hardhat,
} as const

export type NetworkType = (typeof Network)[keyof typeof Network]

export const DefaultUnidirectionalAddress: Record<string, `0x${string}`> = {
  Ethereum: '0x',
  'BNB Smart Chain': '0x',
  Polygon: '0x88fDf5Ba18E8da373ee23c7D5d60C94A957cC3f5',
  Sepolia: '0x',
  'Binance Smart Chain Testnet': '0x',
  'Polygon Amoy': '0x88fDf5Ba18E8da373ee23c7D5d60C94A957cC3f5',
  Hardhat: '0x',
}

export enum UnidirectionalEventName {
  DidClaim = 'DidClaim',
  DidDeposit = 'DidDeposit',
  DidOpen = 'DidOpen',
  DidSettle = 'DidSettle',
  DidStartSettling = 'DidStartSettling',
}

export enum ChannelState {
  Impossible = -1,
  Open = 0,
  Settling = 1,
  Settled = 2,
}

export function networkByName(networkName: string): Chain {
  const network = Object.values(Network).find(
    (network) => network.name === networkName,
  )
  if (!network) {
    throw new Error(`Network ${networkName} not found`)
  }
  return network
}

export function channelId(): `0x${string}` {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32))
  const randomHexValue = bytesToHex(randomBytes)
  return randomHexValue
}

export function hasEvent(
  logs: ParseEventLogsReturnType,
  eventName: string,
): boolean {
  return logs.some((log) => log.eventName === eventName)
}

export function parseEvents(logs: ParseEventLogsReturnType): Event[] {
  return logs.map((log) => {
    return {
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
    }
  })
}

export function extractEventFromLogs(
  logs: Event[],
  eventName: UnidirectionalEventName,
): Event | undefined {
  return logs.find((log) => log.eventName === eventName)
}
