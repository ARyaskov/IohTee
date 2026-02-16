import { PublicClient, WalletClient, TransactionReceipt, parseAbi } from 'viem'
import { Channel, ChannelState } from './common'

const TOKEN_UNIDIRECTIONAL_ABI = parseAbi([
  'function canClaim(bytes32 channelId, uint256 payment, address origin, bytes signature) view returns (bool)',
  'function channels(bytes32 channelId) view returns (address sender, address receiver, uint256 value, uint256 settlingPeriod, uint256 settlingUntil, address tokenContract)',
  'function claim(bytes32 channelId, uint256 payment, bytes signature)',
  'function deposit(bytes32 channelId, uint256 value)',
  'function isAbsent(bytes32 channelId) view returns (bool)',
  'function isSettling(bytes32 channelId) view returns (bool)',
  'function open(bytes32 channelId, address receiver, uint256 settlingPeriod, address tokenContract, uint256 value)',
  'function paymentDigest(bytes32 channelId, uint256 payment, address tokenContract) view returns (bytes32)',
  'function settle(bytes32 channelId)',
  'function startSettling(bytes32 channelId)',
])

export interface TokenUnidirectionalCtorParams {
  publicClientViem: PublicClient
  walletClientViem: WalletClient
}

export class TokenUnidirectional {
  private readonly publicClient: PublicClient
  private readonly walletClient: WalletClient
  private readonly deployedContractAddress: `0x${string}`

  constructor(
    deployedContractAddress: `0x${string}`,
    params: TokenUnidirectionalCtorParams,
  ) {
    this.deployedContractAddress = deployedContractAddress
    this.publicClient = params.publicClientViem
    this.walletClient = params.walletClientViem
  }

  async channel(
    channelId: `0x${string}`,
  ): Promise<Channel & { tokenContract: `0x${string}` }> {
    const row = (await this.publicClient.readContract({
      address: this.deployedContractAddress,
      abi: TOKEN_UNIDIRECTIONAL_ABI,
      functionName: 'channels',
      args: [channelId],
    })) as readonly [
      `0x${string}`,
      `0x${string}`,
      bigint,
      bigint,
      bigint,
      `0x${string}`,
    ]

    return {
      channelId,
      sender: row[0],
      receiver: row[1],
      value: row[2],
      settlingPeriod: row[3],
      settlingUntil: row[4],
      tokenContract: row[5],
    }
  }

  async channelState(channelId: `0x${string}`): Promise<ChannelState> {
    const isAbsent = (await this.publicClient.readContract({
      address: this.deployedContractAddress,
      abi: TOKEN_UNIDIRECTIONAL_ABI,
      functionName: 'isAbsent',
      args: [channelId],
    })) as boolean

    if (isAbsent) {
      return ChannelState.Impossible
    }

    const isSettling = (await this.publicClient.readContract({
      address: this.deployedContractAddress,
      abi: TOKEN_UNIDIRECTIONAL_ABI,
      functionName: 'isSettling',
      args: [channelId],
    })) as boolean

    if (isSettling) {
      return ChannelState.Settling
    }

    return ChannelState.Open
  }

  async getSettlementPeriod(channelId: `0x${string}`): Promise<bigint> {
    return (await this.channel(channelId)).settlingPeriod
  }

  async open(
    channelId: `0x${string}`,
    receiver: `0x${string}`,
    settlingPeriod: bigint,
    tokenContract: `0x${string}`,
    value: bigint,
  ): Promise<TransactionReceipt> {
    return this.sendWrite('open', [
      channelId,
      receiver,
      settlingPeriod,
      tokenContract,
      value,
    ])
  }

  async deposit(
    channelId: `0x${string}`,
    value: bigint,
  ): Promise<TransactionReceipt> {
    return this.sendWrite('deposit', [channelId, value])
  }

  async claim(
    channelId: `0x${string}`,
    payment: bigint,
    signature: `0x${string}`,
  ): Promise<TransactionReceipt> {
    return this.sendWrite('claim', [channelId, payment, signature])
  }

  async startSettling(channelId: `0x${string}`): Promise<TransactionReceipt> {
    return this.sendWrite('startSettling', [channelId])
  }

  async settle(channelId: `0x${string}`): Promise<TransactionReceipt> {
    return this.sendWrite('settle', [channelId])
  }

  async paymentDigest(
    channelId: `0x${string}`,
    payment: bigint,
    tokenContract: `0x${string}`,
  ): Promise<`0x${string}`> {
    return (await this.publicClient.readContract({
      address: this.deployedContractAddress,
      abi: TOKEN_UNIDIRECTIONAL_ABI,
      functionName: 'paymentDigest',
      args: [channelId, payment, tokenContract],
    })) as `0x${string}`
  }

  async canClaim(
    channelId: `0x${string}`,
    payment: bigint,
    origin: `0x${string}`,
    signature: `0x${string}`,
  ): Promise<boolean> {
    try {
      return (await this.publicClient.readContract({
        address: this.deployedContractAddress,
        abi: TOKEN_UNIDIRECTIONAL_ABI,
        functionName: 'canClaim',
        args: [channelId, payment, origin, signature],
      })) as boolean
    } catch {
      return false
    }
  }

  private async sendWrite(
    functionName: 'open' | 'claim' | 'deposit' | 'startSettling' | 'settle',
    args: readonly unknown[],
  ): Promise<TransactionReceipt> {
    const { request } = await this.publicClient.simulateContract({
      chain: this.walletClient.chain,
      address: this.deployedContractAddress,
      abi: TOKEN_UNIDIRECTIONAL_ABI,
      functionName: functionName as never,
      args: args as never,
      account: this.walletClient.account,
    })

    const txId = await this.walletClient.writeContract(request)

    return this.publicClient.waitForTransactionReceipt({
      hash: txId,
      confirmations: 3,
      timeout: 45_000,
    })
  }
}
