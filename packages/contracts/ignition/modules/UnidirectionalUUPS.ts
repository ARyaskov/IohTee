import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import { encodeFunctionData } from 'viem'

const UnidirectionalUUPSModule = buildModule(
  'UnidirectionalUUPSModule',
  (m) => {
    const owner = m.getParameter('owner', m.getAccount(0))
    const implementation = m.contract('UnidirectionalUpgradeable')

    const initData = encodeFunctionData({
      abi: [
        {
          type: 'function',
          name: 'initialize',
          stateMutability: 'nonpayable',
          inputs: [{ name: 'initialOwner', type: 'address' }],
          outputs: [],
        },
      ],
      functionName: 'initialize',
      args: [owner],
    })

    const proxy = m.contract('UUPSProxy', [implementation, initData])
    const unidirectional = m.contractAt('UnidirectionalUpgradeable', proxy)

    return { owner, implementation, proxy, unidirectional }
  },
)

export default UnidirectionalUUPSModule
