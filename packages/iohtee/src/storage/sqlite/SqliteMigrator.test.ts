import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { EngineSqlite } from './EngineSqlite'
import { SqliteMigrator } from './SqliteMigrator'

describe('SqliteMigrator', () => {
  it('applies schema and updates version', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'iohtee-sqlite-'))
    const dbPath = join(dir, 'test.db')

    try {
      const engine = new EngineSqlite(`sqlite://${dbPath}`)
      const migrator = new SqliteMigrator(engine)

      assert.equal(await migrator.isLatest(), false)
      await migrator.sync()
      assert.equal(await migrator.isLatest(), true)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
