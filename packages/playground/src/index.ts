import 'dotenv/config'
import express from 'express'
import bodyParser from 'body-parser'
import Paywall from './Paywall'
import morgan from 'morgan'
import { URL } from 'url'
import { mnemonicToAccount } from 'viem/accounts'

async function main() {
  const HOST = String(process.env.HOST)
  const PORT = Number(process.env.PORT)
  const MNEMONIC = String(process.env.ACCOUNT_MNEMONIC).trim()
  const GATEWAY_URL = String(process.env.GATEWAY_URL).trim()

  const account = mnemonicToAccount(MNEMONIC, {
    path: `m/44'/60'/0'/0/0`,
  })

  const paywall = new Paywall(account.address, new URL(GATEWAY_URL))

  const app = express()
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
