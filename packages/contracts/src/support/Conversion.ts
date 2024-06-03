import { parseEther, parseGwei } from 'viem'

// TODO dynamize it
const mainnetGasPrice: bigint = parseGwei(process.env.MAINNET_GAS_PRICE_GWEI!)
// @ts-ignore
const mainnetEthInUSD: bigint = new BigInt(process.env.MAINNET_ETH_IN_USD!)

const gasCostInUSD = (mainnetGasPrice * mainnetEthInUSD) / parseEther('1')

export class Conversion {
  weiToGas(weiAmount: bigint): bigint {
    return weiAmount / mainnetGasPrice
  }

  gasToUsd(gas: bigint): number {
    return Number(Number(gasCostInUSD * gas).toFixed(2))
  }
}
