#!/usr/bin/env node

import yargs from 'yargs'
import { AbiWrapper } from '../index.js'
import { hideBin } from 'yargs/helpers'

let args: any = yargs(hideBin(process.argv))
  .option('output', {
    describe: 'Folder for generated files',
    alias: 'o',
  })
  .option('minify', {
    describe: 'Also render minified JS-wrapper',
    alias: 'm',
  }).argv

if (args._.length === 0) {
  console.log('No arguments provided. Exiting...')
  process.exit(0)
}

const pattern = args._[0]
const outputDir = args['output']
const minify = args['minify']

let abiWrapper = new AbiWrapper(pattern, outputDir, minify)
abiWrapper
  .run()
  .then(() => {
    // Do Nothing
  })
  .catch((error: Error) => {
    console.error(error)
    process.exit(1)
  })
