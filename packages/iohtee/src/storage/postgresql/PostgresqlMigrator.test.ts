import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import PostgresqlMigrator from './PostgresqlMigrator'

describe('PostgresqlMigrator', () => {
  it('reports latest based on version', async () => {
    const migrator = new PostgresqlMigrator({} as never)

    ;(migrator as any).ensureMetaTable = async () => undefined
    ;(migrator as any).readVersion = async () => 0

    assert.equal(await migrator.isLatest(), false)
    ;(migrator as any).readVersion = async () => 1
    assert.equal(await migrator.isLatest(), true)
  })

  it('sync writes target version', async () => {
    const migrator = new PostgresqlMigrator({} as never)

    const calls: number[] = []
    ;(migrator as any).ensureMetaTable = async () => undefined
    ;(migrator as any).ensureSchema = async () => undefined
    ;(migrator as any).writeVersion = async (version: number) => {
      calls.push(version)
    }

    await migrator.sync('1')
    assert.deepEqual(calls, [1])
  })
})
