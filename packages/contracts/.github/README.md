# IohTee Contracts

IohTee contracts is a TypeScript interface for Ethereum contracts managed by [Hardhat](https://github.com/NomicFoundation/hardhat) used by [IohTee](https://github.com/ARyaskov/IohTee/tree/main/packages/iohtee).

## Install

Using [yarn v4](https://yarnpkg.com/blog/release/4.0) and Node.js **v20** is mandatory (**don't use npm!**)

    $ yarn add @riaskov/iohtee-contracts

## Building from sources

```bash
$ git clone git@github.com:ARyaskov/IohTee.git
$ cd IohTee/packages/contracts
$ yarn
$ yarn build
$ yarn test
```

:exclamation:
Please, pay attention, this package is the part of [IohTee Monorepo](https://github.com/ARyaskov/IohTee) 
and it's intended to use with other monorepo's packages. 

:no_entry: You **should not** git clone this repository alone

:white_check_mark: You **should** git clone the main repository via
```
git clone https://github.com/ARyaskov/IohTee.git
or 
git clone git@github.com:ARyaskov/IohTee.git
```

**For documentation, usage and contributing please see [IohTee Monorepo](https://github.com/ARyaskov/IohTee).**
