import fs from 'node:fs'
import fsExtra from 'fs-extra'
import ContractTemplate from './contractTemplate.js'
import { glob, globSync } from 'glob'
import { mkdirp } from 'mkdirp'
import { Application, TSConfigReader, TypeDocReader } from 'typedoc'
import path from 'node:path'

export function findNearestTsConfig(startPath: string): string | null {
  let currentDir = startPath

  while (true) {
    const tsConfigPath = path.join(currentDir, 'tsconfig.json')

    if (fs.existsSync(tsConfigPath)) {
      return tsConfigPath
    }

    const parentDir = path.dirname(currentDir)

    if (parentDir === currentDir) {
      return null
    }

    currentDir = parentDir
  }
}

export class AbiWrapper {
  templatesDir: string
  outputDir: string
  pattern: string
  minify: boolean
  docsDir: string | undefined

  constructor(
    pattern: string,
    outputDir: string,
    minify?: boolean,
    docsDir?: string,
  ) {
    this.pattern = pattern
    this.templatesDir = path.join(__dirname, '../templates')
    this.outputDir = outputDir
    this.minify = !!minify
    this.docsDir = docsDir
  }

  async generateDocs(filePath: string) {
    const tsConfigPath = findNearestTsConfig(filePath)
    const docsDirFull = path.resolve(this.docsDir!)
    fsExtra.emptyDirSync(docsDirFull)
    const filename = path.parse(filePath).name
    const outFolder = `${docsDirFull}/${filename}/`
    const app = await Application.bootstrap({
      entryPoints: [filePath],
      out: outFolder,
      excludeInternal: true,
      excludePrivate: true,
      tsconfig: tsConfigPath!,
      skipErrorChecking: true,
    })

    app.options.addReader(new TSConfigReader())
    app.options.addReader(new TypeDocReader())

    const project: any = await app.convert()
    if (project) {
      await app.generateDocs(project, outFolder)
      console.log('Documentation generated successfully!')
    } else {
      console.error('Documentation generation failed!')
    }
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
        if (this.docsDir) {
          const basename = path.basename(fileName, path.extname(fileName))
          const tsFilePath = path.resolve(
            `${this.outputDir}/${basename}Contract.ts`,
          )
          this.generateDocs(tsFilePath)
        }
      })
    } else {
      throw new Error(`No Truffle Contract artifact found at ${this.pattern}`)
    }
  }
}
