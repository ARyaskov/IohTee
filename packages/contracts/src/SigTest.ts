import {
  Abi,
  createPublicClient,
  createWalletClient,
  getContract,
  http,
  PublicClient,
  WalletClient,
  extractChain,
} from 'viem'
import { GetContractReturnType } from '@nomicfoundation/hardhat-viem/types'
import { mnemonicToAccount } from 'viem/accounts'
import { Contract, HDNodeWallet, JsonRpcProvider, Wallet } from 'ethers'
import { DefaultUnidirectionalAddress } from './common'
import * as chains from 'viem/chains'

// require used intentionally here, suddenly json import is not working with TS 5.5 even with resolveJsonModule: true
const uniArtifact = require('../abi/SigTest.json')

export type CtorBaseParams = {
  networkId: number
  deployedContractAddress?: `0x${string}`
  cachePeriod?: number
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

export class SigTest {
  private readonly _address: `0x${string}`
  private readonly _publicClient: PublicClient
  private readonly _walletClient: WalletClient
  private readonly _contract: GetContractReturnType
  private readonly _abi: any
  private readonly _ethersProvider: JsonRpcProvider | null = null
  private readonly _ethersWallet: Wallet | null = null
  private readonly _ethersContract: Contract | null = null

  constructor(params: CtorParams) {
    if (!params.deployedContractAddress) {
      this._address = DefaultUnidirectionalAddress[params.networkId]
    } else {
      this._address = params.deployedContractAddress
    }

    if (isCtorAccountParamPure(params)) {
      // @ts-ignore
      this._publicClient = createPublicClient({
        batch: {
          multicall: true,
        },
        chain: extractChain({
          chains: Object.values(chains) as any,
          id: params.networkId,
        }),
        transport: http(params.httpRpcUrl, { batch: true }),
      })
      this._walletClient = createWalletClient({
        chain: extractChain({
          chains: Object.values(chains) as any,
          id: params.networkId,
        }),
        transport: http(params.httpRpcUrl, { batch: true }),
        account: mnemonicToAccount(params.mnemonic),
      })
      this._ethersProvider = new JsonRpcProvider(params.httpRpcUrl, 80002)

      this._ethersWallet = new Wallet(
        HDNodeWallet.fromPhrase(params.mnemonic).address,
        this._ethersProvider,
      )
      this._ethersContract = new Contract(
        this._address,
        uniArtifact.abi,
        this._ethersWallet,
      )
    } else {
      this._publicClient = params.publicClient
      this._walletClient = params.walletClient

      this._ethersProvider = new JsonRpcProvider(
        this._walletClient.transport.url,
      )
      this._ethersWallet = new Wallet(
        Buffer.from(
          mnemonicToAccount(params.mnemonic).getHdKey().privateKey!,
        ).toString('hex'),
        this._ethersProvider,
      )
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

  async testSig(
    channelId: `0x${string}`,
    payment: bigint,
    signature: `0x${string}`,
  ): Promise<any> {
    let result = (await this._publicClient.readContract({
      address: this._address,
      abi: this.abi(),
      functionName: 'testSig',
      args: [channelId, payment, signature],
    })) as never as `0x${string}`
    return result
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
}
