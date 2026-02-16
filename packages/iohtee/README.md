# @riaskov/iohtee

Micropayments library for EVM chains (ETH and token channels) over HTTP.

## Stack

- Node.js `>=22`
- TypeScript `6.0.0-beta` (strict)
- `viem` `2.45.0`
- Storage backends: `sqlite://` and `postgres://` / `postgresql://`

## Install

```bash
pnpm add @riaskov/iohtee
```

## Constructor (current API)

```ts
import { IohTee } from '@riaskov/iohtee'

const client = new IohTee({
  networkId: 80002,
  httpRpcUrl: process.env.RPC_URL!,
  mnemonic: process.env.ACCOUNT_MNEMONIC!,
  hdPath: "m/44'/60'/0'/0/0",
  options: {
    databaseUrl: 'sqlite:///absolute/path/to/iohtee.db',
  },
})
```

`web3`-style constructor is not supported anymore.

## Minimal flow

```ts
import { IohTee } from '@riaskov/iohtee'

const iohtee = new IohTee({
  networkId: 80002,
  httpRpcUrl: process.env.RPC_URL!,
  mnemonic: process.env.ACCOUNT_MNEMONIC!,
  hdPath: "m/44'/60'/0'/0/0",
})

const result = await iohtee.buy({
  receiver: '0x0000000000000000000000000000000000000001',
  price: 1000n,
  gateway: 'http://127.0.0.1:3001/accept',
  meta: 'purchase-1',
})

console.log(result.token, result.channelId)
await iohtee.shutdown()
```

## Public API highlights

- `buy(options)`
- `buyUrl(uri)`
- `payment(options)`
- `open(receiver, value, channelId?, tokenContract?)`
- `deposit(channelId, value)`
- `close(channelId)`
- `acceptPayment(req)`
- `acceptToken(req)`
- `channels()`, `openChannels()`, `settlingChannels()`, `channelById(id)`
- `paymentById(id)`
- `publicClient()`, `walletClient()`
- `shutdown()`

## Scripts (package development)

```bash
pnpm --filter @riaskov/iohtee run lint
pnpm --filter @riaskov/iohtee run test
pnpm --filter @riaskov/iohtee run build
```

## Notes

- `nedb` support removed.
- Use absolute sqlite path: `sqlite:///abs/path.db`.
