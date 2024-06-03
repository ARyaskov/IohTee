// TODO This test suite is in progress guys
import 'dotenv/config'
import '@nomicfoundation/hardhat-viem'
import { assert } from 'chai'
import hre from 'hardhat'
import { getAddress, pad, parseEther, parseEventLogs } from 'viem'
import * as contracts from '../src'
import { GetContractReturnType } from '@nomicfoundation/hardhat-viem/types'
import { ArtifactsMap } from 'hardhat/types/artifacts'
import { getTransactionReceipt } from 'viem/actions'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { formatNumber } from 'humanize-plus'
import { channelId } from '../src/index'

type Unidirectional = GetContractReturnType<
  ArtifactsMap['Unidirectional']['abi']
>

describe('Unidirectional', async () => {
  const settlingPeriod = 0

  let account0: string
  let account1: string
  let contract: Unidirectional
  let client: any
  const channelValue = parseEther('1')

  async function deployUnidirectionalFixture() {
    const [ownerWallet, otherWallet] = await hre.viem.getWalletClients()

    contract = await hre.viem.deployContract('Unidirectional')
    client = await hre.viem.getPublicClient()
    return {
      ownerWallet,
      otherWallet,
    }
  }

  async function createChannelRaw(
    channelId: string,
    _settlingPeriod: number = settlingPeriod,
  ) {
    const txId = await contract.write.open([
      channelId,
      account1,
      _settlingPeriod,
    ])

    const receipt = await getTransactionReceipt(client, {
      hash: txId,
    })

    const logs = parseEventLogs({
      abi: contract.abi,
      logs: receipt.logs,
    })
    return logs
  }

  async function createChannel(settlingPeriod?: number) {
    const newChannelId = channelId(account0, account1)
    const log = await createChannelRaw(newChannelId, settlingPeriod)
    console.log(log)
    return log[0].args
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
      let channelIdGas = contracts.channelId(account0, account1)
      const gas = await client.estimateContractGas({
        address: contract.address,
        abi: contract.abi,
        functionName: 'open',
        args: [channelIdGas, account1, settlingPeriod],
        account0,
      })

      console.log(`Gas for "open" method: ${formatNumber(Number(gas))}`)

      let channelId = contracts.channelId(account0, account1)
      await createChannelRaw(channelId)
      assert((await contract.getEvents.DidOpen()).length === 1)
      const didOpenEvent = (await contract.getEvents.DidOpen())[0]
      assert.equal(
        (didOpenEvent.args.channelId as string).substring(0, 34),
        pad(`0x${channelId}`),
      )
      assert.equal(didOpenEvent.args.sender, account0)
      assert.equal(didOpenEvent.args.receiver, account1)
    })

    it('open channel', async () => {
      const event = await createChannel()
      const channel = await contract.read.channels(event.channelId)
      assert.equal(channel[0], account0)
      assert.equal(channel[1], account1)
      assert.equal(channel[2].toString(), channelValue.toString())
      assert.equal(channel[3].toString(), settlingPeriod.toString())
      assert.equal(channel[4].toString(), '0')

      // assert.isTrue(await contract.isPresent(event.channelId))
      // assert.isTrue(await contract.isOpen(event.channelId))
      // assert.isFalse(await contract.isSettling(event.channelId))
      // assert.isFalse(await contract.isAbsent(event.channelId))
    })
  })
})
