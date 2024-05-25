import { BigNumber } from 'bignumber.js'

export function randomInteger (): number {
  return Math.floor(Math.random() * 10000)
}

export function randomBigNumber (): BigNumber {
  return new BigNumber(Math.floor(Math.random() * 10000))
}
