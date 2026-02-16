import { parseSignature, serializeSignature } from 'viem'

export interface SignatureParts {
  v: number
  r: `0x${string}`
  s: `0x${string}`
}

export default class Signature {
  readonly rpcSig: `0x${string}`

  constructor(rpcSig: string) {
    this.rpcSig = rpcSig as `0x${string}`
  }

  public static fromRpcSig(rpcSig: string): Signature {
    return new Signature(rpcSig)
  }

  public static fromParts(parts: SignatureParts): Signature {
    const v = BigInt(parts.v)
    return new Signature(
      serializeSignature({
        r: parts.r,
        s: parts.s,
        v,
      }),
    )
  }

  public toString(): `0x${string}` {
    return this.rpcSig
  }

  public toParts(): SignatureParts {
    const parts = parseSignature(this.rpcSig)
    const v = Number(parts.v ?? BigInt(parts.yParity) + 27n)

    return {
      v,
      r: parts.r,
      s: parts.s,
    }
  }

  public isEqual(other: Signature): boolean {
    return this.rpcSig.toLowerCase() === other.rpcSig.toLowerCase()
  }
}
