# @riaskov/iohtee-abi-wrapper

CLI/codegen for generating TypeScript contract wrappers from Solidity ABI artifacts.

## Stack

- Node.js `>=22`
- TypeScript `6.0.0-beta`
- Template engine: `Eta`
- Backends: `viem` (default) and `ethers` (optional)

## Install

```bash
pnpm add -D @riaskov/iohtee-abi-wrapper
```

Or global:

```bash
pnpm add -g @riaskov/iohtee-abi-wrapper
```

## Tutorial: Solidity -> JSON ABI (Hardhat 3)

### 1. Create Hardhat 3 project

```bash
mkdir my-contracts && cd my-contracts
pnpm init
pnpm add -D hardhat typescript tsx
pnpm hardhat --init
```

Put your contract in `contracts/`, for example `contracts/Unidirectional.sol`.

### 2. Compile contracts

```bash
pnpm hardhat compile
```

Hardhat writes artifacts to:

`artifacts/contracts/<FileName>.sol/<ContractName>.json`

Example:

`artifacts/contracts/Unidirectional.sol/Unidirectional.json`

### 3. Extract ABI JSON

Hardhat artifact already contains `abi` field:

```json
{
  "abi": [ ... ]
}
```

You can pass this artifact directly to `iohtee-abi-wrapper`.


### 4. Generate wrappers

From artifact:

```bash
iohtee-abi-wrapper -o ./generated -b viem artifacts/contracts/Unidirectional.sol/Unidirectional.json
```

From pure ABI folder:

```bash
iohtee-abi-wrapper -o ./generated -b viem ./abi
```

## CLI usage

```bash
iohtee-abi-wrapper [options] <input...>
```

Examples:

```bash
# Generate wrappers with default backend (viem)
iohtee-abi-wrapper -o ./generated ./abi/*

# Generate wrappers from directory
iohtee-abi-wrapper -o ./generated ./abi
iohtee-abi-wrapper -o ./generated ./abi/

# Generate wrappers from multiple explicit files
iohtee-abi-wrapper -o ./generated ./abi/A.json ./abi/B.json

# Explicit viem backend
iohtee-abi-wrapper -o ./generated -b viem ./abi/*

# Ethers backend
iohtee-abi-wrapper -o ./generated -b ethers ./abi/*

# Generate minified wrappers
iohtee-abi-wrapper -o ./generated -m ./abi/*

# Generate docs
iohtee-abi-wrapper -o ./generated -d ./docs ./abi/*
```

Options:

- `-o, --output` output directory (required)
- `-b, --backend` `viem | ethers` (default: `viem`)
- `-m, --minify` generate minified js wrapper
- `-d, --docs` docs output directory

## Package scripts

```bash
pnpm --filter @riaskov/iohtee-abi-wrapper run lint
pnpm --filter @riaskov/iohtee-abi-wrapper run test
pnpm --filter @riaskov/iohtee-abi-wrapper run build
```

## Output

For `Unidirectional.json`, generator emits `UnidirectionalContract` wrapper and typings.

## Usage examples

### Unidirectional + viem backend

```ts
// generated with:
// iohtee-abi-wrapper -o ./generated-viem -b viem ./abi/Unidirectional.json
import {
  UnidirectionalContract,
  UnidirectionalEventName,
} from './generated-viem/UnidirectionalContract.js'

const contract = new UnidirectionalContract(
  '0x1111111111111111111111111111111111111111',
  {
    httpRpcUrl: 'http://127.0.0.1:8545',
    networkId: 31337,
    mnemonic: 'test test test test test test test test test test test junk',
    hdPath: "m/44'/60'/0'/0/0",
  },
)

const channelId =
  '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',

// view call
const canDeposit = await contract.canDeposit(
  channelId,
  '0x2222222222222222222222222222222222222222',
)
console.log('canDeposit:', canDeposit)

// state-changing call
const receipt = await contract.deposit(channelId, { value: 1_000_000_000_000n })
const hasDepositEvent = UnidirectionalContract.hasEvent(
  receipt,
  UnidirectionalEventName.DidDeposit,
)
console.log('DidDeposit emitted:', hasDepositEvent)
```

### Unidirectional + ethers backend

```ts
// generated with:
// iohtee-abi-wrapper -o ./generated-ethers -b ethers ./abi/Unidirectional.json
import {
  UnidirectionalContract,
  UnidirectionalEventName,
} from './generated-ethers/UnidirectionalContract.js'

const contract = new UnidirectionalContract(
  '0x1111111111111111111111111111111111111111',
  {
    httpRpcUrl: 'http://127.0.0.1:8545',
    networkId: 31337,
    mnemonic: 'test test test test test test test test test test test junk',
    hdPath: "m/44'/60'/0'/0/0",
  },
)

const channelId =
  '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',

// view call
const digest = await contract.paymentDigest(channelId, 10n)
console.log('paymentDigest:', digest)

// state-changing call
const receipt = await contract.deposit(channelId, { value: 1_000_000_000_000n })
const hasDepositEvent = UnidirectionalContract.hasEvent(
  receipt,
  UnidirectionalEventName.DidDeposit,
)
console.log('DidDeposit emitted:', hasDepositEvent)
```
