import 'dotenv/config'
import {
  Abi,
  AbiEvent,
  bytesToHex,
  getContract,
  Log,
  parseAbi,
  ParseEventLogsReturnType,
  PublicClient,
  ReadContractReturnType,
  WalletClient,
  WriteContractReturnType,
} from 'viem'
import { GetContractReturnType } from '@nomicfoundation/hardhat-viem/types'
import { ArtifactsMap } from 'hardhat/types/artifacts'
import { mainnet } from 'viem/chains'
import { getContractEvents } from 'viem/actions'
// require used intentionally here, suddenly json import is not working with TS 5.5 even with resolveJsonModule: true
const uniArtifact = require('../abi/Unidirectional.json')

export interface OpenProps {
  from: `0x${string}`
  value: bigint
  gas: number
}

export interface Channel {
  sender: `0x${string}`
  receiver: `0x${string}`
  value: bigint
  settlingPeriod: bigint
  settlingUntil: bigint
}

export interface Event {
  eventName: string
  args: readonly unknown[] | Record<string, unknown>
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

export enum DefaultUnidirectionalAddress {
  Polygon = '0x88fDf5Ba18E8da373ee23c7D5d60C94A957cC3f5',
  PolygonAmoy = '0x88fDf5Ba18E8da373ee23c7D5d60C94A957cC3f5',
}

export enum UnidirectionalEventName {
  DidClaim = 'DidClaim',
  DidDeposit = 'DidDeposit',
  DidOpen = 'DidOpen',
  DidSettle = 'DidSettle',
  DidStartSettling = 'DidStartSettling',
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

export class Unidirectional {
  private readonly _address: `0x${string}`
  private readonly _publicClient: PublicClient
  private readonly _walletClient: WalletClient
  private readonly _contract: GetContractReturnType
  private readonly _abi: any

  constructor(
    publicClient: PublicClient,
    walletClient: WalletClient,
    _address: `0x${string}`,
  ) {
    this._publicClient = publicClient
    this._walletClient = walletClient
    this._address = _address
    this._contract = getContract({
      address: _address,
      abi: uniArtifact.abi,
      client: {
        public: publicClient as never,
        wallet: walletClient as never,
      },
    })
    this._abi = uniArtifact.abi
  }

  publicClient() {
    return this._publicClient
  }

  walletClient() {
    return this._walletClient
  }

  contract(): any {
    return this._contract
  }

  address(): `0x${string}` {
    return this._address
  }

  abi(): Abi {
    return this._abi
  }

  events(): AbiEvent[] {
    return this.abi().filter((e) => e.type === 'event') as AbiEvent[]
  }

  async readEvents(): Promise<Event[]> {
    return (await this.publicClient().getContractEvents({
      abi: this.abi(),
    })) as never as Event[]
  }

  async channel(channelId: `0x${string}`): Promise<Channel> {
    const readResult: any = await this._publicClient.readContract({
      address: this._address,
      abi: this.abi(),
      functionName: 'channels',
      args: [channelId],
    })

    return {
      sender: readResult[0] as never as `0x${string}`,
      receiver: readResult[1] as never as `0x${string}`,
      value: readResult[2] as never as bigint,
      settlingPeriod: readResult[3] as never as bigint,
      settlingUntil: readResult[4] as never as bigint,
    }
  }

  async open(
    channelId: `0x${string}`,
    receiver: `0x${string}`,
    settlingPeriod: number,
    props: OpenProps,
  ): Promise<WriteContractReturnType> {
    return await this._walletClient.writeContract({
      chain: this._walletClient.chain,
      address: this._address,
      abi: this.abi(),
      functionName: 'open',
      args: [channelId, receiver, settlingPeriod],
      account: props.from,
      value: props.value,
      gas: props.gas as never as bigint,
    })
  }

  async isPresent(channelId: `0x${string}`): Promise<boolean> {
    return await this._publicClient.readContract({
      address: this._address,
      abi: this.abi(),
      functionName: 'isPresent',
      args: [channelId],
    }) as never as boolean
  }

  async isAbsent(channelId: `0x${string}`): Promise<boolean> {
    return await this._publicClient.readContract({
      address: this._address,
      abi: this.abi(),
      functionName: 'isAbsent',
      args: [channelId],
    }) as never as boolean
  }

  async isOpen(channelId: `0x${string}`): Promise<boolean> {
    return await this._publicClient.readContract({
      address: this._address,
      abi: this.abi(),
      functionName: 'isOpen',
      args: [channelId],
    }) as never as boolean
  }

  async isSettling(channelId: `0x${string}`): Promise<boolean> {
    return await this._publicClient.readContract({
      address: this._address,
      abi: this.abi(),
      functionName: 'isSettling',
      args: [channelId],
    }) as never as boolean
  }
}
