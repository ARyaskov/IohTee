// @ts-ignore
// TODO This test suite is in progress guys
import 'dotenv/config'
import '@nomicfoundation/hardhat-viem'
import * as hre from 'hardhat'
import { getAddress, isAddressEqual, PublicClient } from 'viem'
import { assert } from 'chai'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { channelId, Unidirectional } from '../src/index'
import { ethers } from 'ethers'

const sigTestArtifact = require('../abi/SigTest.json').abi

describe('SigTest', async () => {
  let publicClient: PublicClient
  let ethersSigner
  let deployedContract

  async function deploySigTestFixture() {
    const [ownerWallet, otherWallet] = await hre.viem.getWalletClients()
    deployedContract = await hre.viem.deployContract('SigTest')
    publicClient = await hre.viem.getPublicClient()

    return {
      ownerWallet,
      otherWallet,
    }
  }

  beforeEach(async () => {
    await loadFixture(deploySigTestFixture)
    ethersSigner = (await hre.ethers.getSigners())[0]
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

    const signature = await ethersSigner.signMessage(
      ethers.getBytes(paymentDigest),
    )

    let result = (await publicClient.readContract({
      address: deployedContract!.address,
      abi: sigTestArtifact,
      functionName: 'testSig',
      args: [channelId, payment, signature],
    })) as never as `0x${string}`
    assert.isTrue(isAddressEqual(result, ethersSigner.address))
  })
})
