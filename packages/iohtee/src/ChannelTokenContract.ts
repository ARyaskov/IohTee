import {
  Channel,
  ChannelState,
  TokenUnidirectional,
} from '@riaskov/iohtee-contracts'
import { PublicClient, TransactionReceipt, WalletClient, parseAbi } from 'viem'

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
])

export default class ChannelTokenContract {
  private readonly tokenUnidirectional: TokenUnidirectional

  constructor(
    private readonly publicClient: PublicClient,
    private readonly walletClient: WalletClient,
    private readonly contractAddress: `0x${string}`,
  ) {
    this.tokenUnidirectional = new TokenUnidirectional(contractAddress, {
      publicClientViem: publicClient as never,
      walletClientViem: walletClient as never,
    })
  }

  async openChannel(
    channelId: `0x${string}`,
    receiver: `0x${string}`,
    settlingPeriod: bigint,
    tokenContract: `0x${string}`,
    value: bigint,
  ): Promise<Channel> {
    await this.approve(tokenContract, value)
    await this.tokenUnidirectional.open(
      channelId,
      receiver,
      settlingPeriod,
      tokenContract,
      value,
    )
    return this.channel(channelId)
  }

  async claim(
    channelId: `0x${string}`,
    payment: bigint,
    signature: `0x${string}`,
  ): Promise<TransactionReceipt> {
    return this.tokenUnidirectional.claim(channelId, payment, signature)
  }

  async deposit(
    channelId: `0x${string}`,
    value: bigint,
    tokenContract: `0x${string}`,
  ): Promise<TransactionReceipt> {
    await this.approve(tokenContract, value)
    return this.tokenUnidirectional.deposit(channelId, value)
  }

  async channelState(channelId: `0x${string}`): Promise<ChannelState> {
    return this.tokenUnidirectional.channelState(channelId)
  }

  async getSettlementPeriod(channelId: `0x${string}`): Promise<bigint> {
    return this.tokenUnidirectional.getSettlementPeriod(channelId)
  }

  async startSettling(channelId: `0x${string}`): Promise<TransactionReceipt> {
    return this.tokenUnidirectional.startSettling(channelId)
  }

  async settle(channelId: `0x${string}`): Promise<TransactionReceipt> {
    return this.tokenUnidirectional.settle(channelId)
  }

  async paymentDigest(
    channelId: `0x${string}`,
    payment: bigint,
    tokenContract: `0x${string}`,
  ): Promise<`0x${string}`> {
    return this.tokenUnidirectional.paymentDigest(
      channelId,
      payment,
      tokenContract,
    )
  }

  async canClaim(
    channelId: `0x${string}`,
    payment: bigint,
    receiver: `0x${string}`,
    signature: `0x${string}`,
  ): Promise<boolean> {
    return this.tokenUnidirectional.canClaim(
      channelId,
      payment,
      receiver,
      signature,
    )
  }

  async channel(channelId: `0x${string}`): Promise<Channel> {
    const channel = await this.tokenUnidirectional.channel(channelId)

    return {
      channelId,
      sender: channel.sender,
      receiver: channel.receiver,
      value: channel.value,
      settlingPeriod: channel.settlingPeriod,
      settlingUntil: channel.settlingUntil,
    }
  }

  private async approve(
    tokenContract: `0x${string}`,
    amount: bigint,
  ): Promise<TransactionReceipt> {
    const { request } = await this.publicClient.simulateContract({
      chain: this.walletClient.chain,
      address: tokenContract,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [this.contractAddress, amount],
      account: this.walletClient.account,
    })
    const hash = await this.walletClient.writeContract(request)
    return this.publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
      timeout: 45_000,
    })
  }
}
