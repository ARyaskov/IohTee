import path from 'path'
import fs from 'fs-extra'
import { IohTee } from '@riaskov/iohtee'
import Logger from '@machinomy/logger'
import { mnemonicToAccount } from 'viem/accounts'

const payment = require(path.resolve('./payment.json'))

const LOG = new Logger('iohtee-receiver')

async function run() {
  const dbPath = path.resolve(__dirname, '../sender-receiver.db')
  fs.removeSync(dbPath)

  const MNEMONIC = String(process.env.ACCOUNT_MNEMONIC).trim()
  const RPC_URL = String(process.env.RPC_URL).trim()
  const CHAIN_ID = Number(process.env.CHAIN_ID)

  const minimumChannelAmount = 1n * 10n ** 4n

  LOG.info(`PROVIDER = ${RPC_URL}`)
  LOG.info(`MNEMONIC = ${MNEMONIC}`)

  const senderAccountHdPath = `m/44'/60'/0'/0/0`
  const receiverAccountHdPath = `m/44'/60'/0'/0/1`

  const senderAccount = mnemonicToAccount(MNEMONIC, {
    path: senderAccountHdPath,
  })

  const receiverAccount = mnemonicToAccount(MNEMONIC, {
    path: receiverAccountHdPath,
  })

  const iohtee = new IohTee({
    networkId: CHAIN_ID,
    httpRpcUrl: RPC_URL,
    mnemonic: MNEMONIC,
    hdPath: senderAccountHdPath,
    options: {
      databaseUrl: `sqlite://${dbPath}`,
      minimumChannelAmount: minimumChannelAmount,
    },
  })

  LOG.info(`Receiver: ${receiverAccount}`)
  LOG.info(`Accept payment: ${JSON.stringify(payment)}`)

  await iohtee.acceptPayment({
    payment: payment,
  })

  LOG.info(`Start closing channel with channelID ${payment.channelId}`)

  await iohtee.close(payment.channelId)

  LOG.info(`Channel ${payment.channelId} was successfully closed.`)
  LOG.info(
    `Trace the last transaction via https://amoy.polygonscan.com/address/${receiverAccount}`,
  )
  LOG.info(`Receiver done.`)

  process.exit(0)
}

run().catch((err) => {
  console.error(err)
})
