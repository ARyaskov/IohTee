# @riaskov/iohtee-playground

Fastify playground service for testing paywall flows end-to-end.

## Stack

- Node.js `>=24`
- TypeScript `6.0.0-beta`
- Fastify `5`
- `node:test`
- `node:sqlite`

## Run

```bash
pnpm --filter @riaskov/iohtee-playground run start
```

Build/test/lint:

```bash
pnpm --filter @riaskov/iohtee-playground run lint
pnpm --filter @riaskov/iohtee-playground run test
pnpm --filter @riaskov/iohtee-playground run build
```

## Environment

Required:

- `HOST`
- `PORT`
- `GATEWAY_URL` (base URL of payment gateway)
- `ACCOUNT_ADDRESS_0` (receiver account)

Optional:

- `PAYWALL_PRICE_WEI` (default: `1000`)
- `PAYWALL_TOKEN_TTL_SECONDS` (default: `1800`)
- `PLAYGROUND_DB_PATH` (default: `:memory:`)

## Routes

- `GET /health`
- `POST /payments/accept`
- `GET /hello` (paywalled)

`/payments/accept` proxies payment acceptance to configured gateway and caches token metadata in sqlite.
