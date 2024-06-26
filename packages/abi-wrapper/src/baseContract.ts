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
  extractChain,
} from 'viem'
import { mnemonicToAccount } from 'viem/accounts'
import * as chains from 'viem/chains'

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

export class BaseContract {
  private readonly _publicClient: PublicClient
  private readonly _walletClient: WalletClient
  private readonly _address: `0x${string}`
  private readonly _contract: GetContractReturnType
  private readonly _abi: any

  constructor(
    deployedContractAddress: `0x${string}`,
    params: CtorParams,
    abi?: any,
  ) {
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
        transport: http(params.httpRpcUrl, {
          batch: true,
        }),
      })
      this._walletClient = createWalletClient({
        // @ts-ignore
        chain: network as any,
        transport: http(params.httpRpcUrl, {
          batch: true,
        }),
        account: mnemonicToAccount(params.mnemonic, { path: params.hdPath }),
      })
    } else {
      this._publicClient = params.publicClientViem
      this._walletClient = params.walletClientViem
    }

    this._abi = abi!

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
}
