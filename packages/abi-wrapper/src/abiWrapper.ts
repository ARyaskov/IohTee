import { existsSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { globSync } from 'glob'
import { Application, TSConfigReader, TypeDocReader } from 'typedoc'
import ContractTemplate from './contractTemplate.js'
import { WrapperBackend } from './context.js'

export function findNearestTsConfig(startPath: string): string | null {
  let currentDir = startPath
  if (!currentDir.endsWith(path.sep)) {
    currentDir = path.dirname(currentDir)
  }

  while (true) {
    const tsConfigPath = path.join(currentDir, 'tsconfig.json')
    if (existsSync(tsConfigPath)) {
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
  private readonly templatesDir: string
  private readonly outputDir: string
  private readonly pattern: string
  private readonly minify: boolean
  private readonly docsDir: string | undefined
  private readonly backend: WrapperBackend

  constructor(
    pattern: string,
    outputDir: string,
    minify = false,
    docsDir?: string,
    backend: WrapperBackend = 'viem',
  ) {
    this.pattern = pattern
    this.templatesDir = path.join(__dirname, '../templates')
    this.outputDir = outputDir
    this.minify = minify
    this.docsDir = docsDir
    this.backend = backend
  }

  async generateDocs(filePath: string): Promise<void> {
    if (!this.docsDir) {
      return
    }

    const tsConfigPath = findNearestTsConfig(filePath)
    if (!tsConfigPath) {
      throw new Error(`No tsconfig.json found for ${filePath}`)
    }

    const docsDirFull = path.resolve(this.docsDir)

    const filename = path.parse(filePath).name
    const outFolder = path.join(docsDirFull, filename)

    const app = await Application.bootstrap({
      entryPoints: [filePath],
      out: outFolder,
      excludeInternal: true,
      excludePrivate: true,
      tsconfig: tsConfigPath,
      skipErrorChecking: true,
    })

    app.options.addReader(new TSConfigReader())
    app.options.addReader(new TypeDocReader())

    const project = await app.convert()
    if (!project) {
      throw new Error('Documentation generation failed')
    }

    await app.generateDocs(project, outFolder)
  }

  async run(): Promise<void> {
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true })
    }

    const fileNames = globSync(this.pattern)
    if (!fileNames.length) {
      throw new Error(`No contract artifact found at ${this.pattern}`)
    }

    if (this.docsDir) {
      const docsDirFull = path.resolve(this.docsDir)
      rmSync(docsDirFull, { recursive: true, force: true })
      mkdirSync(docsDirFull, { recursive: true })
    }

    for (const fileName of fileNames) {
      const transformer = new ContractTemplate(
        this.templatesDir,
        this.outputDir,
        this.backend,
      )
      await transformer.render(fileName, this.minify)

      if (!this.docsDir) continue

      const basename = path.basename(fileName, path.extname(fileName))
      const tsFilePath = path.resolve(this.outputDir, `${basename}Contract.ts`)
      await this.generateDocs(tsFilePath)
    }
  }
}
