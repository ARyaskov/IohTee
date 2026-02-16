import Payment from './payment'
import { EventEmitter } from 'events'
import { PaymentChannel } from './PaymentChannel'
import { RemoteChannelInfo } from './RemoteChannelInfo'
import { TransactionReceipt } from 'viem'

export default interface IChannelManager extends EventEmitter {
  openChannel(
    sender: `0x${string}`,
    receiver: `0x${string}`,
    amount: bigint,
    minDepositAmount?: bigint,
    channelId?: `0x${string}`,
    tokenContract?: string,
  ): Promise<PaymentChannel>
  closeChannel(channelId: `0x${string}`): Promise<TransactionReceipt>
  deposit(channelId: `0x${string}`, value: bigint): Promise<TransactionReceipt>
  nextPayment(
    channelId: `0x${string}`,
    amount: bigint,
    meta: string,
  ): Promise<Payment>
  spendChannel(payment: Payment, token?: string): Promise<Payment>
  acceptPayment(payment: Payment): Promise<string>
  requireOpenChannel(
    sender: `0x${string}`,
    receiver: `0x${string}`,
    amount: bigint,
    minDepositAmount?: bigint,
    tokenContract?: `0x${string}`,
  ): Promise<PaymentChannel>
  channels(): Promise<PaymentChannel[]>
  openChannels(): Promise<PaymentChannel[]>
  settlingChannels(): Promise<PaymentChannel[]>
  channelById(channelId: `0x${string}`): Promise<PaymentChannel | null>
  verifyToken(token: string): Promise<boolean>
  lastPayment(channelId: `0x${string}`): Promise<Payment | null>
}
