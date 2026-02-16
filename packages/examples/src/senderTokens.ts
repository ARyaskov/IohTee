/**
 * Token sender demo: opens a token channel and creates off-chain token payment.
 *
 * Required env:
 * - RPC_URL
 * - ACCOUNT_MNEMONIC
 * - CHAIN_ID
 * - TOKEN_CONTRACT
 * - TOKEN_UNIDIRECTIONAL_ADDRESS
 */

import { writeFileSync } from 'node:fs'
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
  const tokenContract = requiredAddressEnv('TOKEN_CONTRACT')
  const tokenUnidirectionalAddress = requiredAddressEnv(
    'TOKEN_UNIDIRECTIONAL_ADDRESS',
  )

  const dbPath = resolveDataFile(import.meta.url, 'sender-receiver-tokens.db')
  const paymentPath = resolveDataFile(import.meta.url, 'payment-tokens.json')
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
      databaseUrl: sqliteUrl(import.meta.url, 'sender-receiver-tokens.db'),
      minimumChannelAmount,
      tokenUnidirectionalAddress,
    },
  })

  logStep('Sender', senderAccount.address)
  logStep('Receiver', receiverAccount.address)
  logStep('Token contract', tokenContract)
  logStep('Opening token channel')

  await iohtee.open(
    receiverAccount.address,
    channelValue,
    undefined,
    tokenContract,
  )

  const payment = await iohtee.payment({
    receiver: receiverAccount.address,
    price: paymentPrice,
    tokenContract,
  })

  writeFileSync(paymentPath, JSON.stringify(payment.payment, null, 2), 'utf8')
  logStep('Token payment written', paymentPath)

  await iohtee.shutdown()
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
