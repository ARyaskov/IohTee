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
} from 'viem'
import { mnemonicToAccount } from 'viem/accounts'
import * as chains from 'viem/chains'
import {
  Contract,
  HDNodeWallet,
  JsonRpcProvider,
  Wallet,
  type InterfaceAbi,
  type Signer,
} from 'ethers'

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

export type CtorAccountParamEthers = CtorBaseParams & {
  providerEthers: JsonRpcProvider
  signerEthers: Signer
}

export type CtorParams = CtorAccountParamPure | CtorAccountParamViem
export type CtorParamsViem = CtorParams
export type CtorParamsEthers = CtorAccountParamPure | CtorAccountParamEthers

export function isCtorAccountParamPure(
  params: CtorBaseParams,
): params is CtorAccountParamPure {
  return (
    (params as CtorAccountParamPure).httpRpcUrl !== undefined &&
    (params as CtorAccountParamPure).mnemonic !== undefined
  )
}

export function isCtorAccountParamViem(
  params: CtorBaseParams,
): params is CtorAccountParamViem {
  return (
    (params as CtorAccountParamViem).publicClientViem !== undefined &&
    (params as CtorAccountParamViem).walletClientViem !== undefined
  )
}

export function isCtorAccountParamEthers(
  params: CtorBaseParams,
): params is CtorAccountParamEthers {
  return (
    (params as CtorAccountParamEthers).providerEthers !== undefined &&
    (params as CtorAccountParamEthers).signerEthers !== undefined
  )
}

function findChainById(networkId: number) {
  return Object.values(chains).find(
    (value) =>
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      (value as { id?: number }).id === networkId,
  ) as any
}

export class BaseContractViem {
  private readonly _publicClient: any
  private readonly _walletClient: any
  private readonly _address: `0x${string}`
  private readonly _contract: GetContractReturnType
  private readonly _abi: Abi

  constructor(
    deployedContractAddress: `0x${string}`,
    params: CtorParamsViem,
    abi: Abi,
  ) {
    this._address = deployedContractAddress

    if (isCtorAccountParamPure(params)) {
      const chain = findChainById(params.networkId)

      this._publicClient = createPublicClient({
        batch: { multicall: true },
        chain,
        transport: http(params.httpRpcUrl, { batch: true }),
      }) as never

      this._walletClient = createWalletClient({
        chain,
        transport: http(params.httpRpcUrl, { batch: true }),
        account: mnemonicToAccount(params.mnemonic, { path: params.hdPath }),
      }) as never
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
}

export class BaseContractEthers {
  private readonly _provider: JsonRpcProvider
  private readonly _signer: Signer
  private readonly _address: `0x${string}`
  private readonly _contract: Contract
  private readonly _abi: InterfaceAbi

  constructor(
    deployedContractAddress: `0x${string}`,
    params: CtorParamsEthers,
    abi: InterfaceAbi,
  ) {
    this._address = deployedContractAddress

    if (isCtorAccountParamPure(params)) {
      this._provider = new JsonRpcProvider(params.httpRpcUrl, params.networkId)
      const hdWallet = HDNodeWallet.fromPhrase(
        params.mnemonic,
        undefined,
        params.hdPath,
      )
      this._signer = new Wallet(hdWallet.privateKey, this._provider)
    } else if (isCtorAccountParamEthers(params)) {
      this._provider = params.providerEthers
      this._signer = params.signerEthers
    } else {
      throw new Error('Invalid ctor params for ethers backend')
    }

    this._abi = abi
    this._contract = new Contract(this._address, this._abi, this._signer)
  }

  provider(): JsonRpcProvider {
    return this._provider
  }

  signer(): Signer {
    return this._signer
  }

  contract(): Contract {
    return this._contract
  }

  address(): `0x${string}` {
    return this._address
  }

  abi(): InterfaceAbi {
    return this._abi
  }

  events(): AbiEvent[] {
    return (this._abi as Abi).filter((e) => e.type === 'event') as AbiEvent[]
  }
}

export class BaseContract extends BaseContractViem {}
