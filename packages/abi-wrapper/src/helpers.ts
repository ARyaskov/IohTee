import { AbiParameter } from 'viem'
import { MethodAbi, TemplateHelpers } from './context.js'

type Mapping = {
  regex: RegExp
  tsType: string
}

const TYPE_MAPPING: Mapping[] = [
  { regex: /^string$/, tsType: 'string' },
  { regex: /^address$/, tsType: '`0x${string}`' },
  { regex: /^bool$/, tsType: 'boolean' },
  { regex: /^u?int\d*$/, tsType: 'bigint' },
  { regex: /^bytes\d*$/, tsType: '`0x${string}`' },
]

const INPUT_TYPE_MAPPING: Mapping[] = [
  { regex: /^u?int(8|16|32|64|128|256)?$/, tsType: 'bigint' },
  ...TYPE_MAPPING,
]

const ARRAY_BRACES = /\[\d*]$/

function isArray(solidityType: string): boolean {
  return ARRAY_BRACES.test(solidityType)
}

function isTuple(solidityType: string): boolean {
  return solidityType.includes('tuple')
}

function typeConversion(
  types: Mapping[],
  solidityType: string,
  components?: readonly AbiParameter[],
): string {
  if (isArray(solidityType)) {
    const solidityItemType = solidityType.replace(ARRAY_BRACES, '')
    const type = typeConversion(types, solidityItemType, components)
    return `${type}[]`
  }

  if (isTuple(solidityType) && components?.length) {
    return `[${components
      .map((component) =>
        typeConversion(types, component.type, getComponents(component)),
      )
      .join(', ')}]`
  }

  const mapping = types.find((item) => item.regex.test(solidityType))
  if (!mapping) {
    throw new Error(`Unknown Solidity type found: ${solidityType}`)
  }

  return mapping.tsType
}

export function inputType(
  solidityType: string,
  components?: readonly AbiParameter[],
): string {
  return typeConversion(INPUT_TYPE_MAPPING, solidityType, components)
}

export function outputType(
  solidityType: string,
  components?: readonly AbiParameter[],
): string {
  return typeConversion(TYPE_MAPPING, solidityType, components)
}

function methodParamName(input: AbiParameter, index: number): string {
  return input.name || `param${index}`
}

function getComponents(
  parameter: AbiParameter,
): readonly AbiParameter[] | undefined {
  return 'components' in parameter ? parameter.components : undefined
}

export function renderMethodInput(
  inputs: readonly AbiParameter[],
  trailingComma = false,
): string {
  if (!inputs.length) {
    return ''
  }

  const rendered = inputs
    .map(
      (input, index) =>
        `${methodParamName(input, index)}: ${inputType(input.type, getComponents(input))}`,
    )
    .join(', ')

  return trailingComma ? `${rendered}, ` : rendered
}

export function renderParams(inputs: readonly AbiParameter[]): string {
  return inputs.map((input, index) => methodParamName(input, index)).join(', ')
}

export function renderMethodOutput(method: MethodAbi): string {
  if (!method.outputs.length) {
    return 'void'
  }

  if (method.singleReturnValue) {
    const single = method.outputs[0]!
    return outputType(single.type, getComponents(single))
  }

  return `[${method.outputs
    .map((output) => outputType(output.type, getComponents(output)))
    .join(', ')}]`
}

export function createTemplateHelpers(): TemplateHelpers {
  return {
    renderType: outputType,
    renderMethodInput,
    renderMethodOutput,
    renderParams,
  }
}
