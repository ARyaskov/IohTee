import fs from 'node:fs'
import ContractTemplate from './contractTemplate.js'
import {glob, globSync} from 'glob'
import { mkdirp } from 'mkdirp'
import path from 'node:path'

export class AbiWrapper {
  templatesDir: string
  outputDir: string
  pattern: string

  constructor(pattern: string, outputDir: string) {
    this.pattern = pattern
    this.templatesDir = path.join(import.meta.dirname, '../templates')
    this.outputDir = outputDir
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
        transformer.render(fileName)
      })
    } else {
      throw new Error(`No Truffle Contract artifact found at ${this.pattern}`)
    }
  }
}
