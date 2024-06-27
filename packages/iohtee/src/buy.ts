import * as configuration from './configuration'
import Machinomy from './Machinomy'
import BuyResult from './BuyResult'
import { hdPath, httpRpc, mnemonic } from './configuration'
import MachinomyOptions from './MachinomyOptions'

/**
 * Shortcut for Sender.buy.
 */
export async function buyContent(
  uri: string,
  chainId: number,
): Promise<BuyResult> {
  let settings = configuration.sender()

  let client = new Machinomy({
    networkId: chainId,
    httpRpcUrl: httpRpc(),
    mnemonic: mnemonic(),
    hdPath: hdPath(),
    options: MachinomyOptions.defaults(),
  })
  let pair = await client.buyUrl(uri)
  await client.shutdown()
  return pair
}
