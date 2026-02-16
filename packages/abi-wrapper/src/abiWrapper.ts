import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import path from 'node:path'
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

function listJsonFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .filter(
      (entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'),
    )
    .map((entry) => path.join(directory, entry.name))
    .sort((left, right) => left.localeCompare(right))
}

function resolveInputFileNames(inputPath: string): string[] {
  const resolvedPath = path.resolve(inputPath)

  if (existsSync(resolvedPath)) {
    const stat = statSync(resolvedPath)
    if (stat.isFile()) {
      return [resolvedPath]
    }
    if (stat.isDirectory()) {
      return listJsonFiles(resolvedPath)
    }
  }

  if (inputPath.endsWith('/*') || inputPath.endsWith('\\*')) {
    const directoryPath = path.resolve(inputPath.slice(0, -2))
    if (existsSync(directoryPath) && statSync(directoryPath).isDirectory()) {
      return listJsonFiles(directoryPath)
    }
  }

  return []
}

export class AbiWrapper {
  private readonly templatesDir: string
  private readonly outputDir: string
  private readonly inputs: string[]
  private readonly minify: boolean
  private readonly docsDir: string | undefined
  private readonly backend: WrapperBackend

  constructor(
    inputs: string | string[],
    outputDir: string,
    minify = false,
    docsDir?: string,
    backend: WrapperBackend = 'viem',
  ) {
    this.inputs = Array.isArray(inputs) ? inputs : [inputs]
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

    const fileNames = [...new Set(this.inputs.flatMap(resolveInputFileNames))]
    if (!fileNames.length) {
      throw new Error(
        `No contract artifact found at ${this.inputs.join(', ')}. Supported inputs: a .json file, a directory, or directory/*`,
      )
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
