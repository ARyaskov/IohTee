/**
 * Token receiver demo: accepts and settles token payment.
 *
 * Required env:
 * - RPC_URL
 * - ACCOUNT_MNEMONIC
 * - CHAIN_ID
 * - TOKEN_UNIDIRECTIONAL_ADDRESS
 */

import { readFileSync } from 'node:fs'
import { IohTee } from '@riaskov/iohtee'
import { mnemonicToAccount } from 'viem/accounts'
import {
  logStep,
  removeIfExists,
  requiredAddressEnv,
  resolveDataFile,
  runtimeConfig,
  sqliteUrl,
} from './common.js'

async function run(): Promise<void> {
  const { chainId, mnemonic, rpcUrl } = runtimeConfig()
  const tokenUnidirectionalAddress = requiredAddressEnv(
    'TOKEN_UNIDIRECTIONAL_ADDRESS',
  )

  const dbPath = resolveDataFile(import.meta.url, 'sender-receiver-tokens.db')
  const paymentPath = resolveDataFile(import.meta.url, 'payment-tokens.json')
  removeIfExists(dbPath)

  const payment = JSON.parse(readFileSync(paymentPath, 'utf8')) as {
    channelId: `0x${string}`
    tokenContract?: `0x${string}`
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
      databaseUrl: sqliteUrl(import.meta.url, 'sender-receiver-tokens.db'),
      minimumChannelAmount: 10_000n,
      tokenUnidirectionalAddress,
    },
  })

  logStep('Sender', senderAccount.address)
  logStep('Receiver', receiverAccount.address)
  logStep('Token contract from payment', payment.tokenContract ?? '0x')
  logStep('Accepting token payment')

  await iohtee.acceptPayment({ payment })

  logStep('Closing token channel', payment.channelId)
  await iohtee.close(payment.channelId)

  logStep('Token channel closed', payment.channelId)
  await iohtee.shutdown()
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
