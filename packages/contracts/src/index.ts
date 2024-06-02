import { Web3 } from 'web3'
import UnidirectionalABI from '../build/contracts/Unidirectional.json'
import TokenUnidirectionalABI from '../build/contracts/TokenUnidirectional.json'
import {} from '@ethereumjs/util'
import { randomBytes } from '@ethereumjs/util'

export { UnidirectionalABI, TokenUnidirectionalABI }

export function randomId(digits: number = 3) {
  const datePart = new Date().getTime() * Math.pow(10, digits)
  const extraPart = Math.floor(Math.random() * Math.pow(10, digits)) // 3 random digits
  return datePart + extraPart // 16 digits
}

export function channelId(sender: string, receiver: string): string {
  return Buffer.from(randomBytes(16)).toString('hex')
}
