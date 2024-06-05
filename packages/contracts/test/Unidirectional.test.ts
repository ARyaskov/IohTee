// @ts-ignore
// TODO This test suite is in progress guys
import 'dotenv/config'
import '@nomicfoundation/hardhat-viem'
import { assert } from 'chai'
import * as hre from 'hardhat'
import {
  getAddress,
  parseEther,
  parseEventLogs,
  ParseEventLogsReturnType,
  PublicClient,
  WalletClient,
} from 'viem'
import * as contracts from '../src'
import { getTransactionReceipt } from 'viem/actions'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { formatNumber } from 'humanize-plus'
import { channelId, Unidirectional, hasEvent } from '../src/index'

import { extractEventFromLogs, UnidirectionalEventName } from '../src'

describe('Unidirectional', async () => {
  const settlingPeriod = 0n

  let account0: `0x${string}`
  let account1: `0x${string}`
  let uni: Unidirectional
  let publicClient: PublicClient
  let walletClient: WalletClient
  const channelValue = parseEther('1')

  async function deployUnidirectionalFixture() {
    const [ownerWallet, otherWallet] = await hre.viem.getWalletClients()
    const deployedContract = await hre.viem.deployContract('Unidirectional')

    publicClient = await hre.viem.getPublicClient()
    walletClient = (await hre.viem.getWalletClients())[0]
    uni = new Unidirectional(
      publicClient,
      walletClient,
      deployedContract.address,
    )

    return {
      ownerWallet,
      otherWallet,
    }
  }

  async function createChannelRaw(
    channelId: `0x${string}`,
    _settlingPeriod = settlingPeriod,
  ) {
    const txId = await uni.open(channelId, account1, _settlingPeriod, {
      from: account0,
      value: channelValue,
      gas: 1_000_000,
    })

    const receipt = await getTransactionReceipt(publicClient as any, {
      hash: txId,
    })

    const logs = parseEventLogs({
      abi: uni.abi(),
      logs: receipt.logs,
    })
    return logs
  }

  async function createChannel(
    settlingPeriod?: number,
  ): Promise<ParseEventLogsReturnType> {
    const newChannelId = channelId()
    const log = await createChannelRaw(newChannelId, settlingPeriod)
    return log
  }

  beforeEach(async () => {
    const { ownerWallet, otherWallet } = await loadFixture(
      deployUnidirectionalFixture,
    )
    account0 = getAddress(ownerWallet.account.address)
    account1 = getAddress(otherWallet.account.address)
  })

  describe('Unidirectional: Open', () => {
    it('emit DidOpen event', async () => {
      let channelIdGas = contracts.channelId()
      const gas = await publicClient.estimateContractGas({
        address: uni.address(),
        abi: uni.abi(),
        functionName: 'open',
        args: [channelIdGas, account1, settlingPeriod],
        account0,
      })

      console.log(`Gas for "open" method: ${formatNumber(Number(gas))}`)

      let channelId = contracts.channelId()
      const logs = await createChannelRaw(channelId)

      assert(hasEvent(logs, UnidirectionalEventName.DidOpen))
      const didOpenEvent = extractEventFromLogs(
        logs,
        UnidirectionalEventName.DidOpen,
      )
      assert.equal(didOpenEvent.args.channelId, channelId)
      assert.equal(didOpenEvent.args.sender, account0)
      assert.equal(didOpenEvent.args.receiver, account1)
    })

    it('open channel', async () => {
      const logs = await createChannel()
      const didOpenEvent = extractEventFromLogs(
        logs,
        UnidirectionalEventName.DidOpen,
      )
      const channel = await uni.channel(didOpenEvent.args.channelId)
      assert.equal(channel.sender, account0)
      assert.equal(channel.receiver, account1)
      assert.equal(channel.value, channelValue)
      assert.equal(channel.settlingPeriod, settlingPeriod)
      assert.equal(channel.settlingUntil, 0n)

      assert.isTrue(await uni.isPresent(didOpenEvent.args.channelId))
      assert.isTrue(await uni.isOpen(didOpenEvent.args.channelId))
      assert.isFalse(await uni.isSettling(didOpenEvent.args.channelId))
      assert.isFalse(await uni.isAbsent(didOpenEvent.args.channelId))
    })
  })
})
