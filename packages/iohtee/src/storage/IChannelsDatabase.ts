import { PaymentChannel } from '../PaymentChannel'

export default interface IChannelsDatabase {
  save(paymentChannel: PaymentChannel): Promise<void>
  saveOrUpdate(paymentChannel: PaymentChannel): Promise<void>
  deposit(channelId: `0x${string}`, value: bigint): Promise<void>
  firstById(channelId: `0x${string}`): Promise<PaymentChannel | null>
  spend(channelId: `0x${string}`, spent: bigint): Promise<void>
  all(): Promise<Array<PaymentChannel>>
  allOpen(): Promise<PaymentChannel[]>
  allSettling(): Promise<PaymentChannel[]>
  findUsable(
    sender: `0x${string}`,
    receiver: `0x${string}`,
    amount: bigint,
  ): Promise<PaymentChannel | null>
  findBySenderReceiver(
    sender: `0x${string}`,
    receiver: `0x${string}`,
  ): Promise<Array<PaymentChannel>>
  findBySenderReceiverChannelId(
    sender: `0x${string}`,
    receiver: `0x${string}`,
    channelId: `0x${string}`,
  ): Promise<PaymentChannel | null>
  updateState(channelId: `0x${string}`, state: number): Promise<void>
  updateSettlingUntil(
    channelId: `0x${string}`,
    settlingUntil: bigint,
  ): Promise<void>
}
