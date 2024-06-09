import { homedir } from 'node:os'
import Logger from '@machinomy/logger'
import { resolve, join } from 'node:path'
import { createPublicClient, http, createWalletClient, PublicClient, WalletClient, Chain } from 'viem'
import { polygon, polygonAmoy} from 'viem/chains'
import * as env from './env'
import {NetworkType} from "@riaskov/machinomy-contracts";

const BASE_DIR = '.machinomy'
const CONFIGURATION_FILE = 'config.json'
const DATABASE_FILE = 'storage.db'
export const VERSION = '2.0.0'
export const PROTOCOL = 'machinomy/' + VERSION
export const PAYWALL_PATH = 'api/paywall/' + PROTOCOL

const log = new Logger('configuration')

const CONTRACTS = {
  development: '0x',
  polygon: '0x88fDf5Ba18E8da373ee23c7D5d60C94A957cC3f5',
  polygonAmoy: '0x88fDf5Ba18E8da373ee23c7D5d60C94A957cC3f5',
}

export const contractAddress = (): string => {
  const container = env.container()
  const network = container.MACHINOMY_NETWORK || 'polygonAmoy'
  const address = container.CONTRACT_ADDRESS
  if (address) {
    return address
  } else {
    return (CONTRACTS as any)[network]
  }
}

export const baseDirPath = (): string => {
  return resolve(join(homedir(), BASE_DIR))
}

export const configFilePath = (): string => {
  return join(baseDirPath(), CONFIGURATION_FILE)
}

const databaseFilePath = (): string => {
  return 'nedb://' + join(baseDirPath(), DATABASE_FILE)
}

export interface IConfigurationOptions {
  account?: string
  password?: string
  engine?: string
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

/**
 * @returns {object}
 */
export const configurationOptions = () => {
  try {
    const fs = require('fs')
    return JSON.parse(fs.readFileSync(configFilePath(), 'utf8'))
  } catch (error) {
    log.error(error)
    return {}
  }
}

export const sender = (): Configuration => {
  try {
    const options = configurationOptions()
    return new Configuration({
      account: process.env.MACHINOMY_SENDER_ACCOUNT || options.sender.account,
      password:
        process.env.MACHINOMY_SENDER_PASSWORD || options.sender.password,
      engine: process.env.MACHINOMY_DATABASE_URL || options.sender.databaseUrl,
    })
  } catch (error) {
    return new Configuration({})
  }
}

export const receiver = (): Configuration => {
  try {
    const options = configurationOptions()
    return new Configuration({
      account:
        process.env.MACHINOMY_RECEIVER_ACCOUNT || options.receiver.account,
      password:
        process.env.MACHINOMY_RECEIVER_PASSWORD || options.receiver.password,
      engine:
        process.env.MACHINOMY_DATABASE_URL || options.receiver.databaseUrl,
    })
  } catch (error) {
    log.error(error)
    return new Configuration({})
  }
}

export function publicClient(): PublicClient {
  const defaultRpcUrl = process.env.MACHINOMY_GETH_ADDR || 'http://localhost:8545'

  if (typeof window !== 'undefined' && (window as any).ethereum) {
    const publicClient = createPublicClient({
      chain: polygonAmoy, // TODO make a multiple chains
      transport: (window as any).ethereum,
    })
    return publicClient as any
  } else {
    const publicClient = createPublicClient({
      chain: polygonAmoy, // TODO make a multiple chains
      transport: http(defaultRpcUrl),
    })
    return publicClient as any
  }
}

export function walletClient(chain: Chain = polygonAmoy): WalletClient {
  const defaultRpcUrl = process.env.MACHINOMY_GETH_ADDR || 'http://localhost:8545';

  if (typeof window !== 'undefined' && (window as any).ethereum) {
    const walletClient = createWalletClient({
      chain: chain,
      transport: (window as any).ethereum,
    });
    return walletClient as WalletClient;
  } else {
    const walletClient = createWalletClient({
      chain: chain,
      transport: http(defaultRpcUrl),
    })
    return walletClient as WalletClient
  }
}

export function httpRpc(chain: NetworkType): string {
  const defaultRpcUrl = process.env.MACHINOMY_HTTP_RPC || 'http://localhost:8545';
  let result = defaultRpcUrl
  if (chain === polygon) {
    result = process.env.POLYGON_RPC_URL!
  } else if (chain === polygonAmoy) {
    result = process.env.POLYGON_AMOY_RPC_URL!
  }

  return result
}

export function mnemonic(): string {
  return process.env.ACCOUNT_MNEMONIC!
}
