import '@nomicfoundation/hardhat-viem'
import { assert } from 'chai'
import hre from 'hardhat'
import {
  getAddress,
  parseEventLogs
} from 'viem'
import * as contracts from '../src'
import { GetContractReturnType } from '@nomicfoundation/hardhat-viem/types'
import { ArtifactsMap } from 'hardhat/types/artifacts'
import { getTransactionReceipt } from 'viem/actions'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { formatNumber } from 'humanize-plus'

type Unidirectional = GetContractReturnType<
  ArtifactsMap['Unidirectional']['abi']
>

describe('Unidirectional', async () => {
  const settlingPeriod = 0

  let account0: string
  let account1: string
  let contract: Unidirectional
  let client: any


  async function deployUnidirectionalFixture() {
    const [ownerWallet, otherWallet] = await hre.viem.getWalletClients()

    contract = await hre.viem.deployContract('Unidirectional')
    client = await hre.viem.getPublicClient()
    return {
      ownerWallet,
      otherWallet
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
    let channelId = contracts.channelId(account0, account1)
    let log = await createChannelRaw(channelId, settlingPeriod)
    return log.logs[0].args
  }

  describe('Unidirectional:123', () => {
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
          account0
        })

        console.log(`Gas for "open" method: ${formatNumber(Number(gas))}`)

        let channelId = contracts.channelId(account0, account1)
        await createChannelRaw(channelId)
        assert((await contract.getEvents.DidOpen()).length === 1)
        const didOpenEvent = (await contract.getEvents.DidOpen())[0]
        assert.equal(
          (didOpenEvent.args.channelId as string).substring(0, 34),
          `0x${channelId}`
        )
        assert.equal(didOpenEvent.args.sender, account0)
        assert.equal(didOpenEvent.args.receiver, account1)
      })
    })
  })
})
