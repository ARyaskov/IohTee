import { Machinomy } from '@riaskov/machinomy'
import express from 'express'
import bodyParser from 'body-parser'
import fs from 'fs'
import { networkByName, NetworkType } from '@riaskov/machinomy-contracts'
import { getBalance } from 'viem/actions'
import { createPublicClient, http } from 'viem'

async function main() {
  let sender: `0x${string}` = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  let receiver: `0x${string}` = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
  const MNEMONIC = String(process.env.ACCOUNT_MNEMONIC).trim()
  const RPC_URL = String(process.env.RPC_URL).trim()
  const NETWORK = String(process.env.NETWORK).trim()
  const chain: any = networkByName(NETWORK) as NetworkType

  let machinomyHub = new Machinomy({
    network: chain,
    account: receiver,
    httpRpcUrl: RPC_URL,
    mnemonic: MNEMONIC,
    options: {
      databaseUrl: 'nedb://./hub',
    },
  })
  let hub = express()
  hub.use(bodyParser.json())
  hub.use(bodyParser.urlencoded({ extended: false }))
  hub.post(
    '/machinomy',
    async (req: express.Request, res: express.Response, next: Function) => {
      let body = await machinomyHub.acceptPayment(req.body)
      res.status(200).send(body)
    },
  )

  async function checkBalance(
    message: string,
    sender: `0x${string}`,
    cb: Function,
  ): Promise<any> {
    console.log('----------')
    console.log(message)

    const balanceBefore = await getBalance(machinomyHub.publicClient(), {
      address: sender,
    })
    console.log('Balance before', balanceBefore / 10n ** 6n)

    const result = await cb()

    const balanceAfter = await getBalance(machinomyHub.publicClient(), {
      address: sender,
    })
    console.log('Balance after', balanceAfter / 10n ** 6n)

    const diff = balanceBefore - balanceAfter
    console.log('Diff', diff / 10n ** 6n)

    return result
  }

  let port = 3001
  let server = hub.listen(port, async () => {
    const price = 1_000_000n

    let machinomy = new Machinomy({
      network: chain,
      account: sender,
      httpRpcUrl: RPC_URL,
      mnemonic: MNEMONIC,
      options: {
        settlementPeriod: 0,
        databaseUrl: 'nedb://./client',
      },
    })

    let message = 'This is first buy:'
    let resultFirst = await checkBalance(message, sender, async () => {
      return machinomy
        .buy({
          receiver: receiver,
          price: price,
          gateway: 'http://localhost:3001/machinomy',
          meta: 'metaexample',
        })
        .catch((e: Error) => {
          console.log(e)
        })
    })

    // message = 'This is second buy:'
    // let resultSecond = await checkBalance(message, sender, async () => {
    //   return machinomy
    //     .buy({
    //       receiver: receiver,
    //       price: price,
    //       gateway: 'http://localhost:3001/machinomy',
    //       meta: 'metaexample',
    //     })
    //     .catch((e: Error) => {
    //       console.log(e)
    //     })
    // })
    //
    // let channelId = resultSecond.channelId
    // message = 'Deposit:'
    // await checkBalance(message, sender, async () => {
    //   await machinomy.deposit(channelId, price)
    // })
    //
    // message = 'First close:'
    // await checkBalance(message, sender, async () => {
    //   await machinomy.close(channelId)
    // })
    //
    // message = 'Second close:'
    // await checkBalance(message, sender, async () => {
    //   await machinomy.close(channelId)
    // })
    //
    // message = 'Once more buy'
    // let resultThird = await checkBalance(message, sender, async () => {
    //   return machinomy
    //     .buy({
    //       receiver: receiver,
    //       price: price,
    //       gateway: 'http://localhost:3001/machinomy',
    //       meta: 'metaexample',
    //     })
    //     .catch((e: Error) => {
    //       console.log(e)
    //     })
    // })
    //
    // message = 'Claim by receiver'
    // await checkBalance(message, sender, async () => {
    //   await machinomyHub.close(resultThird.channelId)
    // })
    //
    // console.log('ChannelId after first buy:', resultFirst.channelId)
    // console.log('ChannelId after second buy:', resultSecond.channelId)
    // console.log('ChannelId after once more buy:', resultThird.channelId)

    server.close()
    try {
      if (fs.existsSync('client')) {
        fs.unlinkSync('client')
      }
    } catch (error) {
      console.log(error)
    }
    try {
      if (fs.existsSync('hub')) {
        fs.unlinkSync('hub')
      }
    } catch (error) {
      console.log(error)
    }
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
