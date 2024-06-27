import Signature from './Signature'
import { ethers, Wallet } from 'ethers'

export default class ChainManager {
  private wallet: Wallet

  constructor(wallet: Wallet) {
    this.wallet = wallet
  }

  async sign(address: `0x${string}`, data: `0x${string}`): Promise<Signature> {
    return new Promise<Signature>(async (resolve, reject) => {
      try {
        const signature = await this.wallet.signMessage(ethers.getBytes(data))
        resolve(new Signature(signature))
      } catch (error) {
        reject(error)
      }
    })
  }
}
