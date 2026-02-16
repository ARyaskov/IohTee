import 'dotenv/config'
import { defineConfig } from 'hardhat/config'
import * as hardhatToolboxViem from '@nomicfoundation/hardhat-toolbox-viem'
import * as hardhatNetworkHelpers from '@nomicfoundation/hardhat-network-helpers'

const config = defineConfig({
  plugins: [
    (hardhatToolboxViem as any).default ?? hardhatToolboxViem,
    (hardhatNetworkHelpers as any).default ?? hardhatNetworkHelpers,
  ],
  solidity: {
    version: '0.8.28',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: 'cancun',
    },
  },
  networks: {
    hardhat: {
      type: 'edr-simulated',
      chainId: 31337,
    },
    polygon: {
      type: 'http',
      url: process.env.POLYGON_RPC_URL ?? 'http://localhost:8545',
      accounts: process.env.ACCOUNT_PRIVATE_KEY_0
        ? [process.env.ACCOUNT_PRIVATE_KEY_0]
        : [],
      chainId: 137,
    },
    polygonAmoy: {
      type: 'http',
      url: process.env.POLYGON_AMOY_RPC_URL ?? 'http://localhost:8545',
      accounts: process.env.ACCOUNT_PRIVATE_KEY_0
        ? [process.env.ACCOUNT_PRIVATE_KEY_0]
        : [],
      chainId: 80002,
    },
  },
})

export default config
