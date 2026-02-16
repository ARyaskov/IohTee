import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import Signature from './Signature'

describe('Signature', () => {
  const SIGNATURE =
    '0xd8a923b39ae82bb39d3b64d58f06e1d776bcbcae34e5b4a6f4a952e8892e6a5b4c0f88833c06fe91729057035161e599fda536e8ce0ab4be2c214d6ea961e93a1c'

  function verify(inst: Signature) {
    assert.equal(inst.toString(), SIGNATURE)
    assert.deepEqual(inst.toParts(), {
      v: 28,
      r: '0xd8a923b39ae82bb39d3b64d58f06e1d776bcbcae34e5b4a6f4a952e8892e6a5b',
      s: '0x4c0f88833c06fe91729057035161e599fda536e8ce0ab4be2c214d6ea961e93a',
    })
  }

  it('direct construction', () => {
    verify(new Signature(SIGNATURE))
  })

  it('fromRpcSig', () => {
    verify(Signature.fromRpcSig(SIGNATURE))
  })

  it('fromParts', () => {
    verify(
      Signature.fromParts({
        v: 28,
        r: '0xd8a923b39ae82bb39d3b64d58f06e1d776bcbcae34e5b4a6f4a952e8892e6a5b',
        s: '0x4c0f88833c06fe91729057035161e599fda536e8ce0ab4be2c214d6ea961e93a',
      }),
    )
  })
})
