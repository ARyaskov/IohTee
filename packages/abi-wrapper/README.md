# IohTee ABI Wrapper

[![Module type: ESM](https://img.shields.io/badge/module%20type-ESM-brightgreen)]()
[![Target: Node20](https://img.shields.io/badge/Node.js->=20-brightgreen)]()
[![Target: ES2022](https://img.shields.io/badge/target-ES2022-brightgreen)]()

IohTee ABI Wrapper is a TypeScript wrapper for EVM-compatible ABI of Solidity smartcontract.
It takes raw json artifact file and render ready-to-use TS-wrapper. Use viem v2 internally.

## Run

```bash
 $ iohtee-abi-wrapper -o ./output ./abi 
```

## TODO
- add postprocess with prettier
- TS-wrapper docs autogen
- add errors and library references handling
- generate d.ts and min.js wrapper files
- add solidity comments to wrapper
