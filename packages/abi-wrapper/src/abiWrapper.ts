import fs from 'node:fs'
import ContractTemplate from './contractTemplate.js'
import { glob, globSync } from 'glob'
import { mkdirp } from 'mkdirp'
import path from 'node:path'

export class AbiWrapper {
  templatesDir: string
  outputDir: string
  pattern: string
  minify: boolean

  constructor(pattern: string, outputDir: string, minify?: boolean) {
    this.pattern = pattern
    this.templatesDir = path.join(import.meta.dirname, '../templates')
    this.outputDir = outputDir
    this.minify = !!minify
  }

  async run(): Promise<void> {
    if (!fs.existsSync(this.outputDir)) {
      mkdirp.sync(this.outputDir)
    }
    const fileNames = globSync(this.pattern)
    if (fileNames.length) {
      fileNames.forEach((fileName) => {
        let transformer = new ContractTemplate(
          this.templatesDir,
          this.outputDir,
        )
        transformer.render(fileName, this.minify)
      })
    } else {
      throw new Error(`No Truffle Contract artifact found at ${this.pattern}`)
    }
  }
}
