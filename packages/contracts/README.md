# @riaskov/iohtee-contracts

Smart contracts and TypeScript bindings for IohTee, built with Hardhat 3.

## Stack

- Node.js `>=22`
- Hardhat `3`
- Solidity `0.8.28` (`evmVersion: cancun`, optimizer enabled)
- `viem` toolchain
- OpenZeppelin Contracts `5.0.2`

## Contracts

Key contracts in `contracts/`:

- `Unidirectional.sol`
- `TokenUnidirectional.sol`
- `UnidirectionalUpgradeable.sol`
- `TokenUnidirectionalUpgradeable.sol`
- `UUPSProxy.sol`
- `UnidirectionalUpgradeableV2.sol` (upgrade example)

## Build and test

```bash
pnpm --filter @riaskov/iohtee-contracts run compile
pnpm --filter @riaskov/iohtee-contracts run test
pnpm --filter @riaskov/iohtee-contracts run build
pnpm --filter @riaskov/iohtee-contracts run coverage
```

## Deploy (Ignition)

Local hardhat node:

```bash
pnpm --filter @riaskov/iohtee-contracts run hardhat:node
```

Deploy modules:

```bash
pnpm --filter @riaskov/iohtee-contracts run deploy:local
pnpm --filter @riaskov/iohtee-contracts run deploy:uni:hardhat
pnpm --filter @riaskov/iohtee-contracts run deploy:uni:polygonAmoy
pnpm --filter @riaskov/iohtee-contracts run deploy:uni:uups:hardhat
pnpm --filter @riaskov/iohtee-contracts run deploy:uni:uups:polygonAmoy
pnpm --filter @riaskov/iohtee-contracts run deploy:token:uups:hardhat
pnpm --filter @riaskov/iohtee-contracts run deploy:token:uups:polygonAmoy
```

## Environment

Common variables:

- `ACCOUNT_PRIVATE_KEY_0`
- `POLYGON_RPC_URL`
- `POLYGON_AMOY_RPC_URL`

## Security notes

Upgradeable contracts use UUPS pattern with:

- initializer-based setup
- `_disableInitializers()` on implementation constructors
- owner-gated `_authorizeUpgrade`
- pausability and reentrancy protections in critical flows
