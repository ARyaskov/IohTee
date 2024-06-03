import "dotenv/config"
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
    },
    polygonAmoy: {
      url: process.env.POLYGON_AMOY_RPC_URL,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY_0],
      chainId: 80002
    }
  },
  etherscan: {
    apiKey: {
      polygonAmoy: process.env.POLYGONSCAN_API_KEY
    },
  }
}

export default config
