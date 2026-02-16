#!/usr/bin/env node

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { AbiWrapper } from '../index.js'
import type { WrapperBackend } from '../context.js'

type CliArgs = {
  _: (string | number)[]
  output: string
  minify: boolean
  docs?: string
  backend: WrapperBackend
}

async function main(): Promise<void> {
  const args = (await yargs(hideBin(process.argv))
    .scriptName('iohtee-abi-wrapper')
    .usage('$0 [options] <glob-pattern>')
    .option('output', {
      describe: 'Folder for generated files',
      alias: 'o',
      type: 'string',
      demandOption: true,
    })
    .option('minify', {
      describe: 'Also render minified JS-wrapper',
      alias: 'm',
      type: 'boolean',
      default: false,
    })
    .option('docs', {
      describe: 'Folder for generated docs',
      alias: 'd',
      type: 'string',
    })
    .option('backend', {
      describe: 'Generated backend implementation',
      alias: 'b',
      choices: ['viem', 'ethers'] as const,
      default: 'viem' as const,
    })
    .strictOptions()
    .demandCommand(1)
    .help()
    .parse()) as CliArgs

  if (!args._.length) {
    throw new Error('No ABI glob-pattern provided.')
  }

  const pattern = String(args._[0])
  const abiWrapper = new AbiWrapper(
    pattern,
    args.output,
    args.minify,
    args.docs,
    args.backend,
  )

  await abiWrapper.run()
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
