# IohTee ABI Wrapper

[![Module type: ESM](https://img.shields.io/badge/module%20type-ESM-brightgreen)]()
[![Target: Node20](https://img.shields.io/badge/Node.js->=20-brightgreen)]()
[![Target: ES2022](https://img.shields.io/badge/target-ES2022-brightgreen)]()

IohTee ABI Wrapper is a TypeScript wrapper for EVM-compatible ABI of Solidity smartcontract.
It takes raw json artifact file and render ready-to-use TS-wrapper. Use viem v2 internally.

## Install

```bash
 $ npm install @riaskov/iohtee-abi-wrapper --global --no-save
```

## Use

```bash
 $ iohtee-abi-wrapper -o ./generated ./abi/*
```

Now you can import generated contract's wrapper from `./generated` folder like
```typescript
import {
  CtorParams,
  XXXContract,
} from './generated/XXXContract'
```

## Recipes

1. Generate just regular TS wrappers for ABI files located in `./abi/*` and put them into `./generated`

```bash
 $ iohtee-abi-wrapper -o ./generated ./abi/*
```

2. Generate just regular TS wrappers for ABI files located in `./abi/*` AND minified js version of wrapper and put them into `./generated`

```bash
 $ iohtee-abi-wrapper -m -o ./generated ./abi/*
```

3. Generate just regular TS wrappers for ABI files located in `./abi/*` AND minified js version of wrapper and put them into `./generated` AND create a nice HTML-docs for wrapper

```bash
 $ iohtee-abi-wrapper -m -d ./docs -o ./generated ./abi/*
```
**ATTENTION!** All files in specified `docs` dir will be removed each time the command will be invoked!



## Generated TS-wrapper internals

After calling global command `iohtee-abi-wrapper`
```bash
 $ iohtee-abi-wrapper -o ./generated ./abi/*
```

you will get a TS wrapper file.

Say you have contract ABI with name `Unidirectional`, in this case TS wrapper classname will be `UnidirectionalContract`
Importing:
```typescript
import {
  CtorParams,
  UnidirectionalContract,
} from './generated/UnidirectionalContract'
```

Constructor:
```typescript
constructor(deployedContractAddress: `0x${string}`, params: CtorParams)
```

- `deployedContractAddress` is the blockchain contract address which will be used for interacting via TS-wrapper. 

- `CtorParams` object type consists of:
```typescript
{
  httpRpcUrl: string // RPC URL (e.g. Alchemy, Infura...) like https://rpc-amoy.polygon.technology
  networkId: number // Network ID or Chain ID like 80002 for Polygon Amoy
  mnemonic: string // 12-word seed mnemonic phrase
  hdPath: `m/44'/60'/${string}`  // BIP44 HDPath of account like m/44'/60'/0'/0/0 for the first account for the given seed
}
```

Generated HTML documentation for TS wrapper be like
![nice-docs](https://github.com/ARyaskov/IohTee/assets/3934848/935aee80-11c0-4f80-afeb-5f3ca9e5bbfe)

## TODO
- add postprocess with prettier and autodetecting of prettierrc
- TS-wrapper docs autogen
- add errors and library references handling
- generate d.ts and min.js wrapper files
- add solidity comments to wrapper


## License

Apache-2.0
