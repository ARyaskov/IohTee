import 'dotenv/config'
import express from 'express'
import bodyParser from 'body-parser'
import {
  NetworkType,
  networkByName,
  Unidirectional,
} from '@riaskov/machinomy-contracts'
import Paywall from './Paywall'
import morgan from 'morgan'
import url from 'url'
import { createWalletClient, http } from 'viem'

async function main() {
  const HOST = String(process.env.HOST)
  const PORT = Number(process.env.PORT)

  const MNEMONIC = String(process.env.ACCOUNT_MNEMONIC).trim()
  const RPC_URL = String(process.env.RPC_URL).trim()
  const GATEWAY_URL = String(process.env.GATEWAY_URL).trim()
  const NETWORK = String(process.env.NETWORK).trim()
  const chain: any = networkByName(NETWORK) as NetworkType

  const walletClient = createWalletClient({
    chain: chain,
    transport: http(RPC_URL),
  })

  const addresses = await walletClient.getAddresses()

  const address = addresses[0]
  const base = new url.URL(GATEWAY_URL)
  const paywall = new Paywall(address, base)

  const unidirectional = new Unidirectional({
    network: chain,
    httpRpcUrl: RPC_URL,
    mnemonic: MNEMONIC,
  })

  // const tokenContract = instanceTestToken.address

  let app = express()
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(paywall.middleware())
  app.use(morgan('combined'))

  app.get(
    '/hello',
    paywall.guard(1000n, (req: express.Request, res: express.Response) => {
      res.end('Thank you for the payment!')
    }),
  )

  // app.get('/hello-token', paywall.guardToken(5n, tokenContract, (req: express.Request, res: express.Response) => {
  //   res.end('Thank you for the payment!')
  // }))

  app.listen(PORT, () => {
    console.log(`Waiting at http(s)://${HOST}:${PORT}/hello`)
    // console.log(`Waiting at http(s)://${HOST}:${PORT}/hello-token`)
  })
}

main()
  .then(() => {
    // Do Nothing
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
