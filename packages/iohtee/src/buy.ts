import * as configuration from './configuration'
import IohTee from './IohTee'
import BuyResult from './BuyResult'
import { hdPath, httpRpc, mnemonic } from './configuration'
import IohTeeOptions from './IohTeeOptions'

/**
 * Shortcut for Sender.buy.
 */
export async function buyContent(
  uri: string,
  chainId: number,
): Promise<BuyResult> {
  let settings = configuration.sender()

  let client = new IohTee({
    networkId: chainId,
    httpRpcUrl: httpRpc(),
    mnemonic: mnemonic(),
    hdPath: hdPath(),
    options: IohTeeOptions.defaults(),
  })
  let pair = await client.buyUrl(uri)
  await client.shutdown()
  return pair
}
