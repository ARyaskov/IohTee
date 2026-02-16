import '@nomicfoundation/hardhat-viem'
import * as hre from 'hardhat'
import { encodeFunctionData, parseAbi } from 'viem'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('UnidirectionalUpgradeable (UUPS)', () => {
  function getAddressLike(contract: any): `0x${string}` {
    const address =
      contract?.address ?? contract?.target ?? contract?.deploymentAddress
    if (!address) {
      throw new Error('Could not resolve deployed contract address')
    }
    return address as `0x${string}`
  }

  async function loadFixture<T>(fixture: () => Promise<T>): Promise<T> {
    const { networkHelpers } = await hre.network.connect()
    return networkHelpers.loadFixture(fixture)
  }

  async function deployFixture() {
    const { viem } = await hre.network.connect()
    const [owner, receiver, attacker] = await viem.getWalletClients()
    const publicClient = await viem.getPublicClient()

    const implementation = await viem.deployContract(
      'UnidirectionalUpgradeable',
    )
    const initData = encodeFunctionData({
      abi: parseAbi(['function initialize(address initialOwner)']),
      functionName: 'initialize',
      args: [owner.account.address],
    })

    const implementationAddress = getAddressLike(implementation)
    const proxy = await viem.deployContract('UUPSProxy', [
      implementationAddress,
      initData,
    ])
    const proxyAddress = getAddressLike(proxy)

    const uniAbi = (
      await hre.artifacts.readArtifact('UnidirectionalUpgradeable')
    ).abi as any

    return {
      owner,
      receiver,
      attacker,
      publicClient,
      proxyAddress,
      uniAbi,
    }
  }

  it('initializes once and blocks reinitialization', async () => {
    const { owner, proxyAddress, uniAbi } = await loadFixture(deployFixture)

    let failed = false
    try {
      await owner.writeContract({
        address: proxyAddress,
        abi: uniAbi,
        functionName: 'initialize',
        args: [owner.account.address],
      })
    } catch {
      failed = true
    }
    assert.equal(failed, true, 'initialize must not be callable twice')
  })

  it('rejects unauthorized upgrades and allows owner upgrade', async () => {
    const { owner, attacker, proxyAddress, uniAbi } =
      await loadFixture(deployFixture)

    const { viem } = await hre.network.connect()
    const v2 = await viem.deployContract('UnidirectionalUpgradeableV2')
    const v2Address = getAddressLike(v2)

    let unauthorizedUpgradeFailed = false
    try {
      await attacker.writeContract({
        address: proxyAddress,
        abi: uniAbi,
        functionName: 'upgradeToAndCall',
        args: [v2Address, '0x'],
      })
    } catch {
      unauthorizedUpgradeFailed = true
    }
    assert.equal(
      unauthorizedUpgradeFailed,
      true,
      'non-owner upgrade must always revert',
    )

    await owner.writeContract({
      address: proxyAddress,
      abi: uniAbi,
      functionName: 'upgradeToAndCall',
      args: [v2Address, '0x'],
    })

    // If we reached this point, owner-based upgrade path is available while
    // non-owner upgrade path remains blocked.
    assert.equal(true, true)
  })

  it('keeps secure claim flow over proxy', async () => {
    const { owner, receiver, proxyAddress, uniAbi, publicClient } =
      await loadFixture(deployFixture)

    const channelId =
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as `0x${string}`
    const settlingPeriod = 10n
    const depositValue = 1_000_000_000_000_000n
    const paymentValue = 300_000_000_000_000n

    await owner.writeContract({
      address: proxyAddress,
      abi: uniAbi,
      functionName: 'open',
      args: [channelId, receiver.account.address, settlingPeriod],
      value: depositValue,
    })

    const digest = (await publicClient.readContract({
      address: proxyAddress,
      abi: uniAbi,
      functionName: 'paymentDigest',
      args: [channelId, paymentValue],
    })) as `0x${string}`

    const signature = await owner.signMessage({
      account: owner.account,
      message: { raw: digest },
    })

    const canClaim = await publicClient.readContract({
      address: proxyAddress,
      abi: uniAbi,
      functionName: 'canClaim',
      args: [channelId, paymentValue, receiver.account.address, signature],
    })
    assert.equal(canClaim, true)

    await receiver.writeContract({
      address: proxyAddress,
      abi: uniAbi,
      functionName: 'claim',
      args: [channelId, paymentValue, signature],
    })

    const channel = (await publicClient.readContract({
      address: proxyAddress,
      abi: uniAbi,
      functionName: 'channels',
      args: [channelId],
    })) as readonly unknown[]

    assert.equal(channel[0], '0x0000000000000000000000000000000000000000')
  })

  it('returns false for malformed signatures in canClaim', async () => {
    const { owner, receiver, proxyAddress, uniAbi, publicClient } =
      await loadFixture(deployFixture)

    const channelId =
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as `0x${string}`
    await owner.writeContract({
      address: proxyAddress,
      abi: uniAbi,
      functionName: 'open',
      args: [channelId, receiver.account.address, 10n],
      value: 1_000_000_000_000_000n,
    })

    const canClaim = await publicClient.readContract({
      address: proxyAddress,
      abi: uniAbi,
      functionName: 'canClaim',
      args: [channelId, 1n, receiver.account.address, '0x1234'],
    })

    assert.equal(canClaim, false)
  })

  it('blocks implementation initialization directly', async () => {
    const { owner } = await loadFixture(deployFixture)
    const { viem } = await hre.network.connect()
    const implementation = await viem.deployContract(
      'UnidirectionalUpgradeable',
    )
    const implementationAddress = getAddressLike(implementation)
    const uniAbi = (
      await hre.artifacts.readArtifact('UnidirectionalUpgradeable')
    ).abi as any

    let failed = false
    try {
      await owner.writeContract({
        address: implementationAddress,
        abi: uniAbi,
        functionName: 'initialize',
        args: [owner.account.address],
      })
    } catch {
      failed = true
    }

    assert.equal(failed, true, 'implementation contract must reject initialize')
  })
})
