import { Channel, ChannelState, DefaultUnidirectionalAddress } from './common'
import {
  CtorParams, DidOpen,
  isCtorAccountParamPure,
  TxOptions,
  UnidirectionalContract,
  UnidirectionalEventName,
} from './abi-wrapper/UnidirectionalContract'
import { any } from 'hardhat/internal/core/params/argumentTypes'

export class Unidirectional extends UnidirectionalContract {
  constructor(
    deployedContractAddress: `0x${string}` | null,
    params: CtorParams,
  ) {
    if (isCtorAccountParamPure(params)) {
      super(
        !deployedContractAddress
          ? DefaultUnidirectionalAddress[params.networkId]
          : deployedContractAddress,
        params,
      )
    } else {
      super(
        !deployedContractAddress
          ? DefaultUnidirectionalAddress[params.publicClientViem.chain!.id]
          : deployedContractAddress,
        params,
      )
    }
  }
  async channel(channelId: `0x${string}`): Promise<Channel> {
    const readResult: any = await super.channels(channelId)

    return {
      channelId,
      sender: readResult[0] as never as `0x${string}`,
      receiver: readResult[1] as never as `0x${string}`,
      value: readResult[2] as never as bigint,
      settlingPeriod: readResult[3] as never as bigint,
      settlingUntil: readResult[4] as never as bigint,
    }
  }

  async channelState(channelId: `0x${string}`): Promise<ChannelState> {
    const channel = await this.channel(channelId)
    if (channel) {
      const settlingPeriod = channel.settlingPeriod
      const settlingUntil = channel.settlingUntil
      if (settlingPeriod > 0 && settlingUntil > 0) {
        return ChannelState.Settling
      } else if (settlingPeriod > 0 && settlingUntil === BigInt(0)) {
        return ChannelState.Open
      } else {
        return ChannelState.Settled
      }
    } else {
      return ChannelState.Settled
    }
  }

  async openChannel(
    channelId: `0x${string}`,
    receiver: `0x${string}`,
    settlingPeriod: bigint,
    options: TxOptions,
  ): Promise<Channel> {
    let result
    const receipt = await super.open(
      channelId,
      receiver,
      settlingPeriod,
      options,
    )
    console.log(receipt)
    if (
      !UnidirectionalContract.hasEvent(receipt, UnidirectionalEventName.DidOpen)
    ) {
      throw new Error(`Unidirectional#open(): Can not open channel`)
    } else {
      const didOpenEvent = UnidirectionalContract.extractEventFromReceipt<DidOpen>(
        receipt,
        UnidirectionalEventName.DidOpen,
      )
      console.log(didOpenEvent)
      if (!didOpenEvent) {
        throw new Error(
          `Unidirectional#open(): Can not find DidOpen event in tx logs`,
        )
      } else {
        result = {
          channelId: didOpenEvent.args.channelId,
          sender: didOpenEvent.args.sender,
          receiver: didOpenEvent.args.receiver,
          value: didOpenEvent.args.value
        }
      }
    }
    return result
  }

  async getSettlementPeriod(channelId: `0x${string}`): Promise<bigint> {
    return (await this.channel(channelId)).settlingPeriod
  }
}
