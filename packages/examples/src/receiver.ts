/**
 * Receiver demo: reads off-chain payment and settles channel on-chain.
 */

import { readFileSync } from 'node:fs'
import { IohTee } from '@riaskov/iohtee'
import { mnemonicToAccount } from 'viem/accounts'
import {
  logStep,
  removeIfExists,
  resolveDataFile,
  runtimeConfig,
  sqliteUrl,
} from './common.js'

async function run(): Promise<void> {
  const { chainId, mnemonic, rpcUrl } = runtimeConfig()
  const dbPath = resolveDataFile(import.meta.url, 'sender-receiver.db')
  const paymentPath = resolveDataFile(import.meta.url, 'payment.json')
  removeIfExists(dbPath)

  const payment = JSON.parse(readFileSync(paymentPath, 'utf8')) as {
    channelId: `0x${string}`
  } & Record<string, unknown>

  const senderHdPath = "m/44'/60'/0'/0/0"
  const receiverHdPath = "m/44'/60'/0'/0/1"

  const senderAccount = mnemonicToAccount(mnemonic, { path: senderHdPath })
  const receiverAccount = mnemonicToAccount(mnemonic, { path: receiverHdPath })

  const iohtee = new IohTee({
    networkId: chainId,
    httpRpcUrl: rpcUrl,
    mnemonic,
    hdPath: senderHdPath,
    options: {
      databaseUrl: sqliteUrl(import.meta.url, 'sender-receiver.db'),
      minimumChannelAmount: 10_000n,
    },
  })

  logStep('Sender', senderAccount.address)
  logStep('Receiver', receiverAccount.address)
  logStep('Accepting payment')

  await iohtee.acceptPayment({ payment })

  logStep('Closing channel', payment.channelId)
  await iohtee.close(payment.channelId)

  logStep('Channel closed', payment.channelId)
  await iohtee.shutdown()
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
