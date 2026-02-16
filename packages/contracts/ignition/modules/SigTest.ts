import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

const SigTestModule = buildModule('SigTestModule', (m) => {
  const sigTest = m.contract('SigTest')

  return { sigTest }
})

export default SigTestModule
