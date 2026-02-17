import { Channel, ChannelState } from './common'
import {
  CtorParams,
  TokenUnidirectionalUpgradeableContract,
} from './abi-wrapper/TokenUnidirectionalUpgradeableContract'

export class TokenUnidirectional extends TokenUnidirectionalUpgradeableContract {
  constructor(deployedContractAddress: `0x${string}`, params: CtorParams) {
    super(deployedContractAddress, params)
  }

  async channel(
    channelId: `0x${string}`,
  ): Promise<Channel & { tokenContract: `0x${string}` }> {
    const readResult = await super.channels(channelId)

    return {
      channelId,
      sender: readResult[0],
      receiver: readResult[1],
      value: readResult[2],
      settlingPeriod: readResult[3],
      settlingUntil: readResult[4],
      tokenContract: readResult[5],
    }
  }

  async channelState(channelId: `0x${string}`): Promise<ChannelState> {
    if (await super.isAbsent(channelId)) {
      return ChannelState.Impossible
    }

    if (await super.isSettling(channelId)) {
      return ChannelState.Settling
    }

    return ChannelState.Open
  }

  async getSettlementPeriod(channelId: `0x${string}`): Promise<bigint> {
    return (await this.channel(channelId)).settlingPeriod
  }
}
