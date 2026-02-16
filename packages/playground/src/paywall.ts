import type { FastifyReply, FastifyRequest, RouteHandlerMethod } from 'fastify'
import { PlaygroundConfig } from './config.js'
import { SqliteTokenStore } from './sqliteStore.js'

const PAYMENTS_PREFIX = '/payments'
const AUTH_SCHEME = 'paywall'
const TOKEN_REGEX = /^0x[0-9a-fA-F]{64}$/

export interface ParsedAuthorization {
  token: string
  meta?: string
  priceWei?: bigint
}

export function parsePaywallAuthorization(
  authorizationHeader: string | undefined,
): ParsedAuthorization | null {
  if (!authorizationHeader) return null

  const parts = authorizationHeader.trim().split(/\s+/)
  if (parts.length < 2) return null

  const [scheme, token, meta, priceWeiRaw] = parts
  if (!scheme || scheme.toLowerCase() !== AUTH_SCHEME) return null
  if (!token || !TOKEN_REGEX.test(token)) return null

  let priceWei: bigint | undefined
  if (priceWeiRaw) {
    try {
      priceWei = BigInt(priceWeiRaw)
    } catch {
      return null
    }
  }

  const parsed: ParsedAuthorization = { token }
  if (meta) parsed.meta = meta
  if (priceWei !== undefined) parsed.priceWei = priceWei
  return parsed
}

function paywallHeaders(
  receiverAddress: `0x${string}`,
  gatewayUrl: string,
  priceWei: bigint,
): Record<string, string> {
  return {
    'paywall-version': '1.0',
    'paywall-price': priceWei.toString(),
    'paywall-address': receiverAddress,
    'paywall-gateway': `${gatewayUrl}${PAYMENTS_PREFIX}/accept`,
  }
}

async function verifyTokenWithGateway(config: PlaygroundConfig, token: string) {
  const response = await fetch(
    `${config.gatewayUrl}${PAYMENTS_PREFIX}/verify/${token}`,
    {
      method: 'GET',
      headers: { 'content-type': 'application/json' },
    },
  )
  return response.ok
}

export function createPaywalledRouteHandler(
  config: PlaygroundConfig,
  store: SqliteTokenStore,
  handler: RouteHandlerMethod,
  priceWei = config.paywallPriceWei,
): RouteHandlerMethod {
  return async function paywalledHandler(this, request, reply) {
    const parsed = parsePaywallAuthorization(
      request.headers.authorization as string | undefined,
    )

    if (!parsed) {
      return reply
        .status(402)
        .headers(
          paywallHeaders(config.receiverAddress, config.gatewayUrl, priceWei),
        )
        .send('Payment Required')
    }

    const isCachedValid = store.isTokenValid(parsed.token)
    if (isCachedValid) {
      return handler.call(this, request, reply)
    }

    const isValid = await verifyTokenWithGateway(config, parsed.token)
    if (!isValid) {
      return reply
        .status(409)
        .headers(
          paywallHeaders(config.receiverAddress, config.gatewayUrl, priceWei),
        )
        .send('Payment Invalid')
    }

    store.markVerified(parsed.token, config.tokenTtlMs)
    return handler.call(this, request, reply)
  }
}

export async function forwardAcceptPayment(
  request: FastifyRequest,
  reply: FastifyReply,
  config: PlaygroundConfig,
  store: SqliteTokenStore,
) {
  const response = await fetch(
    `${config.gatewayUrl}${PAYMENTS_PREFIX}/accept`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request.body ?? {}),
    },
  )

  const payload = await response.json()
  const token = (payload as { token?: unknown }).token

  if (typeof token === 'string' && TOKEN_REGEX.test(token)) {
    store.putAcceptedToken(token, config.tokenTtlMs, payload)
  }

  reply
    .status(202)
    .header('paywall-token', typeof token === 'string' ? token : '')
    .send(payload)
}
