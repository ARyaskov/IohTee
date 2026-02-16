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

## CLI usage

```bash
iohtee-abi-wrapper [options] <glob-pattern>
```

Examples:

```bash
# Generate wrappers with default backend (viem)
iohtee-abi-wrapper -o ./generated ./abi/*

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
