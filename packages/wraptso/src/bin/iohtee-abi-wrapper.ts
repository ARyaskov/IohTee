#!/usr/bin/env node

import yargs from 'yargs'
import { AbiWrapper } from '../index.js'

let args: any = yargs(process.argv.slice(2)).option('output', {
  describe: 'Folder for generated files',
  alias: 'o',
}).argv

const pattern = args._[0]
const outputDir = args['output']

let abiWrapper = new AbiWrapper(pattern, outputDir)
abiWrapper
  .run()
  .then(() => {
    // Do Nothing
  })
  .catch((error: Error) => {
    console.error(error)
    process.exit(1)
  })
