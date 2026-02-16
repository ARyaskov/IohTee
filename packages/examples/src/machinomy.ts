/**
 * Self-contained scenario that spins up a local gateway and executes
 * buy/deposit/close/claim lifecycle.
 */

import Fastify from 'fastify'
import { IohTee } from '@riaskov/iohtee'
import { mnemonicToAccount } from 'viem/accounts'
import { logStep, runtimeConfig, sqliteUrl } from './common.js'

async function checkBalance(
  iohtee: IohTee,
  label: string,
  address: `0x${string}`,
  action: () => Promise<unknown>,
): Promise<unknown> {
  const before = await iohtee.publicClient().getBalance({ address })
  logStep(`${label}: balance before`, before)

  const result = await action()

  const after = await iohtee.publicClient().getBalance({ address })
  logStep(`${label}: balance after`, after)
  logStep(`${label}: diff`, before - after)

  return result
}

async function main(): Promise<void> {
  const { chainId, mnemonic, rpcUrl } = runtimeConfig()

  const sender = mnemonicToAccount(mnemonic, {
    path: "m/44'/60'/0'/0/1",
  })
  const receiver = mnemonicToAccount(mnemonic, {
    path: "m/44'/60'/0'/0/0",
  })

  const hubIohtee = new IohTee({
    networkId: chainId,
    httpRpcUrl: rpcUrl,
    mnemonic,
    hdPath: "m/44'/60'/0'/0/0",
    options: {
      databaseUrl: sqliteUrl(import.meta.url, 'hub.db'),
    },
  })

  const hub = Fastify({ logger: true })
  hub.post('/iohtee', async (request, reply) => {
    const body = await hubIohtee.acceptPayment(request.body)
    return reply.code(200).send(body)
  })

  await hub.listen({ host: '127.0.0.1', port: 3001 })

  const clientIohtee = new IohTee({
    networkId: chainId,
    httpRpcUrl: rpcUrl,
    mnemonic,
    hdPath: "m/44'/60'/0'/0/1",
    options: {
      settlementPeriod: 0,
      databaseUrl: sqliteUrl(import.meta.url, 'client.db'),
    },
  })

  const price = 1_000_000n
  const gateway = 'http://127.0.0.1:3001/iohtee'

  const firstResult = await checkBalance(
    hubIohtee,
    'First buy',
    sender.address,
    async () =>
      clientIohtee.buy({
        receiver: receiver.address,
        price,
        gateway,
        meta: 'metaexample-first',
      }),
  )

  const secondResult = (await checkBalance(
    hubIohtee,
    'Second buy',
    sender.address,
    async () =>
      clientIohtee.buy({
        receiver: receiver.address,
        price,
        gateway,
        meta: 'metaexample-second',
      }),
  )) as { channelId: `0x${string}` }

  const channelId = secondResult.channelId

  await checkBalance(hubIohtee, 'Deposit', sender.address, async () => {
    await clientIohtee.deposit(channelId, price)
  })

  await checkBalance(hubIohtee, 'Close by sender', sender.address, async () => {
    await clientIohtee.close(channelId)
  })

  const thirdResult = (await checkBalance(
    hubIohtee,
    'Third buy',
    sender.address,
    async () =>
      clientIohtee.buy({
        receiver: receiver.address,
        price,
        gateway,
        meta: 'metaexample-third',
      }),
  )) as { channelId: `0x${string}` }

  await checkBalance(
    hubIohtee,
    'Claim by receiver',
    sender.address,
    async () => {
      await hubIohtee.close(thirdResult.channelId)
    },
  )

  logStep('First result', firstResult)
  logStep('Final channel', thirdResult.channelId)

  await Promise.all([
    clientIohtee.shutdown(),
    hubIohtee.shutdown(),
    hub.close(),
  ])
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
