/**
 * Sender demo: opens a channel and creates one off-chain payment.
 */

import { writeFileSync } from 'node:fs'
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

  const minimumChannelAmount = 10_000n
  const channelValue = 1_000_000n
  const paymentPrice = 200_000n

  const senderHdPath = "m/44'/60'/0'/0/1"
  const receiverHdPath = "m/44'/60'/0'/0/0"

  const senderAccount = mnemonicToAccount(mnemonic, { path: senderHdPath })
  const receiverAccount = mnemonicToAccount(mnemonic, { path: receiverHdPath })

  const iohtee = new IohTee({
    networkId: chainId,
    httpRpcUrl: rpcUrl,
    mnemonic,
    hdPath: senderHdPath,
    options: {
      databaseUrl: sqliteUrl(import.meta.url, 'sender-receiver.db'),
      minimumChannelAmount,
    },
  })

  logStep('Sender', senderAccount.address)
  logStep('Receiver', receiverAccount.address)
  logStep('Opening channel')

  await iohtee.open(receiverAccount.address, channelValue)

  const payment = await iohtee.payment({
    receiver: receiverAccount.address,
    price: paymentPrice,
  })

  writeFileSync(paymentPath, JSON.stringify(payment.payment, null, 2), 'utf8')
  logStep('Payment written', paymentPath)
  await iohtee.shutdown()
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
