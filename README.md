# IohTee Monorepo 
[![Module type: CJS+ESM](https://img.shields.io/badge/module%20type-cjs%2Besm-brightgreen)]()
[![Coverage Status][codecov-img]][codecov]
[![Greenkeeper badge](https://badges.greenkeeper.io/machinomy/machinomy.svg)](https://greenkeeper.io/)
[![Dependabot](https://badgen.net/badge/Dependabot/enabled/green?icon=dependabot)](https://dependabot.com/)

[codecov]: https://codecov.io/gh/machinomy/machinomy
[codecov-img]: https://codecov.io/gh/machinomy/machinomy/branch/master/graph/badge.svg

### ! Upgrading to v2 is in progress! Expect bugs !

IohTee Monorepo repository. The second life of [Machinomy library](https://github.com/machinomy/machinomy).
We're upgrading it to contemporary standards (TypeScript 5+, Node.js 18+, ES2023+) and adding new features.

Available sub-projects:
- [IohTee](packages/iohtee) is a Node.js library for micropayments in Ether over HTTP. It allows you to send and receive a minuscule amount of money instantly.
- [Contracts](packages/contracts) is a TypeScript interface for Ethereum contracts managed by [HardHat](https://github.com/NomicFoundation/hardhat) used by [IohTee](packages/iohtee).
- [Examples](packages/examples) is [IohTee](packages/iohtee) examples.
- [Playground](packages/playground) contains code of play.iohtee.toivo.tech


## Tasks in progress

- support for dual build ESM+CJS

Web site:
Twitter:
FAQ: 

## Installation

[//]: # (Using [yarn]&#40;https://yarnpkg.com/lang/en/&#41; and Node.js **v18** is mandatory &#40;**don't use npm!**&#41;)

[//]: # ()
[//]: # (    $ yarn add machinomy)

[//]: # ()
[//]: # (The library supports mainnet, Ropsten, and [Rinkeby]&#40;https://www.rinkeby.io/&#41; networks.)

## Tinkering

It takes two to tango: a seller and a buyer. Seller is `packages/examples/src/server.ts` script. Build it or run through node-ts.
```
$ git clone https://github.com/ARyaskov/IohTee
$ cd IohTee && yarn && yarn build
$ node packages/examples/src/hub.js
```

And then run client script:

```
$ node packages/examples/src/client.js
```

## Usage

### Buy

Using TypeScript

```typescript
import { IohTee } from '@riaskov/iohtee'
const uri = 'http://localhost:3000/content'

const iohtee = new IohTee(SENDER_ACCOUNT, web3)
const contents = await iohtee.buy({ receiver: RECEIVER_ACCOUNT, price: 100, gateway: 'http://localhost:3001/accept' })
console.log(contents)
```

### Sell

The process is more convoluted than buying. Better consult [packages/examples/src/server.ts](packages/examples/src/server.ts) file.

### Sending payments through channels

```
$ git clone https://github.com/ARyaskov/IohTee
$ cd IohTee && yarn && yarn build && cd packages/examples
$ yarn run sender && yarn run receiver
```

Look at [sender.ts](packages/examples/src/sender.ts) and [receiver.ts](packages/examples/src/receiver.ts) for more information.

## Aux

If you want to see all logs in verbose format use `DEBUG=*`

## Documentation

For more advanced documentation go to [doc/](doc/) folder.

## Contributing

**Developers:** IohTee is for you. Feel free to use it, break it, fork it, and make the world better. The code is standard TypeScript, no special skills required:

    $ yarn

Using [yarn v4](https://yarnpkg.com/lang/en/) is mandatory (**don't use npm!**)

Apply migrations (eg. for PostgreSQL, refer [packages/iohtee/database.json](packages/iohtee/database.json)):

    $ PGUSER=user PGPASSWORD=pass PGHOSTADDR=localhost PGDATABASE=dbname yarn migrate

**Non-Developers:** You are lovely. As a starter, help us spread the word! Tell a friend right now.
If not enough, developers need flesh-world guidance. It starts with proper documentation and a pinch of fantasy.
Really anything, whether it is a short post on a use case of IoT micropayments, addition to the documentation (code comments, yay!),
or an elaborate analysis of machine economy implications.

## License

Licensed under [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0).
