import { rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isAddress } from 'viem'

export interface RuntimeConfig {
  chainId: number
  mnemonic: string
  rpcUrl: string
}

export function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function requiredAddress(value: string, label: string): `0x${string}` {
  if (!isAddress(value)) {
    throw new Error(`Invalid address in ${label}: ${value}`)
  }
  return value
}

export function requiredAddressEnv(name: string): `0x${string}` {
  return requiredAddress(requiredEnv(name), name)
}

export function requiredAddressHeader(
  headers: Headers,
  name: string,
): `0x${string}` {
  const value = headers.get(name)
  if (!value) {
    throw new Error(`Missing required response header: ${name}`)
  }
  return requiredAddress(value, name)
}

export function runtimeConfig(): RuntimeConfig {
  const chainId = Number(requiredEnv('CHAIN_ID'))
  if (!Number.isInteger(chainId) || chainId <= 0) {
    throw new Error(`Invalid CHAIN_ID value: ${String(process.env.CHAIN_ID)}`)
  }

  return {
    chainId,
    mnemonic: requiredEnv('ACCOUNT_MNEMONIC'),
    rpcUrl: requiredEnv('RPC_URL'),
  }
}

export function dirnameFromMeta(metaUrl: string): string {
  return dirname(fileURLToPath(metaUrl))
}

export function resolveDataFile(metaUrl: string, fileName: string): string {
  return resolve(dirnameFromMeta(metaUrl), '..', fileName)
}

export function sqliteUrl(metaUrl: string, fileName: string): string {
  return `sqlite://${resolveDataFile(metaUrl, fileName)}`
}

export function removeIfExists(path: string) {
  rmSync(path, { force: true })
}

export function logStep(label: string, value?: unknown) {
  if (typeof value === 'undefined') {
    console.log(`[examples] ${label}`)
    return
  }
  console.log(`[examples] ${label}`, value)
}

export function isHexToken(value: string): value is `0x${string}` {
  return /^0x[0-9a-fA-F]{64}$/.test(value)
}
