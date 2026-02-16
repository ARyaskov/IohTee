import { beforeEach, describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { Pool } from 'pg'
import EnginePostgres from './storage/postgresql/EnginePostgres'

describe('EnginePostgres', () => {
  let engine: EnginePostgres

  beforeEach(() => {
    engine = new EnginePostgres()
  })

  it('defaults to disconnected', () => {
    assert.equal(engine.isConnected(), false)
  })

  it('connects once for concurrent callers', async () => {
    const queryMock = mock.method(
      Pool.prototype,
      'query',
      async () => ({ rows: [] }) as never,
    )

    await Promise.all([engine.connect(), engine.connect(), engine.connect()])

    assert.equal(queryMock.mock.callCount(), 1)
    assert.equal(engine.isConnected(), true)
  })

  it('closes connection', async () => {
    mock.method(Pool.prototype, 'query', async () => ({ rows: [] }) as never)
    const endMock = mock.method(
      Pool.prototype,
      'end',
      async () => undefined as never,
    )

    await engine.connect()
    await engine.close()

    assert.equal(endMock.mock.callCount(), 1)
    assert.equal(engine.isConnected(), false)
  })

  it('drop truncates all tables', async () => {
    const queryMock = mock.method(
      Pool.prototype,
      'query',
      async () => ({ rows: [] }) as never,
    )

    await engine.drop()

    const calls = queryMock.mock.calls.map((call) => call.arguments[0])
    assert.ok(calls.includes('TRUNCATE channel CASCADE'))
    assert.ok(calls.includes('TRUNCATE payment CASCADE'))
    assert.ok(calls.includes('TRUNCATE token CASCADE'))
  })

  it('exec exposes pool', async () => {
    mock.method(Pool.prototype, 'query', async () => ({ rows: [] }) as never)
    const result = await engine.exec((client) => typeof client.query)
    assert.equal(result, 'function')
  })
})
