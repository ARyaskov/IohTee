import "@nomicfoundation/hardhat-viem"
import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-waffle"
import "@nomicfoundation/hardhat-toolbox-viem"
import '@typechain/hardhat'

const config = {
  solidity: "0.8.20",
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 31337
    }
  }
}

export default config
