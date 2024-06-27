import ChainManager from './ChainManager'
import { PaymentChannel } from './PaymentChannel'
import Payment from './payment'
import ChannelContract from './ChannelContract'
import IohTeeOptions from './IohTeeOptions'
import PaymentValidation from './PaymentValidation'

export default class PaymentManager {
  private chainManager: ChainManager

  private channelContract: ChannelContract

  private options: IohTeeOptions

  constructor(
    chainManager: ChainManager,
    channelContract: ChannelContract,
    options: IohTeeOptions,
  ) {
    this.chainManager = chainManager
    this.channelContract = channelContract
    this.options = options
  }

  async buildPaymentForChannel(
    channel: PaymentChannel,
    price: bigint,
    totalValue: bigint,
    meta: string,
  ): Promise<Payment> {
    const digest = await this.channelContract.paymentDigest(
      channel.channelId,
      totalValue,
    )
    const signature = await this.chainManager.sign(channel.sender, digest)

    return new Payment({
      channelId: channel.channelId,
      sender: channel.sender,
      receiver: channel.receiver,
      price,
      value: totalValue,
      channelValue: channel.value,
      signature: signature.toString() as `0x${string}`,
      meta,
      tokenContract: channel.tokenContract,
      token: undefined,
    })
  }

  async isValid(
    payment: Payment,
    paymentChannel: PaymentChannel,
  ): Promise<boolean> {
    let validation = new PaymentValidation(
      this.channelContract,
      payment,
      paymentChannel,
      this.options,
    )
    return validation.isValid()
  }
}
