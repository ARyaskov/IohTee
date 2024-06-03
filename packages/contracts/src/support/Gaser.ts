import { Conversion } from './Conversion'
import { PublicClient } from 'viem'

export class Gaser {
  client: PublicClient
  conversion: Conversion
  isEnabled: boolean

  constructor(client: PublicClient) {
    this.client = client
    this.conversion = new Conversion()
    this.isEnabled = Boolean(process.env.LOG_GAS_COST)
  }

  async diff<A>(
    name: string,
    account: `0x${string}`,
    fn: () => A,
    forceLog?: boolean,
  ): Promise<A> {
    let before = await this.client.getBalance({ address: account })
    let result = fn()
    let after = await this.client.getBalance({ address: account })
    let gasCost = this.conversion.weiToGas(before - after)
    this.log(gasCost, name, forceLog)
    return result
  }

  private log(gasCost: bigint, name: string, forceLog: boolean = false) {
    if (this.isEnabled || forceLog) {
      const usdCost = this.conversion.gasToUsd(gasCost).toFixed(2)
      console.log(`GAS: ${name}: ${gasCost} ($${usdCost})`)
    }
  }
}
