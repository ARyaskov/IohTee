import 'dotenv/config'
import { bytesToHex } from 'viem'

export function channelId(): `0x${string}` {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32))
  const randomHexValue = bytesToHex(randomBytes)
  return randomHexValue
}
