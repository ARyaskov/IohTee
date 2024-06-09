import * as configuration from './configuration'
import Machinomy from './Machinomy'
import BuyResult from './BuyResult'
import { httpRpc, mnemonic } from './configuration'
import { NetworkType } from '@riaskov/machinomy-contracts'
import MachinomyOptions from './MachinomyOptions'

/**
 * Shortcut for Sender.buy.
 */
export async function buyContent(
  uri: string,
  account: `0x${string}`,
  chain: NetworkType,
  password: string,
): Promise<BuyResult> {
  let settings = configuration.sender()

  let client = new Machinomy({
    network: chain,
    account: account,
    httpRpcUrl: httpRpc(chain),
    mnemonic: mnemonic(),
    options: MachinomyOptions.defaults(),
  })
  let pair = await client.buyUrl(uri)
  await client.shutdown()
  return pair
}
