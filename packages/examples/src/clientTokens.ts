/**
 * Token client that buys paywalled token-content endpoint.
 *
 * Required env:
 * - RPC_URL
 * - ACCOUNT_MNEMONIC
 * - CHAIN_ID
 * - PAYMENT_META
 * - TOKEN_UNIDIRECTIONAL_ADDRESS
 * Optional env:
 * - TOKEN_TARGET (default: http://127.0.0.1:3010/token-content)
 */

import { IohTee } from '@riaskov/iohtee'
import {
  logStep,
  requiredAddressEnv,
  requiredAddressHeader,
  requiredEnv,
  runtimeConfig,
  sqliteUrl,
} from './common.js'

function requiredHeader(headers: Headers, name: string): string {
  const value = headers.get(name)
  if (!value) {
    throw new Error(`Missing required response header: ${name}`)
  }
  return value
}

async function main(): Promise<string> {
  const { chainId, mnemonic, rpcUrl } = runtimeConfig()
  const tokenUnidirectionalAddress = requiredAddressEnv(
    'TOKEN_UNIDIRECTIONAL_ADDRESS',
  )
  const target =
    process.env.TOKEN_TARGET?.trim() || 'http://127.0.0.1:3010/token-content'

  const iohtee = new IohTee({
    networkId: chainId,
    httpRpcUrl: rpcUrl,
    mnemonic,
    hdPath: "m/44'/60'/0'/0/0",
    options: {
      databaseUrl: sqliteUrl(import.meta.url, 'client-tokens.db'),
      tokenUnidirectionalAddress,
    },
  })

  const challengeResponse = await fetch(target)
  if (challengeResponse.status !== 402) {
    const body = await challengeResponse.text()
    await iohtee.shutdown()
    return body
  }

  const gateway = requiredHeader(challengeResponse.headers, 'paywall-gateway')
  const receiver = requiredAddressHeader(
    challengeResponse.headers,
    'paywall-address',
  )
  const tokenContract = requiredAddressHeader(
    challengeResponse.headers,
    'paywall-token-contract',
  )
  const price = BigInt(
    requiredHeader(challengeResponse.headers, 'paywall-price'),
  )
  const meta = requiredEnv('PAYMENT_META')

  const result = await iohtee.buy({
    price,
    gateway,
    receiver,
    meta,
    tokenContract,
  })

  logStep('Token payment created', result.token)

  const paidResponse = await fetch(target, {
    headers: {
      authorization: `Paywall ${result.token} ${meta} ${price.toString()} ${tokenContract}`,
    },
  })

  const content = await paidResponse.text()
  await iohtee.shutdown()
  return content
}

main()
  .then((content) => {
    logStep('Bought token content')
    console.log(content)
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
