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
 * PROVIDER_URL="https://rpc-amoy.polygon.technology" MNEMONIC="tool school decrease elegant fix awful eyebrow immense noble erase dish labor" node client.js
 *
 * It will open a channel towards the server side, and send a single payment.
 *
 * The server side (the Hub) for selling the content is provided in `hub.ts` file.
 */

import { IohTee } from '@riaskov/iohtee'
import path from 'path'
import { mnemonicToAccount } from 'viem/accounts'

async function main(): Promise<string> {
  const MNEMONIC = String(process.env.ACCOUNT_MNEMONIC).trim()
  const RPC_URL = String(process.env.RPC_URL).trim()
  const CHAIN_ID = Number(process.env.CHAIN_ID)
  const TARGET = 'https://play.iohtee.toivo.tech/hello'

  const senderAccountHdPath = `m/44'/60'/0'/0/0`
  const receiverAccountHdPath = `m/44'/60'/0'/0/1`

  const senderAccount = mnemonicToAccount(MNEMONIC, {
    path: senderAccountHdPath,
  })

  const receiverAccount = mnemonicToAccount(MNEMONIC, {
    path: receiverAccountHdPath,
  })

  /**
   * Account that send payments payments.
   */
  console.log('sender address', senderAccount.address)

  /**
   * Create iohtee instance that provides API for accepting payments.
   */

  const iohtee = new IohTee({
    networkId: CHAIN_ID,
    httpRpcUrl: RPC_URL,
    mnemonic: MNEMONIC,
    hdPath: senderAccountHdPath,
    options: {
      databaseUrl: `sqlite://${path.resolve(__dirname, '../client.db')}`,
    },
  })

  let response = await fetch(TARGET)
  let headers = response.headers

  /**
   * Request token to content access
   */
  const result = await iohtee.buy({
    price: BigInt(String(headers.get('paywall-price'))),
    gateway: headers.get('paywall-gateway')!,
    receiver: headers.get('paywall-address')! as `0x${string}`,
    meta: 'metaidexample',
  })

  const token = result.token

  /**
   * Request paid content
   */
  const content = await fetch(TARGET, {
    headers: {
      authorization: `paywall ${token} ${'metaidexample'} ${String(headers.get('paywall-price'))}`,
    },
  })

  const body = content.body! as any
  return body.read().toString()
}

main()
  .then((content: string) => {
    console.log('Bought content: ')
    console.log(`"${content}"`)
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
