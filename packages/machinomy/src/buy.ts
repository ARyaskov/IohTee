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
  account: `0x${string}`,
  chainId: number,
  password: string,
): Promise<BuyResult> {
  let settings = configuration.sender()

  let client = new Machinomy({
    networkId: chainId,
    account: account,
    httpRpcUrl: httpRpc(),
    mnemonic: mnemonic(),
    hdPath: hdPath(),
    options: MachinomyOptions.defaults(),
  })
  let pair = await client.buyUrl(uri)
  await client.shutdown()
  return pair
}
