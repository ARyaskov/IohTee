import {
  Abi,
  AbiEvent,
  createPublicClient,
  createWalletClient,
  getContract,
  http,
  PublicClient,
  WalletClient,
  GetContractReturnType,
  TransactionReceipt,
  parseEventLogs,
  ParseEventLogsReturnType,
  extractChain
} from "viem"
import { mnemonicToAccount } from "viem/accounts"
import * as chains from "viem/chains"

export interface TxOptions {
  value?: bigint
}

export type CtorBaseParams = {
  cachePeriod?: number
}

export type CtorAccountParamPure = CtorBaseParams & {
  httpRpcUrl: string
  networkId: number
  mnemonic: string
  hdPath: `m/44'/60'/${string}`
}

export type CtorAccountParamViem = CtorBaseParams & {
  publicClientViem: PublicClient
  walletClientViem: WalletClient
}

export function isCtorAccountParamPure(
  params: CtorBaseParams,
): params is CtorAccountParamPure {
  return (
    (params as CtorAccountParamPure).httpRpcUrl !== undefined &&
    (params as CtorAccountParamPure).mnemonic !== undefined
    )
}

export type CtorParams = CtorAccountParamPure | CtorAccountParamViem

export interface UnidirectionalEvent {
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

export interface debug1 {
  args: {
    addr1: `0x${string}`
    addr2: `0x${string}`
  }
}


export enum UnidirectionalEventName {
  DidClaim = "DidClaim", 
  DidDeposit = "DidDeposit", 
  DidOpen = "DidOpen", 
  DidSettle = "DidSettle", 
  DidStartSettling = "DidStartSettling", 
  debug1 = "debug1"
}

const abi = JSON.parse(`[{"inputs":[],"name":"ECDSAInvalidSignature","type":"error"},{"inputs":[{"internalType":"uint256","name":"length","type":"uint256"}],"name":"ECDSAInvalidSignatureLength","type":"error"},{"inputs":[{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"ECDSAInvalidSignatureS","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"DidClaim","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"channelId","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"deposit","type":"uint256"}],"name":"DidDeposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"channelId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"address","name":"receiver","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"DidOpen","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"DidSettle","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"DidStartSettling","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"addr1","type":"address"},{"indexed":true,"internalType":"address","name":"addr2","type":"address"}],"name":"debug1","type":"event"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"},{"internalType":"uint256","name":"payment","type":"uint256"},{"internalType":"address","name":"origin","type":"address"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"canClaim","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function","singleReturnValue":true},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"},{"internalType":"address","name":"origin","type":"address"}],"name":"canDeposit","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function","singleReturnValue":true},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"canSettle","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function","singleReturnValue":true},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"},{"internalType":"address","name":"origin","type":"address"}],"name":"canStartSettling","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function","singleReturnValue":true},{"inputs":[{"internalType":"bytes32","name":"param0","type":"bytes32"}],"name":"channels","outputs":[{"internalType":"address payable","name":"sender","type":"address"},{"internalType":"address payable","name":"receiver","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"settlingPeriod","type":"uint256"},{"internalType":"uint256","name":"settlingUntil","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"},{"internalType":"uint256","name":"payment","type":"uint256"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"deposit","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"isAbsent","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function","singleReturnValue":true},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"isOpen","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function","singleReturnValue":true},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"isPresent","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function","singleReturnValue":true},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"isSettling","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function","singleReturnValue":true},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"},{"internalType":"address","name":"receiver","type":"address"},{"internalType":"uint256","name":"settlingPeriod","type":"uint256"}],"name":"open","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"},{"internalType":"uint256","name":"payment","type":"uint256"}],"name":"paymentDigest","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function","singleReturnValue":true},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"settle","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"channelId","type":"bytes32"}],"name":"startSettling","outputs":[],"stateMutability":"nonpayable","type":"function"}]`)

export class UnidirectionalContract {
  private readonly _publicClient: PublicClient
  private readonly _walletClient: WalletClient
  private readonly _address: `0x${string}`
  private readonly _contract: GetContractReturnType
  private readonly _abi: any

  static parseLogs(receipt: TransactionReceipt): ParseEventLogsReturnType {
    const logs = parseEventLogs({
      abi: abi as any,
      logs: receipt.logs,
    })
    return logs as any
  }

  static hasEvent(receipt: TransactionReceipt, eventName: UnidirectionalEventName): boolean {
    return parseEventLogs({ abi: abi, logs: receipt.logs }).some((log: any) => log.eventName === eventName)
  }

  static extractEventFromReceipt<T>(receipt: TransactionReceipt, eventName: UnidirectionalEventName): T {
    return parseEventLogs({ abi: abi, logs: receipt.logs }).find((log: any) => log.eventName === eventName) as T
  }

  static parseEvents(receipt: TransactionReceipt): UnidirectionalEvent[] {
    return parseEventLogs({ abi: abi, logs: receipt.logs }).map((log: any) => {
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

  constructor(deployedContractAddress: `0x${string}`, params: CtorParams) {
    this._address = deployedContractAddress

    if (isCtorAccountParamPure(params)) {
      let network = extractChain({
        chains: Object.values(chains) as any,
        id: params.networkId,
      })
      // @ts-ignore
      this._publicClient = createPublicClient({
        batch: {
           multicall: true,
        },
        // @ts-ignore
        chain: network as any,
        transport: http(
          params.httpRpcUrl,
          {
            batch: true,
          }
        ),
      })
      this._walletClient = createWalletClient({
        // @ts-ignore
        chain: network as any,
        transport: http(
          params.httpRpcUrl,
          {
             batch: true,
          }
        ),
        account: mnemonicToAccount(params.mnemonic, { path: params.hdPath }),
      })
    } else {
      this._publicClient = params.publicClientViem
      this._walletClient = params.walletClientViem
    }

    this._abi = abi

    this._contract = getContract({
      address: this._address,
      abi: this._abi,
      client: {
        public: this._publicClient as never,
        wallet: this._walletClient as never,
      },
    })

  }

  publicClient(): PublicClient {
    return this._publicClient
  }

  walletClient(): WalletClient {
    return this._walletClient
  }

  contract(): GetContractReturnType {
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

  async canClaim(channelId: `0x${string}`, payment: bigint, origin: `0x${string}`, signature: `0x${string}`): Promise<boolean> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: "canClaim",
      args: [
        channelId, payment, origin, signature
      ],
    })) as never as boolean
  }
  async canDeposit(channelId: `0x${string}`, origin: `0x${string}`): Promise<boolean> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: "canDeposit",
      args: [
        channelId, origin
      ],
    })) as never as boolean
  }
  async canSettle(channelId: `0x${string}`): Promise<boolean> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: "canSettle",
      args: [
        channelId
      ],
    })) as never as boolean
  }
  async canStartSettling(channelId: `0x${string}`, origin: `0x${string}`): Promise<boolean> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: "canStartSettling",
      args: [
        channelId, origin
      ],
    })) as never as boolean
  }
  async channels(param0: `0x${string}`): Promise<[`0x${string}`, `0x${string}`, bigint, bigint, bigint]> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: "channels",
      args: [
        param0
      ],
    })) as never as [`0x${string}`, `0x${string}`, bigint, bigint, bigint]
  }
  async isAbsent(channelId: `0x${string}`): Promise<boolean> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: "isAbsent",
      args: [
        channelId
      ],
    })) as never as boolean
  }
  async isOpen(channelId: `0x${string}`): Promise<boolean> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: "isOpen",
      args: [
        channelId
      ],
    })) as never as boolean
  }
  async isPresent(channelId: `0x${string}`): Promise<boolean> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: "isPresent",
      args: [
        channelId
      ],
    })) as never as boolean
  }
  async isSettling(channelId: `0x${string}`): Promise<boolean> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: "isSettling",
      args: [
        channelId
      ],
    })) as never as boolean
  }
  async paymentDigest(channelId: `0x${string}`, payment: bigint): Promise<`0x${string}`> {
    return (await this.publicClient().readContract({
      address: this.address(),
      abi: this.abi(),
      functionName: "paymentDigest",
      args: [
        channelId, payment
      ],
    })) as never as `0x${string}`
  }

  async claim(channelId: `0x${string}`, payment: bigint, signature: `0x${string}`, options?: TxOptions): Promise<TransactionReceipt>{
    const { request } = await this.publicClient().simulateContract({
      chain: this.walletClient().chain,
      address: this.address(),
      abi: this.abi(),
      functionName: "claim",
      args: [
        channelId, payment, signature
      ],
      account: this.walletClient().account,
      value: options?.value,
    })
    const txId = await this.walletClient().writeContract(request)
  
    const receipt = await this.publicClient().waitForTransactionReceipt({
      hash: txId,
      confirmations: 3,
      timeout: 45_000,
    })
  
    return receipt
  }
  
  async deposit(channelId: `0x${string}`, options?: TxOptions): Promise<TransactionReceipt>{
    const { request } = await this.publicClient().simulateContract({
      chain: this.walletClient().chain,
      address: this.address(),
      abi: this.abi(),
      functionName: "deposit",
      args: [
        channelId
      ],
      account: this.walletClient().account,
      value: options?.value,
    })
    const txId = await this.walletClient().writeContract(request)
  
    const receipt = await this.publicClient().waitForTransactionReceipt({
      hash: txId,
      confirmations: 3,
      timeout: 45_000,
    })
  
    return receipt
  }
  
  async open(channelId: `0x${string}`, receiver: `0x${string}`, settlingPeriod: bigint, options?: TxOptions): Promise<TransactionReceipt>{
    const { request } = await this.publicClient().simulateContract({
      chain: this.walletClient().chain,
      address: this.address(),
      abi: this.abi(),
      functionName: "open",
      args: [
        channelId, receiver, settlingPeriod
      ],
      account: this.walletClient().account,
      value: options?.value,
    })
    const txId = await this.walletClient().writeContract(request)
  
    const receipt = await this.publicClient().waitForTransactionReceipt({
      hash: txId,
      confirmations: 3,
      timeout: 45_000,
    })
  
    return receipt
  }
  
  async settle(channelId: `0x${string}`, options?: TxOptions): Promise<TransactionReceipt>{
    const { request } = await this.publicClient().simulateContract({
      chain: this.walletClient().chain,
      address: this.address(),
      abi: this.abi(),
      functionName: "settle",
      args: [
        channelId
      ],
      account: this.walletClient().account,
      value: options?.value,
    })
    const txId = await this.walletClient().writeContract(request)
  
    const receipt = await this.publicClient().waitForTransactionReceipt({
      hash: txId,
      confirmations: 3,
      timeout: 45_000,
    })
  
    return receipt
  }
  
  async startSettling(channelId: `0x${string}`, options?: TxOptions): Promise<TransactionReceipt>{
    const { request } = await this.publicClient().simulateContract({
      chain: this.walletClient().chain,
      address: this.address(),
      abi: this.abi(),
      functionName: "startSettling",
      args: [
        channelId
      ],
      account: this.walletClient().account,
      value: options?.value,
    })
    const txId = await this.walletClient().writeContract(request)
  
    const receipt = await this.publicClient().waitForTransactionReceipt({
      hash: txId,
      confirmations: 3,
      timeout: 45_000,
    })
  
    return receipt
  }
  

  isDidClaimEvent (something: AbiEvent): boolean {
    return something.name === "DidClaim"
  }
  isDidDepositEvent (something: AbiEvent): boolean {
    return something.name === "DidDeposit"
  }
  isDidOpenEvent (something: AbiEvent): boolean {
    return something.name === "DidOpen"
  }
  isDidSettleEvent (something: AbiEvent): boolean {
    return something.name === "DidSettle"
  }
  isDidStartSettlingEvent (something: AbiEvent): boolean {
    return something.name === "DidStartSettling"
  }
  isdebug1Event (something: AbiEvent): boolean {
    return something.name === "debug1"
  }
}
