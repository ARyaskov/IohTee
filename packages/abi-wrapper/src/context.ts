import { AbiParameter } from 'viem'
import { AbiEvent, AbiFunction } from 'viem'

export type WrapperBackend = 'viem' | 'ethers'

export interface MethodAbi extends AbiFunction {
  singleReturnValue: boolean
  namePostfix?: number
}

export interface TemplateHelpers {
  renderType: (
    solidityType: string,
    components?: readonly AbiParameter[],
  ) => string
  renderMethodInput: (
    inputs: MethodAbi['inputs'],
    trailingComma?: boolean,
  ) => string
  renderMethodOutput: (method: MethodAbi) => string
  renderParams: (inputs: MethodAbi['inputs']) => string
}

export default interface Context {
  artifact: string
  abi: string
  contractName: string
  relativeArtifactPath: string
  getters: MethodAbi[]
  functions: MethodAbi[]
  events: AbiEvent[]
  backend: WrapperBackend
  isViem: boolean
  isEthers: boolean
  helpers: TemplateHelpers
}
