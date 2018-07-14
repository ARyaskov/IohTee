import * as Web3 from 'web3'
import * as BigNumber from 'bignumber.js'
import { TransactionResult } from 'truffle-contract'
import Logger from '@machinomy/logger'
import Signature from './Signature'
import { TokenUnidirectional } from '@machinomy/contracts'
import ChannelId from './ChannelId'

const LOG = new Logger('ChannelTokenContract')

const CREATE_CHANNEL_GAS = new BigNumber.BigNumber(300000)

// FIXME MOVE TOKENS SOMEWHERE HERE
export default class ChannelTokenContract {
  contract: Promise<TokenUnidirectional.Contract>

  private web3: Web3

  constructor (web3: Web3) {
    this.web3 = web3
    this.contract = TokenUnidirectional.contract(this.web3.currentProvider).deployed()
  }

  async open (sender: string, receiver: string, price: BigNumber.BigNumber, settlementPeriod: number | BigNumber.BigNumber, tokenContract: string, channelId?: ChannelId | string): Promise<TransactionResult> {
    LOG.info(`Creating channel. Value: ${price} / Settlement: ${settlementPeriod}`)
    let _channelId = channelId || ChannelId.random()
    const deployed = await this.contract
    return deployed.open(_channelId.toString(), receiver, new BigNumber.BigNumber(settlementPeriod), tokenContract, price, {
      from: sender,
      value: price,
      gas: CREATE_CHANNEL_GAS
    })
  }

  async claim (receiver: string, channelId: string, value: BigNumber.BigNumber, signature: Signature): Promise<TransactionResult> {
    LOG.info(`Claiming channel with id ${channelId} on behalf of receiver ${receiver}`)
    LOG.info(`Values: ${value} / Signature: ${signature.toString()}`)
    const deployed = await this.contract
    return deployed.claim(channelId, value, signature.toString(), { from: receiver })
  }

  async deposit (sender: string, channelId: string, value: BigNumber.BigNumber): Promise<TransactionResult> {
    LOG.info(`Depositing ${value} into channel ${channelId}`)
    const deployed = await this.contract
    return deployed.deposit(channelId, value, {
      from: sender,
      value: value,
      gas: CREATE_CHANNEL_GAS
    })
  }

  async getState (channelId: string): Promise<number> {
    LOG.info(`Fetching state for channel ${channelId}`)
    const deployed = await this.contract
    const isOpen = await deployed.isOpen(channelId)
    const isSettling = await deployed.isSettling(channelId)

    if (isOpen) {
      return 0
    }

    if (isSettling) {
      return 1
    }

    return 2
  }

  async getSettlementPeriod (channelId: string): Promise<BigNumber.BigNumber> {
    LOG.info(`Fetching settlement period for channel ${channelId}`)
    const deployed = await this.contract
    const exists = await deployed.isPresent(channelId)

    if (!exists) {
      throw new Error(`Cannot fetch settlement period for non-existent channel ${channelId}.`)
    }

    const chan = await deployed.channels(channelId)
    return chan[3]
  }

  async startSettle (account: string, channelId: string): Promise<TransactionResult> {
    LOG.info(`Starting settle for account ${account} and channel id ${channelId}.`)
    const deployed = await this.contract
    return deployed.startSettling(channelId, { from: account })
  }

  async finishSettle (account: string, channelId: string): Promise<TransactionResult> {
    LOG.info(`Finishing settle for account ${account} and channel ID ${channelId}.`)
    const deployed = await this.contract
    return deployed.settle(channelId, { from: account, gas: 400000 })
  }

  async paymentDigest (channelId: string, value: BigNumber.BigNumber, tokenContract: string): Promise<string> {
    const deployed = await this.contract
    return deployed.paymentDigest(channelId, value, tokenContract)
  }

  async canClaim (channelId: string, payment: BigNumber.BigNumber, receiver: string, signature: Signature): Promise<boolean> {
    const deployed = await this.contract
    return deployed.canClaim(channelId, payment, receiver, signature.toString())
  }

  async channelById (channelId: string): Promise<[string, string, BigNumber.BigNumber, BigNumber.BigNumber, BigNumber.BigNumber, string]> {
    const deployed = await this.contract
    return deployed.channels(channelId)
  }
}
