# @riaskov/iohtee-examples

Runnable examples for `@riaskov/iohtee` covering ETH and token payment flows.

## Stack

- Node.js `>=24`
- TypeScript `6.0.0-beta`
- `viem` `2.45.0`
- Fastify-based demo gateways

## Setup

```bash
cp example.env .env
```

Fill at least:

- `RPC_URL`
- `CHAIN_ID`
- `ACCOUNT_MNEMONIC`
- `PAYMENT_META`
- `TOKEN_CONTRACT` (for token flows)
- `TOKEN_UNIDIRECTIONAL_ADDRESS` (for token channel settlement)

## ETH flow scripts

```bash
pnpm --filter @riaskov/iohtee-examples run hub
pnpm --filter @riaskov/iohtee-examples run client
pnpm --filter @riaskov/iohtee-examples run sender
pnpm --filter @riaskov/iohtee-examples run receiver
```

## Token flow scripts

```bash
pnpm --filter @riaskov/iohtee-examples run hub:tokens
pnpm --filter @riaskov/iohtee-examples run client:tokens
pnpm --filter @riaskov/iohtee-examples run sender:tokens
pnpm --filter @riaskov/iohtee-examples run receiver:tokens
```

## Lifecycle scenario

```bash
pnpm --filter @riaskov/iohtee-examples run machinomy
```

## Quality gates

```bash
pnpm --filter @riaskov/iohtee-examples run lint
pnpm --filter @riaskov/iohtee-examples run test
pnpm --filter @riaskov/iohtee-examples run build
```
