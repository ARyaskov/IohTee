/**
 * To run the file, it requires two environment variables to be set.
 * `RPC_URL` is a JSON RPC endpoint. Alchemy works just fine. For Polygon Amoy test network,
 * you could set it to `RPC_URL=https://rpc-amoy.polygon.technology`. Another variable is `MNEMONIC`.
 * It is a [12-word seed phrase](https://github.com/pirapira/ethereum-word-list/blob/master/README.md#mnemonic-phrase).
 * For example, `MNEMONIC=tool school decrease elegant fix awful eyebrow immense noble erase dish labor`
 *
 * Start this file then:
 *
 * yarn build
 * PROVIDER_URL="https://rpc-amoy.polygon.technology" MNEMONIC="tool school decrease elegant fix awful eyebrow immense noble erase dish labor" node hub.js
 *
 * The script runs 3 core endpoints:
 * `http://localhost:3000/content` provides an example of the paid content.
 * `http://localhost:3001/accept` accepts payment.
 * `http://localhost:3001/verify/:token` verifies token that `/accept` generates.
 *
 * The client side for buying the content is provided in `client.ts` file.
 */

import express from 'express'
import {
  Machinomy,
  AcceptTokenRequestSerde,
  PaymentChannelSerde,
} from '@riaskov/iohtee'
import bodyParser from 'body-parser'
import { mnemonicToAccount } from 'viem/accounts'
import path from 'path'

function isValidToken(token: string): boolean {
  const tokenRegex = /^0x[0-9a-fA-F]{64}$/

  return tokenRegex.test(token)
}

async function main() {
  const urlScheme = !!process.env.USE_HTTPS ? 'https://' : 'http://'
  const dbPath = path.resolve(__dirname, '../hub.db')
  const MNEMONIC = String(process.env.ACCOUNT_MNEMONIC).trim()
  const RPC_URL = String(process.env.RPC_URL).trim()
  const CHAIN_ID = Number(process.env.CHAIN_ID)

  const HOST = '127.0.0.1'
  const APP_PORT = 3000
  const HUB_PORT = 3001

  const senderAccountHdPath = `m/44'/60'/0'/0/1`
  const receiverAccountHdPath = `m/44'/60'/0'/0/1`

  const senderAccount = mnemonicToAccount(MNEMONIC, {
    path: senderAccountHdPath,
  })

  const receiverAccount = mnemonicToAccount(MNEMONIC, {
    path: receiverAccountHdPath,
  })

  /**
   * Account that receives payments.
   */
  const receiver = receiverAccount.address

  /**
   * Create iohtee instance that provides API for accepting payments.
   */
  const iohtee = new Machinomy({
    networkId: CHAIN_ID,
    httpRpcUrl: RPC_URL,
    mnemonic: MNEMONIC,
    hdPath: receiverAccountHdPath,
    options: {
      databaseUrl: `sqlite://${dbPath}`,
    },
  })

  const hub = express()
  hub.use(bodyParser.json())
  hub.use(bodyParser.urlencoded({ extended: false }))

  /**
   * Receive an off-chain payment issued by `iohtee buy` command.
   */
  hub.post('/accept', async (req, res) => {
    const body = await iohtee.acceptPayment(req.body)
    res.status(202).header('Paywall-Token', body.token).send(body)
  })

  /**
   * Verify the token that `/accept` generates.
   */
  hub.get('/verify/:token', async (req, res) => {
    const token = req.params.token as string
    const acceptTokenRequest = AcceptTokenRequestSerde.instance.deserialize({
      token,
    })
    const isAccepted = (await iohtee.acceptToken(acceptTokenRequest)).status
    if (isAccepted) {
      res.status(200).send({ status: 'ok' })
    } else {
      res.status(400).send({ status: 'token is invalid' })
    }
  })

  hub.get('/channels', async (req, res) => {
    const channels = await iohtee.channels()
    res.status(200).send(channels.map(PaymentChannelSerde.instance.serialize))
  })

  hub.get('/claim/:channelid', async (req, res) => {
    try {
      const channelId = req.params.channelid as `0x${string}`
      await iohtee.close(channelId)
      res.status(200).send('Claimed')
    } catch (error) {
      res.status(404).send('No channel found')
      console.error(error)
    }
  })

  hub.listen(HUB_PORT, () => {
    console.log('HUB is ready on port ' + HUB_PORT)
  })

  const app = express()
  const paywallHeaders = () => {
    let headers: { [index: string]: string } = {}
    headers['Paywall-Version'] = '1.0.0'
    headers['Paywall-Price'] = '1000'
    headers['Paywall-Address'] = receiver
    headers['Paywall-Gateway'] = `${urlScheme}${HOST}:${HUB_PORT}/accept`
    return headers
  }

  /**
   * Example of serving a paid content. You can buy it with `iohtee buy http://localhost:3000/content` command.
   */
  app.get('/content', async (req, res) => {
    let reqUrl = `${urlScheme}${HOST}:${HUB_PORT}/verify`
    let content = req.get('authorization')
    if (content) {
      let token = content.split(' ')[1]
      if (!isValidToken(token)) {
        throw new Error(`Invalid token received: ${token}`)
      }
      let response = await fetch(reqUrl + '/' + token)
      let json = await response.json()
      let status = json.status
      if (status === 'ok') {
        res.send('Thank you for your purchase!')
      } else {
        res.status(402).set(paywallHeaders()).send('Content is not available')
      }
    } else {
      res.status(402).set(paywallHeaders()).send('Content is not available')
    }
  })

  app.listen(APP_PORT, function () {
    console.log('Content provider is ready on ' + APP_PORT)
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
