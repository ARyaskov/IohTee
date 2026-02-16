/**
 * Example client that buys paywalled content from /content endpoint.
 *
 * Required env:
 * - RPC_URL
 * - ACCOUNT_MNEMONIC
 * - CHAIN_ID
 * Optional env:
 * - TARGET (default: http://127.0.0.1:3000/content)
 */

import { IohTee } from '@riaskov/iohtee'
import { logStep, requiredEnv, runtimeConfig, sqliteUrl } from './common.js'

function requiredHeader(headers: Headers, name: string): string {
  const value = headers.get(name)
  if (!value) {
    throw new Error(`Missing required response header: ${name}`)
  }
  return value
}

async function main(): Promise<string> {
  const { chainId, mnemonic, rpcUrl } = runtimeConfig()
  const target = process.env.TARGET?.trim() || 'http://127.0.0.1:3000/content'

  const senderHdPath = "m/44'/60'/0'/0/0"

  const iohtee = new IohTee({
    networkId: chainId,
    httpRpcUrl: rpcUrl,
    mnemonic,
    hdPath: senderHdPath,
    options: {
      databaseUrl: sqliteUrl(import.meta.url, 'client.db'),
    },
  })

  const challengeResponse = await fetch(target)
  if (challengeResponse.status !== 402) {
    const body = await challengeResponse.text()
    await iohtee.shutdown()
    return body
  }

  const gateway = requiredHeader(challengeResponse.headers, 'paywall-gateway')
  const receiver = requiredHeader(
    challengeResponse.headers,
    'paywall-address',
  ) as `0x${string}`
  const price = BigInt(
    requiredHeader(challengeResponse.headers, 'paywall-price'),
  )

  const meta = requiredEnv('PAYMENT_META')
  const result = await iohtee.buy({
    price,
    gateway,
    receiver,
    meta,
  })

  logStep('Payment token created', result.token)

  const paidResponse = await fetch(target, {
    headers: {
      authorization: `paywall ${result.token} ${meta} ${price.toString()}`,
    },
  })

  const content = await paidResponse.text()
  await iohtee.shutdown()
  return content
}

main()
  .then((content) => {
    logStep('Bought content')
    console.log(content)
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
