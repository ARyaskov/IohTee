import path from 'path'
import fs from 'fs-extra'
import { Machinomy } from '@riaskov/iohtee'
import Logger from '@machinomy/logger'
import { mnemonicToAccount } from 'viem/accounts'

const LOG = new Logger('machinomy-sender')

async function run() {
  const dbPath = path.resolve(__dirname, '../sender-receiver.db')
  fs.removeSync(dbPath)

  const MNEMONIC = String(process.env.ACCOUNT_MNEMONIC).trim()
  const RPC_URL = String(process.env.RPC_URL).trim()
  const CHAIN_ID = Number(process.env.CHAIN_ID)

  const minimumChannelAmount = 1n * 10n ** 4n
  const channelValue = 1n * 10n ** 6n
  const paymentPrice = 200000n

  LOG.info(`PROVIDER = ${RPC_URL}`)
  LOG.info(`MNEMONIC = ${MNEMONIC}`)

  const senderAccountHdPath = `m/44'/60'/0'/0/1`

  const senderAccount = mnemonicToAccount(MNEMONIC, {
    path: senderAccountHdPath,
  })

  const receiverAccount = mnemonicToAccount(MNEMONIC, {
    path: `m/44'/60'/0'/0/0`,
  })

  const iohtee = new Machinomy({
    networkId: CHAIN_ID,
    httpRpcUrl: RPC_URL,
    mnemonic: MNEMONIC,
    hdPath: senderAccountHdPath,
    options: {
      databaseUrl: `sqlite://${dbPath}`,
      minimumChannelAmount: minimumChannelAmount,
    },
  })
  LOG.info(
    `Start opening IohTee channel between sender ${senderAccount.address} and receiver ${receiverAccount.address} with value ${channelValue} Wei`,
  )
  LOG.info(
    `For remote Ethereum nodes (e.g. Amoy or Sepolia) it can taking a 15-30 seconds.`,
  )

  await iohtee.open(receiverAccount.address, channelValue)

  LOG.info(`Channel was opened.`)
  LOG.info(
    `Trace the last transaction via https://amoy.polygonscan.com/address/${senderAccount.address}`,
  )

  const payment = await iohtee.payment({
    receiver: receiverAccount.address,
    price: paymentPrice,
  })

  LOG.info('Payment: ')
  LOG.info(payment.payment)

  fs.writeFileSync('payment.json', JSON.stringify(payment.payment))

  LOG.info('Sender done.')

  process.exit(0)
}

run().catch((err) => {
  console.error(err)
})
