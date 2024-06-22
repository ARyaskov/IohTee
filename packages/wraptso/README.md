# IohTee ABI Wrapper

[![Module type: ESM](https://img.shields.io/badge/module%20type-ESM-brightgreen)]()
[![Target: ES2023](https://img.shields.io/badge/target-ES2023-brightgreen)]()

IohTee ABI Wrapper is a TypeScript wrapper for EVM-compatible ABI of Solidity smartcontract.
It takes raw json artifact file and render ready-to-use TS-wrapper. Use viem v2 internally.

## Run

```bash
 $ iohtee-abi-wrapper -o ./output ./abi 
```

## TODO
- add postprocess with prettier

:exclamation:
Please, pay attention, this package is the part of [IohTee Monorepo](https://github.com/ARyaskov/iohtee) 
and it's intended to use with other monorepo's packages. 

:no_entry: You **should not** git clone this repository alone

:white_check_mark: You **should** git clone the main repository via
```
git clone https://github.com/ARyaskov/iohtee.git
or 
git clone git@github.com:ARyaskov/iohtee.git
```

**For documentation, usage and contributing please see [IohTee Monorepo](https://github.com/ARyaskov/IohTee).**
