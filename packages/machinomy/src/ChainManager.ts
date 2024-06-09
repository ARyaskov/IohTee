import Signature from './Signature'
import { WalletClient } from 'viem'

export default class ChainManager {
  private _walletClient: WalletClient

  constructor(walletClient: WalletClient) {
    this._walletClient = walletClient
  }

  async sign(address: `0x${string}`, data: `0x${string}`): Promise<Signature> {
    return new Promise<Signature>(async (resolve, reject) => {
      try {
        const signature = await this._walletClient.signMessage({
          message: data,
          account: address,
        })
        resolve(new Signature(signature))
      } catch (error) {
        reject(error)
      }
    })
  }
}
