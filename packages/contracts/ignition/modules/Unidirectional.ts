import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

const UnidirectionalModule = buildModule('UnidirectionalModule', (m) => {
  const unidirectional = m.contract('Unidirectional')

  return { unidirectional }
})

export default UnidirectionalModule
