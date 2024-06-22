import 'dotenv/config'
import { bytesToHex } from 'viem'

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

export const DefaultUnidirectionalAddress: Record<number, `0x${string}`> = {
  1: '0x', // Ethereum
  56: '0x', // BNB Smart Chain
  137: '0x88fDf5Ba18E8da373ee23c7D5d60C94A957cC3f5', // Polygon
  11155111: '0x', // Sepolia
  97: '0x', // Binance Smart Chain Testnet
  80002: '0x96Cd8a0cAC5632c718Fcb520b4886585a8b8f976', // Polygon Amoy
  31337: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Hardhat
}

export enum ChannelState {
  Impossible = -1,
  Open = 0,
  Settling = 1,
  Settled = 2,
}

export function channelId(): `0x${string}` {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32))
  const randomHexValue = bytesToHex(randomBytes)
  return randomHexValue
}
