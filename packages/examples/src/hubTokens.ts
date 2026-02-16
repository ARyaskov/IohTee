/**
 * Token paywall server and payment gateway.
 *
 * Required env:
 * - RPC_URL
 * - ACCOUNT_MNEMONIC
 * - CHAIN_ID
 * - TOKEN_CONTRACT
 * - TOKEN_UNIDIRECTIONAL_ADDRESS
 */

import Fastify from 'fastify'
import {
  AcceptTokenRequestSerde,
  IohTee,
  PaymentChannelSerde,
} from '@riaskov/iohtee'
import { mnemonicToAccount } from 'viem/accounts'
import {
  isHexToken,
  logStep,
  requiredAddressEnv,
  runtimeConfig,
  sqliteUrl,
} from './common.js'

const HOST = '127.0.0.1'
const APP_PORT = 3010
const HUB_PORT = 3011

function paywallHeaders(
  receiver: `0x${string}`,
  gateway: string,
  tokenContract: `0x${string}`,
): Record<string, string> {
  return {
    'Paywall-Version': '2.0.0',
    'Paywall-Price': '1000',
    'Paywall-Address': receiver,
    'Paywall-Gateway': gateway,
    'Paywall-Token-Contract': tokenContract,
    'Paywall-Meta': 'token-demo',
    'Paywall-Channels': '[]',
  }
}

function parseTokenFromAuthorization(
  header: string | undefined,
): `0x${string}` | null {
  if (!header) {
    return null
  }
  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'paywall' || !token || !isHexToken(token)) {
    return null
  }
  return token
}

async function main(): Promise<void> {
  const { chainId, mnemonic, rpcUrl } = runtimeConfig()
  const tokenContract = requiredAddressEnv('TOKEN_CONTRACT')
  const tokenUnidirectionalAddress = requiredAddressEnv(
    'TOKEN_UNIDIRECTIONAL_ADDRESS',
  )
  const scheme = process.env.USE_HTTPS ? 'https' : 'http'
  const gatewayUrl = `${scheme}://${HOST}:${HUB_PORT}/accept-token`

  const receiverAccount = mnemonicToAccount(mnemonic, {
    path: "m/44'/60'/0'/0/1",
  })

  const iohtee = new IohTee({
    networkId: chainId,
    httpRpcUrl: rpcUrl,
    mnemonic,
    hdPath: "m/44'/60'/0'/0/1",
    options: {
      databaseUrl: sqliteUrl(import.meta.url, 'hub-tokens.db'),
      tokenUnidirectionalAddress,
    },
  })

  const hub = Fastify({ logger: true })

  hub.post('/accept-token', async (request, reply) => {
    const body = await iohtee.acceptPayment(request.body)
    return reply.code(202).header('Paywall-Token', body.token).send(body)
  })

  hub.get<{ Params: { token: string } }>(
    '/verify-token/:token',
    async (request, reply) => {
      let isAccepted = false
      try {
        const acceptTokenRequest = AcceptTokenRequestSerde.instance.deserialize(
          {
            token: request.params.token,
          },
        )
        isAccepted = (await iohtee.acceptToken(acceptTokenRequest)).status
      } catch {
        isAccepted = false
      }

      if (isAccepted) {
        return reply.code(200).send({ status: 'ok' as const })
      }
      return reply.code(400).send({ status: 'token is invalid' as const })
    },
  )

  hub.get('/channels-token', async (_request, reply) => {
    const channels = await iohtee.channels()
    return reply
      .code(200)
      .send(
        channels.map((channel) =>
          PaymentChannelSerde.instance.serialize(channel),
        ),
      )
  })

  await hub.listen({ host: HOST, port: HUB_PORT })
  logStep(`Token hub ready at http://${HOST}:${HUB_PORT}`)

  const app = Fastify({ logger: true })

  app.get('/token-content', async (request, reply) => {
    const token = parseTokenFromAuthorization(request.headers.authorization)
    if (!token) {
      return reply
        .code(402)
        .headers(
          paywallHeaders(receiverAccount.address, gatewayUrl, tokenContract),
        )
        .send({ message: 'Token content is not available' })
    }

    const verifyResponse = await fetch(
      `${scheme}://${HOST}:${HUB_PORT}/verify-token/${token}`,
    )
    const verifyResult = (await verifyResponse.json()) as { status?: string }

    if (verifyResult.status === 'ok') {
      return reply
        .code(200)
        .send({ message: 'Thank you for your token purchase!' })
    }

    return reply
      .code(402)
      .headers(
        paywallHeaders(receiverAccount.address, gatewayUrl, tokenContract),
      )
      .send({ message: 'Token content is not available' })
  })

  await app.listen({ host: HOST, port: APP_PORT })
  logStep(`Token content ready at http://${HOST}:${APP_PORT}`)

  const shutdown = async (): Promise<void> => {
    await Promise.allSettled([app.close(), hub.close(), iohtee.shutdown()])
  }

  process.once('SIGINT', () => {
    void shutdown().finally(() => process.exit(0))
  })
  process.once('SIGTERM', () => {
    void shutdown().finally(() => process.exit(0))
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
