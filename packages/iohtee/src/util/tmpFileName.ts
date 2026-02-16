import { mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

export async function tmpFileName(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'iohtee-'))
  return join(dir, 'storage.sqlite')
}
