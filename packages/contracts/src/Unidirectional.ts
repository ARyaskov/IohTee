import {
  Abi,
  AbiEvent,
  createPublicClient,
  createWalletClient,
  getContract,
  http,
  parseEventLogs,
  PublicClient,
  WalletClient,
  WriteContractReturnType,
} from 'viem'
import { GetContractReturnType } from '@nomicfoundation/hardhat-viem/types'
import MemoryCache from './caching/MemoryCache'
import { mnemonicToAccount } from 'viem/accounts'
import {
  AbstractProvider,
  Contract,
  ethers,
  getDefaultProvider,
  HDNodeWallet,
  JsonRpcProvider,
  Wallet,
} from 'ethers'
import {
  Channel,
  ChannelState,
  DefaultUnidirectionalAddress,
  Event,
  extractEventFromLogs,
  hasEvent,
  NetworkType,
  UnidirectionalEventName,
} from './common'

// require used intentionally here, suddenly json import is not working with TS 5.5 even with resolveJsonModule: true
const uniArtifact = require('../abi/Unidirectional.json')

export type CtorBaseParams = {
  network: NetworkType
  deployedContractAddress?: `0x${string}`
  cachePeriod?: number
  hdPath: `m/44'/60'/${string}`
}

export type CtorAccountParamPure = CtorBaseParams & {
  httpRpcUrl: string
  mnemonic: string
}

export type CtorAccountParamViem = CtorBaseParams & {
  publicClient: PublicClient
  walletClient: WalletClient
  mnemonic: string
}

function isCtorAccountParamPure(
  params: CtorBaseParams,
): params is CtorAccountParamPure {
  return (
    (params as CtorAccountParamPure).httpRpcUrl !== undefined &&
    (params as CtorAccountParamPure).mnemonic !== undefined
  )
}

export type CtorParams = CtorAccountParamPure | CtorAccountParamViem

export class Unidirectional {
  private readonly _address: `0x${string}`
  private readonly _publicClient: PublicClient
  private readonly _walletClient: WalletClient
  private readonly _contract: GetContractReturnType
  private readonly _abi: any
  private readonly _ethersProvider: AbstractProvider | null = null
  private readonly _ethersWallet: Wallet | null = null
  private readonly _ethersContract: Contract | null = null
  private readonly cache: MemoryCache<Object>

  constructor(params: CtorParams) {
    this.cache = new MemoryCache(1000) // 1 sec

    if (!params.deployedContractAddress) {
      this._address = DefaultUnidirectionalAddress[params.network.name]
    } else {
      this._address = params.deployedContractAddress
    }

    const hdWallet = ethers.HDNodeWallet.fromPhrase(
      params.mnemonic,
      undefined,
      params.hdPath,
    )

    if (isCtorAccountParamPure(params)) {
      // @ts-ignore
      this._publicClient = createPublicClient({
        // batch: {
        //   multicall: true,
        // },
        chain: params.network,
        transport: http(
          params.httpRpcUrl,
          //   {
          //   batch: true,
          // }
        ),
      })
      this._walletClient = createWalletClient({
        chain: params.network,
        transport: http(
          params.httpRpcUrl,
          //   {
          //   batch: true,
          // }
        ),
        account: mnemonicToAccount(params.mnemonic, { path: params.hdPath }),
      })
      this._ethersProvider = getDefaultProvider(params.httpRpcUrl)

      this._ethersWallet = new Wallet(hdWallet.privateKey, this._ethersProvider)

      this._ethersContract = new Contract(
        this._address,
        uniArtifact.abi,
        this._ethersWallet,
      )
    } else {
      this._publicClient = params.publicClient
      this._walletClient = params.walletClient

      this._ethersProvider = getDefaultProvider(
        this._walletClient.transport.url,
      )
      this._ethersWallet = new Wallet(hdWallet.privateKey, this._ethersProvider)

      this._ethersContract = new Contract(
        this._address,
        uniArtifact.abi,
        this._ethersWallet,
      )
    }

    this._contract = getContract({
      address: this._address,
      abi: uniArtifact.abi,
      client: {
        public: this._publicClient as never,
        wallet: this._walletClient as never,
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
    // const cached = await this.cache.get(channelId)
    // if (cached) {
    //   return cached
    // } else {
    //   const deployed = await this.contract
    //
    //   const exists = await deployed.isPresent(channelId)
    //   if (!exists) return undefined
    //
    //   const instance = await deployed.channels.call(channelId)
    //   await this.cache.set(channelId, instance)
    //   return instance
    // }

    const readResult: any = await this._publicClient.readContract({
      address: this._address,
      abi: this.abi(),
      functionName: 'channels',
      args: [channelId],
    })

    return {
      channelId,
      sender: readResult[0] as never as `0x${string}`,
      receiver: readResult[1] as never as `0x${string}`,
      value: readResult[2] as never as bigint,
      settlingPeriod: readResult[3] as never as bigint,
      settlingUntil: readResult[4] as never as bigint,
    }
  }

  async channelState(channelId: `0x${string}`): Promise<ChannelState> {
    const channel = await this.channel(channelId)
    if (channel) {
      const settlingPeriod = channel.settlingPeriod
      const settlingUntil = channel.settlingUntil
      if (settlingPeriod > 0 && settlingUntil > 0) {
        return ChannelState.Settling
      } else if (settlingPeriod > 0 && settlingUntil === BigInt(0)) {
        return ChannelState.Open
      } else {
        return ChannelState.Settled
      }
    } else {
      return ChannelState.Settled
    }
  }

  async open(
    channelId: `0x${string}`,
    receiver: `0x${string}`,
    settlingPeriod: bigint,
    value: bigint,
    from?: `0x${string}`,
  ): Promise<Channel> {
    let result
    // const { request } = await this._publicClient.simulateContract({
    //   chain: this._walletClient.chain,
    //   address: this._address,
    //   abi: this.abi(),
    //   functionName: 'open',
    //   args: [channelId, receiver, settlingPeriod],
    //   account: from ?? this._walletClient.account!.address,
    //   value: value,
    // })
    // const txId = await this._walletClient.writeContract({
    //   chain: this._walletClient.chain,
    //   address: this._address,
    //   abi: this.abi(),
    //   functionName: 'open',
    //   args: [channelId, receiver, settlingPeriod],
    //   account: from ?? this._walletClient.account!.address,
    //   value: value,
    // })

    // const tx = await this._ethersContract!.populateTransaction.open(

    // )
    let txResponse = await this._ethersContract!.open(
      channelId,
      receiver,
      settlingPeriod,
      { value: value },
    )
    console.log('After open txId:', txResponse.hash)
    // try {
    //   const estimatedGas = await this._ethersProvider!.estimateGas(tx)
    //   console.log('Estimated Gas:', estimatedGas.toString())
    //
    //   const txResponse = await this._ethersWallet!.sendTransaction({
    //     ...tx,
    //     gasLimit: estimatedGas,
    //   })
    //
    //   const txReceipt = await txResponse.wait()
    //   console.log('Transaction Hash:', txResponse.hash)
    //   console.log('Transaction was mined in block:', txReceipt?.blockNumber)
    //
    //   txId = txResponse.hash
    // } catch (error) {
    //   console.error('Error simulating or sending transaction:', error)
    //   throw error
    // }
    const receipt = await this.publicClient().waitForTransactionReceipt({
      hash: txResponse.hash,
    })

    // const receipt = await getTransactionReceipt(this.publicClient() as any, {
    //   hash: txResponse.hash as never as `0x${string}`,
    // })
    console.log(receipt)
    const logs = parseEventLogs({
      abi: this.abi(),
      logs: receipt.logs,
    })
    console.log(logs)

    if (!hasEvent(logs, UnidirectionalEventName.DidOpen)) {
      throw new Error(`Unidirectional#open(): Can not open channel`)
    } else {
      const didOpenEvent = extractEventFromLogs(
        logs,
        UnidirectionalEventName.DidOpen,
      )
      if (!didOpenEvent) {
        throw new Error(
          `Unidirectional#open(): Can not find DidOpen event in even`,
        )
      } else {
        result = {
          channelId: didOpenEvent.args.channelId,
          sender: didOpenEvent.args.sender,
          receiver: didOpenEvent.args.receiver,
          value: didOpenEvent.args.value,
          settlingPeriod: didOpenEvent.args.settlingPeriod,
          settlingUntil: didOpenEvent.args.settlingUntil,
        }
      }
    }
    console.log('LOGS:')
    console.log(logs)
    return result
  }

  async deposit(
    channelId: `0x${string}`,
    value: bigint,
    from?: `0x${string}`,
  ): Promise<any> {
    let txResponse = await this._ethersContract!.deposit(channelId, {
      value: value,
    })

    return txResponse
  }

  async startSettling(
    channelId: `0x${string}`,
    from?: `0x${string}`,
  ): Promise<WriteContractReturnType> {
    let txResponse = await this._ethersContract!.startSettling(channelId)
    return txResponse
  }

  async settle(
    channelId: `0x${string}`,
    from?: `0x${string}`,
  ): Promise<WriteContractReturnType> {
    let txResponse = await this._ethersContract!.settle(channelId)
    return txResponse
  }

  async claim(
    channelId: `0x${string}`,
    payment: bigint,
    signature: `0x${string}`,
    from?: `0x${string}`,
  ): Promise<WriteContractReturnType> {
    let txResponse = await this._ethersContract!.claim(
      channelId,
      payment,
      signature,
    )
    return txResponse
  }

  async getSettlementPeriod(channelId: `0x${string}`): Promise<bigint> {
    return (await this.channel(channelId)).settlingPeriod
  }

  async isPresent(channelId: `0x${string}`): Promise<boolean> {
    return (await this._publicClient.readContract({
      address: this._address,
      abi: this.abi(),
      functionName: 'isPresent',
      args: [channelId],
    })) as never as boolean
  }

  async isAbsent(channelId: `0x${string}`): Promise<boolean> {
    return (await this._publicClient.readContract({
      address: this._address,
      abi: this.abi(),
      functionName: 'isAbsent',
      args: [channelId],
    })) as never as boolean
  }

  async isOpen(channelId: `0x${string}`): Promise<boolean> {
    return (await this._publicClient.readContract({
      address: this._address,
      abi: this.abi(),
      functionName: 'isOpen',
      args: [channelId],
    })) as never as boolean
  }

  async isSettling(channelId: `0x${string}`): Promise<boolean> {
    return (await this._publicClient.readContract({
      address: this._address,
      abi: this.abi(),
      functionName: 'isSettling',
      args: [channelId],
    })) as never as boolean
  }

  async canSettle(channelId: `0x${string}`): Promise<boolean> {
    return (await this._publicClient.readContract({
      address: this._address,
      abi: this.abi(),
      functionName: 'canSettle',
      args: [channelId],
    })) as never as boolean
  }

  async canClaim(
    channelId: `0x${string}`,
    payment: bigint,
    origin: string,
    signature: `0x${string}`,
  ): Promise<boolean> {
    // return (await this._publicClient.readContract({
    //   address: this._address,
    //   abi: this.abi(),
    //   functionName: 'canClaim',
    //   args: [channelId, payment, origin, signature],
    // })) as never as boolean

    let txResponse = await this._ethersContract!.canClaim(
      channelId,
      payment,
      origin,
      signature,
    )
    console.log('# canClaim:', txResponse)
    return txResponse
  }

  async canDeposit(channelId: `0x${string}`, origin: string): Promise<boolean> {
    return (await this._publicClient.readContract({
      address: this._address,
      abi: this.abi(),
      functionName: 'canDeposit',
      args: [channelId, origin],
    })) as never as boolean
  }

  async canStartSettling(
    channelId: `0x${string}`,
    origin: string,
  ): Promise<boolean> {
    return (await this._publicClient.readContract({
      address: this._address,
      abi: this.abi(),
      functionName: 'canStartSettling',
      args: [channelId, origin],
    })) as never as boolean
  }

  async paymentDigest(
    channelId: `0x${string}`,
    payment: bigint,
  ): Promise<`0x${string}`> {
    let result = (await this._publicClient.readContract({
      address: this._address,
      abi: this.abi(),
      functionName: 'paymentDigest',
      args: [channelId, payment],
    })) as never as `0x${string}`
    return result
  }

  async recoveryPaymentDigest(
    channelId: `0x${string}`,
    payment: bigint,
  ): Promise<`0x${string}`> {
    let result = (await this._publicClient.readContract({
      address: this._address,
      abi: this.abi(),
      functionName: 'recoveryPaymentDigest',
      args: [channelId, payment],
    })) as never as `0x${string}`
    return result
  }
}
