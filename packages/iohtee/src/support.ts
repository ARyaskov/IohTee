export function randomInteger(): number {
  return Math.floor(Math.random() * 10000)
}

export function randomBigInt(): bigint {
  return BigInt(Math.floor(Math.random() * 10000))
}
