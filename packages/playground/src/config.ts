import 'dotenv/config'

export interface PlaygroundConfig {
  host: string
  port: number
  gatewayUrl: string
  receiverAddress: `0x${string}`
  paywallPriceWei: bigint
  tokenTtlMs: number
  sqlitePath: string
}

const DEFAULT_TOKEN_TTL_SECONDS = 30 * 60

function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function parseIntOrDefault(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function loadConfig(): PlaygroundConfig {
  const host = process.env.HOST?.trim() || '0.0.0.0'
  const port = parseIntOrDefault(process.env.PORT, 3000)
  const gatewayUrl = required('GATEWAY_URL').replace(/\/+$/, '')
  const receiverAddress = required('ACCOUNT_ADDRESS_0') as `0x${string}`
  const paywallPriceWei = BigInt(
    process.env.PAYWALL_PRICE_WEI?.trim() || '1000',
  )
  const tokenTtlSeconds = parseIntOrDefault(
    process.env.PAYWALL_TOKEN_TTL_SECONDS,
    DEFAULT_TOKEN_TTL_SECONDS,
  )
  const sqlitePath = process.env.PLAYGROUND_DB_PATH?.trim() || ':memory:'

  return {
    host,
    port,
    gatewayUrl,
    receiverAddress,
    paywallPriceWei,
    tokenTtlMs: tokenTtlSeconds * 1000,
    sqlitePath,
  }
}
