import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import ChannelId from './ChannelId'

const HEX_ADDRESS = 'eb61859a9d74f95bda8a6f9d3efcfe6478e49151'

describe('ChannelId', () => {
  describe('.build', () => {
    const buffer = Buffer.from(HEX_ADDRESS, 'hex')
    const expected = new ChannelId(buffer)

    it('from non-prefixed hex', () => {
      const channelId = ChannelId.build(HEX_ADDRESS)
      assert.deepEqual(channelId, expected)
    })

    it('from prefixed hex', () => {
      const channelId = ChannelId.build(`0x${HEX_ADDRESS}`)
      assert.deepEqual(channelId, expected)
    })

    it('from Buffer', () => {
      const channelId = ChannelId.build(buffer)
      assert.deepEqual(channelId, expected)
    })

    it('from ChannelId', () => {
      const channelId = ChannelId.build(expected)
      assert.deepEqual(channelId, expected)
    })
  })

  describe('#toString', () => {
    it('return prefixed hex', () => {
      const channelId = ChannelId.build(HEX_ADDRESS)
      const actual = channelId.toString()
      assert.equal(actual, `0x${HEX_ADDRESS}`)
    })
  })
})
