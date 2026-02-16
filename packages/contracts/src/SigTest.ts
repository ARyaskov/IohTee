import { DefaultUnidirectionalAddress } from './common'
import {
  CtorParams,
  SigTestContract,
  isCtorAccountParamPure,
} from './abi-wrapper/SigTestContract'

export { CtorParams, isCtorAccountParamPure }

export class SigTest extends SigTestContract {
  constructor(
    deployedContractAddress: `0x${string}` | null,
    params: CtorParams,
  ) {
    const resolvedAddress = (() => {
      if (deployedContractAddress) {
        return deployedContractAddress
      }

      if (isCtorAccountParamPure(params)) {
        const address = DefaultUnidirectionalAddress[params.networkId]
        if (!address) {
          throw new Error(
            `No default SigTest address for networkId=${params.networkId}`,
          )
        }
        return address
      }

      const chainId = params.publicClientViem.chain?.id
      if (!chainId) {
        throw new Error('publicClientViem.chain.id is required')
      }
      const address = DefaultUnidirectionalAddress[chainId]
      if (!address) {
        throw new Error(`No default SigTest address for chainId=${chainId}`)
      }
      return address
    })()

    super(resolvedAddress, params)
  }
}
