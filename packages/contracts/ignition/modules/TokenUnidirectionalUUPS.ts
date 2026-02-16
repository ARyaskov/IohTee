import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import { encodeFunctionData } from 'viem'

const TokenUnidirectionalUUPSModule = buildModule(
  'TokenUnidirectionalUUPSModule',
  (m) => {
    const owner = m.getParameter('owner', m.getAccount(0))
    const implementation = m.contract('TokenUnidirectionalUpgradeable')

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
    const tokenUnidirectional = m.contractAt(
      'TokenUnidirectionalUpgradeable',
      proxy,
    )

    return { owner, implementation, proxy, tokenUnidirectional }
  },
)

export default TokenUnidirectionalUUPSModule
