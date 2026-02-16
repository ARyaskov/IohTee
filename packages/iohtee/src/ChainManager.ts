import Signature from './Signature'
import { type LocalAccount } from 'viem/accounts'

export default class ChainManager {
  private readonly account: LocalAccount

  constructor(account: LocalAccount) {
    this.account = account
  }

  async sign(_address: `0x${string}`, data: `0x${string}`): Promise<Signature> {
    const signature = await this.account.signMessage({
      message: { raw: data },
    })
    return new Signature(signature)
  }
}
