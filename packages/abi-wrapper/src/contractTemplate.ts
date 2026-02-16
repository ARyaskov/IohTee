import path from 'node:path'
import { readFileSync, writeFileSync } from 'node:fs'
import { Abi, AbiEvent, AbiFunction, AbiParameter, AbiItem } from 'viem'
import { build } from 'esbuild'
import { Eta } from 'eta'
import { format as formatWithPrettier } from 'prettier'
import Context, { MethodAbi, WrapperBackend } from './context.js'
import { createTemplateHelpers } from './helpers.js'

const ABI_TYPE_FUNCTION = 'function'
const ABI_TYPE_EVENT = 'event'

function isAbiFunction(abi: AbiItem): abi is AbiFunction {
  return abi.type === ABI_TYPE_FUNCTION
}

function isAbiEvent(abi: AbiItem): abi is AbiEvent {
  return abi.type === ABI_TYPE_EVENT
}

function buildTemplateName(backend: WrapperBackend): string {
  return backend === 'ethers' ? 'contract.ethers.eta' : 'contract.viem.eta'
}

function normalizeMethods(abiMethods: AbiFunction[]): MethodAbi[] {
  const nameCount: Record<string, number> = {}

  return abiMethods.map((abi) => {
    const normalized: MethodAbi = {
      ...abi,
      singleReturnValue: abi.outputs.length === 1,
      inputs: abi.inputs.map((input, index) => ({
        ...input,
        name: input.name || `param${index}`,
      })) as AbiParameter[],
    }

    const originalName = normalized.name
    if (nameCount[originalName] !== undefined) {
      nameCount[originalName] += 1
      normalized.namePostfix = nameCount[originalName]
    } else {
      nameCount[originalName] = 0
    }

    return normalized
  })
}

type ArtifactLike = {
  abi: Abi
  [key: string]: unknown
}

function parseArtifactOrRawAbi(
  abiFilePath: string,
  fileContent: string,
): ArtifactLike {
  const parsed = JSON.parse(fileContent) as unknown

  if (Array.isArray(parsed)) {
    return { abi: parsed as Abi }
  }

  if (parsed && typeof parsed === 'object') {
    const artifact = parsed as { abi?: unknown; [key: string]: unknown }
    if (Array.isArray(artifact.abi)) {
      return {
        ...artifact,
        abi: artifact.abi as Abi,
      }
    }
  }

  throw new Error(
    `No ABI found in ${abiFilePath}. Expected either a raw ABI array or an artifact object with "abi".`,
  )
}

export default class ContractTemplate {
  private readonly eta: Eta
  private readonly outputDir: string
  private readonly backend: WrapperBackend

  constructor(
    templatesDir: string,
    outputDir: string,
    backend: WrapperBackend,
  ) {
    this.eta = new Eta({
      views: templatesDir,
      autoEscape: false,
      autoTrim: false,
    })
    this.outputDir = outputDir
    this.backend = backend
  }

  async render(abiFilePath: string, minified?: boolean): Promise<void> {
    const artifact = parseArtifactOrRawAbi(
      abiFilePath,
      readFileSync(abiFilePath, 'utf8'),
    )
    const abi = artifact.abi

    const sourceAbi = JSON.stringify(abi)
    const methods = normalizeMethods(abi.filter(isAbiFunction))

    const getters = methods.filter(
      (method) =>
        method.stateMutability === 'view' || method.stateMutability === 'pure',
    )
    const functions = methods.filter(
      (method) =>
        method.stateMutability !== 'view' && method.stateMutability !== 'pure',
    )
    const events = abi.filter(isAbiEvent)

    const contractName = path.parse(abiFilePath).name
    const basename = path.basename(abiFilePath, path.extname(abiFilePath))
    const filePath = path.resolve(this.outputDir, `${basename}Contract.ts`)
    const relativeArtifactPath = path.relative(this.outputDir, abiFilePath)

    const context: Context = {
      artifact: JSON.stringify(artifact, null, 2),
      abi: sourceAbi,
      contractName,
      relativeArtifactPath,
      getters,
      functions,
      events,
      backend: this.backend,
      isViem: this.backend === 'viem',
      isEthers: this.backend === 'ethers',
      helpers: createTemplateHelpers(),
    }

    const templateName = buildTemplateName(this.backend)
    const code = await this.eta.renderAsync(templateName, context)
    if (!code) {
      throw new Error(`Unable to render template: ${templateName}`)
    }

    const formattedCode = await formatWithPrettier(code, {
      parser: 'typescript',
      singleQuote: true,
      semi: false,
      trailingComma: 'all',
      printWidth: 80,
    })

    writeFileSync(filePath, formattedCode, 'utf8')

    if (!minified) return

    await build({
      entryPoints: [filePath],
      outfile: `${filePath}.min.js`,
      bundle: false,
      minify: true,
      format: 'esm',
      platform: 'node',
      sourcemap: false,
      target: ['es2022'],
    })
  }
}
