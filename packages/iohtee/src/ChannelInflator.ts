import { PaymentChannel, PaymentChannelJSON } from './PaymentChannel'
import { Unidirectional, ChannelState } from '@riaskov/iohtee-contracts'
import ChannelTokenContract from './ChannelTokenContract'

export default class ChannelInflator {
  channelEthContract: Unidirectional
  channelTokenContract: ChannelTokenContract | null

  constructor(
    channelEthContract: Unidirectional,
    channelTokenContract: ChannelTokenContract | null,
  ) {
    this.channelEthContract = channelEthContract
    this.channelTokenContract = channelTokenContract
  }

  static isTokenContractDefined(tokenContract: string | undefined): boolean {
    // tslint:disable-next-line:strict-type-predicates
    return (
      tokenContract !== undefined &&
      tokenContract !== null &&
      tokenContract.startsWith('0x') &&
      parseInt(tokenContract, 16) !== 0
    )
  }

  async inflate(
    paymentChannelJSON: PaymentChannelJSON,
  ): Promise<PaymentChannel | null> {
    const tokenContract = paymentChannelJSON.tokenContract
    const channelId = paymentChannelJSON.channelId
    const contract = this.actualContract(tokenContract)
    const state = await contract.channelState(channelId)
    const channel = await contract.channel(channelId)
    if (channel) {
      const value = channel.value
      const settlingUntil = BigInt(channel.settlingUntil)

      return new PaymentChannel(
        paymentChannelJSON.sender,
        paymentChannelJSON.receiver,
        paymentChannelJSON.channelId,
        value,
        paymentChannelJSON.spent,
        state === ChannelState.Impossible ? ChannelState.Settled : state,
        paymentChannelJSON.tokenContract,
        paymentChannelJSON.settlementPeriod,
        settlingUntil,
      )
    } else {
      return null
    }
  }

  actualContract(
    tokenContract?: string,
  ): Unidirectional | ChannelTokenContract {
    if (ChannelInflator.isTokenContractDefined(tokenContract)) {
      if (!this.channelTokenContract) {
        throw new Error(
          'TokenUnidirectional contract is not configured. Set options.tokenUnidirectionalAddress.',
        )
      }
      return this.channelTokenContract
    } else {
      return this.channelEthContract
    }
  }
}
