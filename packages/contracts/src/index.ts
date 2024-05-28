import { Unidirectional } from './wrappers/Unidirectional'
import { TokenUnidirectional } from './wrappers/TokenUnidirectional'
import { TestToken } from './wrappers/TestToken'
import { bufferToHex } from '@ethereumjs/util'
import { Web3 } from 'web3'

export {
  Unidirectional,
  TokenUnidirectional,
  TestToken
}

export function randomId (digits: number = 3) {
  const datePart = new Date().getTime() * Math.pow(10, digits)
  const extraPart = Math.floor(Math.random() * Math.pow(10, digits)) // 3 random digits
  return datePart + extraPart // 16 digits
}

export function channelId (sender: string, receiver: string): string {
  let random = randomId()
  let buffer = Web3.utils.soliditySha3(sender + receiver + random)
  return bufferToHex(buffer)
}
