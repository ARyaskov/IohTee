import { BigNumber } from 'bignumber.js'

/**
 * Options for machinomy buy.
 */
export default interface BuyOptions {
  /** The address of Ethereum account. */
  receiver: string
  /** Price of content in wei. */
  price: number | BigNumber
  /** Endpoint for offchain payment that Machinomy send via HTTP.
   * The payment signed by web3 inside Machinomy.
   */
  gateway?: string,
  meta?: string,
  purchaseMeta?: object
  tokenContract?: string
}
