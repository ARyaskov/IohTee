/**
 * Options for machinomy buy.
 */
export default interface BuyOptions {
  /** The address of Ethereum account. */
  receiver: `0x${string}`
  /** Price of content in wei. */
  price: bigint
  /** Endpoint for offchain payment that Machinomy send via HTTP.
   * The payment signed by web3 inside Machinomy.
   */
  gateway?: string
  meta?: string
  purchaseMeta?: object
  tokenContract?: `0x${string}`
}
