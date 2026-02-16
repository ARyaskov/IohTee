import { Channel, ChannelState, DefaultUnidirectionalAddress } from './common'
import {
  CtorParams,
  DidOpen,
  isCtorAccountParamPure,
  TxOptions,
  UnidirectionalContract,
  UnidirectionalEventName,
} from './abi-wrapper/UnidirectionalContract'

export class Unidirectional extends UnidirectionalContract {
  constructor(
    deployedContractAddress: `0x${string}` | null,
    params: CtorParams,
  ) {
    const resolvedAddress = (() => {
      if (deployedContractAddress) {
        return deployedContractAddress
      }

      if (isCtorAccountParamPure(params)) {
        const address = DefaultUnidirectionalAddress[params.networkId]
        if (!address) {
          throw new Error(
            `No default Unidirectional address for networkId=${params.networkId}`,
          )
        }
        return address
      }

      const chainId = params.publicClientViem.chain?.id
      if (!chainId) {
        throw new Error('publicClientViem.chain.id is required')
      }
      const address = DefaultUnidirectionalAddress[chainId]
      if (!address) {
        throw new Error(
          `No default Unidirectional address for chainId=${chainId}`,
        )
      }
      return address
    })()

    super(resolvedAddress, params)
  }
  async channel(channelId: `0x${string}`): Promise<Channel> {
    const readResult = await super.channels(channelId)

    return {
      channelId,
      sender: readResult[0],
      receiver: readResult[1],
      value: readResult[2],
      settlingPeriod: readResult[3],
      settlingUntil: readResult[4],
    }
  }

  async channelState(channelId: `0x${string}`): Promise<ChannelState> {
    const channel = await this.channel(channelId)
    const settlingPeriod = channel.settlingPeriod
    const settlingUntil = channel.settlingUntil
    if (settlingPeriod > 0n && settlingUntil > 0n) {
      return ChannelState.Settling
    }
    if (settlingPeriod > 0n && settlingUntil === 0n) {
      return ChannelState.Open
    }
    return ChannelState.Settled
  }

  async openChannel(
    channelId: `0x${string}`,
    receiver: `0x${string}`,
    settlingPeriod: bigint,
    options: TxOptions,
  ): Promise<Channel> {
    const receipt = await super.open(
      channelId,
      receiver,
      settlingPeriod,
      options,
    )

    if (
      !UnidirectionalContract.hasEvent(receipt, UnidirectionalEventName.DidOpen)
    ) {
      throw new Error(`Unidirectional#open(): cannot open channel`)
    }

    const didOpenEvent =
      UnidirectionalContract.extractEventFromReceipt<DidOpen>(
        receipt,
        UnidirectionalEventName.DidOpen,
      )

    if (!didOpenEvent) {
      throw new Error(
        `Unidirectional#open(): DidOpen event not found in tx logs`,
      )
    }

    return {
      channelId: didOpenEvent.args.channelId,
      sender: didOpenEvent.args.sender,
      receiver: didOpenEvent.args.receiver,
      value: didOpenEvent.args.value,
      settlingPeriod: -1n,
      settlingUntil: -1n,
    }
  }

  async getSettlementPeriod(channelId: `0x${string}`): Promise<bigint> {
    return (await this.channel(channelId)).settlingPeriod
  }
}
