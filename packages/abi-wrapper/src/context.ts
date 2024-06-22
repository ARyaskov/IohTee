import { AbiEvent, AbiFunction } from 'viem'

export interface MethodAbi extends AbiFunction {
  singleReturnValue: boolean
}

export default interface Context {
  artifact: string
  abi: string
  contractName: string
  relativeArtifactPath: string
  getters: Array<AbiFunction>
  functions: Array<AbiFunction>
  events: Array<AbiEvent>
}
