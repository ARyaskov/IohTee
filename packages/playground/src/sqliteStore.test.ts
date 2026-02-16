import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { SqliteTokenStore } from './sqliteStore.js'

describe('SqliteTokenStore', () => {
  it('stores and validates accepted tokens', () => {
    const store = new SqliteTokenStore(':memory:')
    store.putAcceptedToken(
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      10_000,
      { hello: 'world' },
    )

    assert.equal(
      store.isTokenValid(
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      ),
      true,
    )

    store.close()
  })

  it('cleans up expired tokens', () => {
    const store = new SqliteTokenStore(':memory:')
    store.putAcceptedToken(
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      1,
    )

    const removed = store.cleanupExpired(Date.now() + 5_000)
    assert.equal(removed, 1)
    assert.equal(
      store.isTokenValid(
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      ),
      false,
    )

    store.close()
  })
})
