import { BigNumber } from 'bignumber.js'
import { Web3 } from 'web3';
import Units from '../Units'

const GANACHE_GAS_PRICE = new BigNumber(20000000000) // wei
const ETH_IN_USD = 800

const GAS_COST_IN_USD = GANACHE_GAS_PRICE.multipliedBy(ETH_IN_USD).div(Units.convert(1, 'ether', 'wei'))

export default class Conversion {
  web3: Web3

  constructor (web3: Web3) {
    this.web3 = web3
  }

  ethToGas (eth: BigNumber): number {
    return eth.div(GANACHE_GAS_PRICE).toNumber()
  }

  gasToUsd (gas: number): number {
    // return gas * Conversion.GAS_COST_IN_USD
    return GAS_COST_IN_USD.multipliedBy(gas).toNumber()
  }
}
