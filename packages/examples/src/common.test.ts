import test from 'node:test'
import assert from 'node:assert/strict'
import {
  dirnameFromMeta,
  isHexToken,
  requiredAddress,
  requiredEnv,
} from './common.js'

test('requiredEnv returns trimmed value', () => {
  process.env.EXAMPLE_TEST_ENV = '  value  '
  assert.equal(requiredEnv('EXAMPLE_TEST_ENV'), 'value')
})

test('requiredEnv throws for missing value', () => {
  delete process.env.EXAMPLE_TEST_ENV
  assert.throws(() => requiredEnv('EXAMPLE_TEST_ENV'), {
    message: /Missing required environment variable/,
  })
})

test('isHexToken validates 32-byte hex token', () => {
  const valid = `0x${'ab'.repeat(32)}`
  assert.equal(isHexToken(valid), true)
  assert.equal(isHexToken('0x1234'), false)
  assert.equal(isHexToken('not-a-token'), false)
})

test('dirnameFromMeta resolves directory', () => {
  const dir = dirnameFromMeta(import.meta.url)
  assert.match(dir, /packages\/examples\/src$/)
})

test('requiredAddress validates hex address', () => {
  assert.equal(
    requiredAddress('0x0000000000000000000000000000000000000001', 'addr'),
    '0x0000000000000000000000000000000000000001',
  )
  assert.throws(() => requiredAddress('0x1234', 'addr'), /Invalid address/)
})
