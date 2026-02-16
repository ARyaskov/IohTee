import { homedir } from 'node:os'
import Logger from './log'
import { resolve, join } from 'node:path'
import {
  createPublicClient,
  http,
  createWalletClient,
  PublicClient,
  WalletClient,
  Chain,
  custom,
} from 'viem'
import * as env from './env'
import { DefaultUnidirectionalAddress } from '@riaskov/iohtee-contracts'
import { polygonAmoy } from 'viem/chains'
import { readFileSync } from 'node:fs'

const BASE_DIR = '.iohtee'
const CONFIGURATION_FILE = 'config.json'
const DATABASE_FILE = 'storage.db'
export const VERSION = '2.0.0'
export const PROTOCOL = `iohtee/${VERSION}`
export const PAYWALL_PATH = `api/paywall/${PROTOCOL}`

const log = new Logger('configuration')

const CONTRACTS = {
  development: DefaultUnidirectionalAddress[31337],
  polygon: DefaultUnidirectionalAddress[137],
  polygonAmoy: DefaultUnidirectionalAddress[80002],
}

export const contractAddress = (): string => {
  const container = env.container()
  const network = container.IOHTEE_NETWORK || 'polygonAmoy'
  const address = container.CONTRACT_ADDRESS
  if (address) {
    return address
  }
  const fallback = (CONTRACTS as Record<string, string | undefined>)[network]
  if (!fallback) {
    throw new Error(`Unsupported network: ${network}`)
  }
  return fallback
}

export const baseDirPath = (): string => resolve(join(homedir(), BASE_DIR))

export const configFilePath = (): string =>
  join(baseDirPath(), CONFIGURATION_FILE)

const databaseFilePath = (): string =>
  `sqlite://${join(baseDirPath(), DATABASE_FILE)}`

export interface IConfigurationOptions {
  account?: string
  password?: string
  databaseUrl?: string
}

export class Configuration {
  public account?: string
  public password?: string
  public databaseUrl: string
  public path: string

  constructor(options: IConfigurationOptions) {
    this.account = options.account
    this.password = options.password
    this.databaseUrl = options.databaseUrl || databaseFilePath()
    this.path = configFilePath()
  }
}

export const configurationOptions = (): Record<string, unknown> => {
  try {
    return JSON.parse(readFileSync(configFilePath(), 'utf8'))
  } catch (error) {
    log.error(error)
    return {}
  }
}

export const sender = (): Configuration => {
  try {
    const options = configurationOptions() as {
      sender?: { account?: string; password?: string; databaseUrl?: string }
    }

    return new Configuration({
      account: process.env.IOHTEE_SENDER_ACCOUNT || options.sender?.account,
      password: process.env.IOHTEE_SENDER_PASSWORD || options.sender?.password,
      databaseUrl:
        process.env.IOHTEE_DATABASE_URL || options.sender?.databaseUrl,
    })
  } catch {
    return new Configuration({})
  }
}

export const receiver = (): Configuration => {
  try {
    const options = configurationOptions() as {
      receiver?: { account?: string; password?: string; databaseUrl?: string }
    }

    return new Configuration({
      account: process.env.IOHTEE_RECEIVER_ACCOUNT || options.receiver?.account,
      password:
        process.env.IOHTEE_RECEIVER_PASSWORD || options.receiver?.password,
      databaseUrl:
        process.env.IOHTEE_DATABASE_URL || options.receiver?.databaseUrl,
    })
  } catch (error) {
    log.error(error)
    return new Configuration({})
  }
}

export function publicClient(): PublicClient {
  const defaultRpcUrl = process.env.RPC_URL || 'http://localhost:8545'

  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return createPublicClient({
      transport: custom((window as any).ethereum),
    }) as PublicClient
  }

  return createPublicClient({
    transport: http(defaultRpcUrl, {
      batch: true,
    }),
  }) as PublicClient
}

export function walletClient(chain: Chain = polygonAmoy): WalletClient {
  const defaultRpcUrl = process.env.RPC_URL || 'http://localhost:8545'

  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return createWalletClient({
      chain,
      transport: custom((window as any).ethereum),
    }) as WalletClient
  }

  return createWalletClient({
    chain,
    transport: http(defaultRpcUrl, {
      batch: true,
    }),
  }) as WalletClient
}

export function httpRpc(): string {
  return process.env.RPC_URL || 'http://localhost:8545'
}

export function mnemonic(): string {
  return String(process.env.ACCOUNT_MNEMONIC ?? '').trim()
}

export function hdPath(): `m/44'/60'/${string}` {
  return `m/44'/60'/0'/0/0`
}
