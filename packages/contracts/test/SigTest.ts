// @ts-ignore
// TODO This test suite is in progress guys
import 'dotenv/config'
import '@nomicfoundation/hardhat-viem'
import * as hre from 'hardhat'
import { isAddressEqual, PublicClient } from 'viem'
import { beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('SigTest', async () => {
  let publicClient: PublicClient
  let ownerWallet
  let deployedContract
  let sigTestArtifact: any

  async function deploySigTestFixture() {
    const { viem } = await hre.network.connect()
    const [ownerWallet, otherWallet] = await viem.getWalletClients()
    deployedContract = await viem.deployContract('SigTest')
    publicClient = await viem.getPublicClient()

    return {
      ownerWallet,
      otherWallet,
    }
  }

  beforeEach(async () => {
    const { networkHelpers } = await hre.network.connect()
    const fixture = await networkHelpers.loadFixture(deploySigTestFixture)
    ownerWallet = fixture.ownerWallet
    sigTestArtifact = (await hre.artifacts.readArtifact('SigTest')).abi
  })

  it('should successfully restore address from signature', async () => {
    const channelId =
      '0x19b8dd9da04a89672f78197175e42a398ac542507b855300b98b1e354bc154ad'
    const payment: bigint = 1000000n
    let paymentDigest = (await publicClient.readContract({
      address: deployedContract!.address,
      abi: sigTestArtifact,
      functionName: 'paymentDigest',
      args: [channelId, payment],
    })) as never as `0x${string}`

    const signature = await ownerWallet.signMessage({
      account: ownerWallet.account,
      message: { raw: paymentDigest },
    })

    let result = (await publicClient.readContract({
      address: deployedContract!.address,
      abi: sigTestArtifact,
      functionName: 'testSig',
      args: [channelId, payment, signature],
    })) as never as `0x${string}`
    assert.equal(isAddressEqual(result, ownerWallet.account.address), true)
  })
})
