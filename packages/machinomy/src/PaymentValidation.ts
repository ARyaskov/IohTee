import { PaymentChannel } from './PaymentChannel'
import Payment from './payment'
import Logger from '@machinomy/logger'
import ChannelContract from './ChannelContract'
import ChannelManager from './ChannelManager'
import MachinomyOptions from './MachinomyOptions'

const LOG = new Logger('payment-validation')

function error(message: string, ...args: Array<any>) {
  LOG.error(`Payment is invalid: ${message}`, args)
}

export default class PaymentValidation {
  private readonly payment: Payment
  private readonly paymentChannel: PaymentChannel
  private readonly channelContract: ChannelContract
  private readonly options: MachinomyOptions

  constructor(
    channelContract: ChannelContract,
    payment: Payment,
    paymentChannel: PaymentChannel,
    options: MachinomyOptions,
  ) {
    this.payment = payment
    this.paymentChannel = paymentChannel
    this.channelContract = channelContract
    this.options = options
  }

  async isValid(): Promise<boolean> {
    const conditions = await Promise.all([
      this.isValidChannelValue(),
      this.isValidChannelId(),
      this.isValidPaymentValue(),
      this.isValidSender(),
      this.isPositive(),
      this.canClaim(),
      this.isAboveMinSettlementPeriod(),
    ])
    return conditions.every((a) => a)
  }

  private async isValidChannelValue(): Promise<boolean> {
    const isValidChannelValue =
      this.paymentChannel.value === this.payment.channelValue

    if (!isValidChannelValue) {
      error(
        `Payment value does not match payment channel value. payment channel value: ${this.paymentChannel.value}, payment: %o`,
        this.payment,
      )
    }
    return isValidChannelValue
  }

  private async isValidChannelId(): Promise<boolean> {
    const isValidChannelId =
      this.paymentChannel.channelId === this.payment.channelId
    if (!isValidChannelId) {
      error(
        `Channel Id does not match. expected: ${this.paymentChannel.channelId}, payment: %o`,
        this.payment,
      )
    }
    return isValidChannelId
  }

  private async isValidPaymentValue(): Promise<boolean> {
    const isValidPaymentValue = this.payment.value <= this.payment.channelValue
    if (!isValidPaymentValue) {
      error(
        `Payment value exceeds the channel value. Channel value: ${this.paymentChannel.value}, payment: %o`,
        this.payment,
      )
    }
    return isValidPaymentValue
  }

  private async isValidSender(): Promise<boolean> {
    const isValidSender = this.paymentChannel.sender === this.payment.sender
    if (!isValidSender) {
      error(
        `Sender does not match. Channel sender: ${this.paymentChannel.sender}, payment: %o`,
        this.payment,
      )
    }
    return isValidSender
  }

  private async isPositive(): Promise<boolean> {
    const isPositive = this.payment.value >= 0 && this.payment.price >= 0
    if (!isPositive) {
      error(
        `payment is invalid because the price or value is negative. payment: %o`,
        this.payment,
      )
    }
    return isPositive
  }

  private async canClaim(): Promise<boolean> {
    const p = this.payment
    const canClaim = await this.channelContract.canClaim(p)
    if (!canClaim) {
      error(`Channel contract cannot accept the claim. Payment: %o`, p)
    }
    return canClaim
  }

  private async isAboveMinSettlementPeriod(): Promise<boolean> {
    let settlementPeriod = await this.channelContract.getSettlementPeriod(
      this.payment.channelId,
    )
    const minSettlementPeriod = BigInt(
      this.options.minimumSettlementPeriod ||
        ChannelManager.DEFAULT_SETTLEMENT_PERIOD,
    )
    const isAboveMinSettlementPeriod = minSettlementPeriod <= settlementPeriod
    if (!isAboveMinSettlementPeriod) {
      LOG.warn(
        `Settlement period for channel ${this.payment.channelId} is not ok: ${settlementPeriod} while min is ${minSettlementPeriod}`,
      )
      error(
        `Settlement period is too short. settlement period: ${settlementPeriod}, minimum: ${minSettlementPeriod}. payment: %o`,
        this.payment,
      )
    } else {
      LOG.info(
        `Settlement period for channel ${this.payment.channelId} is ok: ${settlementPeriod}`,
      )
    }
    return isAboveMinSettlementPeriod
  }
}
