type Mapping = {
  regex: string
  tsType: string
}

const TYPE_MAPPING = [
  { regex: '^string$', tsType: 'string' },
  { regex: '^address$', tsType: '`0x${string}`' },
  { regex: '^bool$', tsType: 'boolean' },
  { regex: '^u?int\\d*$', tsType: 'bigint' },
  { regex: '^bytes\\d*$', tsType: '`0x${string}`' },
]

const INPUT_TYPE_MAPPING = [
  { regex: '^u?int(8|16|32|64|128|256)?$', tsType: 'bigint' },
].concat(TYPE_MAPPING)

const ARRAY_BRACES = /\[\d*]$/

function isArray(solidityType: string): boolean {
  return !!solidityType.match(ARRAY_BRACES)
}

function isTuple(solidityType: string): boolean {
  return !!solidityType.match('tuple')
}

function typeConversion(
  types: Array<Mapping>,
  solidityType: string,
  components?: Array<any>,
): string {
  if (isArray(solidityType)) {
    const solidityItemType = solidityType.replace(ARRAY_BRACES, '')
    const type = typeConversion(types, solidityItemType)
    return `${type}[]`
  } else if (isTuple(solidityType) && components) {
    return `[${components.map((e) => inputType(e.type)).join(' ,')}]`
  } else {
    let mapping = types.find((mapping) => !!solidityType.match(mapping.regex))
    if (mapping) {
      return mapping.tsType
    } else {
      throw new Error(`Unknown Solidity type found: ${solidityType}`)
    }
  }
}

export function inputType(
  solidityType: string,
  components?: Array<any>,
): string {
  return typeConversion(INPUT_TYPE_MAPPING, solidityType, components)
}

export function outputType(solidityType: string): string {
  return typeConversion(TYPE_MAPPING, solidityType)
}
