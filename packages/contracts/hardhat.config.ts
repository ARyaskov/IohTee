import "dotenv/config"
import "@nomicfoundation/hardhat-viem"
import "@nomicfoundation/hardhat-toolbox-viem"

const config = {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 31337
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY_0],
      chainId: 137
    },
    polygonAmoy: {
      url: process.env.POLYGON_AMOY_RPC_URL,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY_0],
      chainId: 80002
    }
  },
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY,
      polygonAmoy: process.env.POLYGONSCAN_API_KEY
    },
  }
}

export default config
