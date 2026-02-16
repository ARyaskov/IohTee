import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parsePaywallAuthorization } from './paywall.js'

describe('parsePaywallAuthorization', () => {
  it('parses valid header', () => {
    const parsed = parsePaywallAuthorization(
      'paywall 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa meta 1000',
    )

    assert.deepEqual(parsed, {
      token:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      meta: 'meta',
      priceWei: 1000n,
    })
  })

  it('returns null for invalid scheme', () => {
    assert.equal(parsePaywallAuthorization('bearer token'), null)
  })

  it('returns null for invalid token', () => {
    assert.equal(parsePaywallAuthorization('paywall not-a-token'), null)
  })
})
