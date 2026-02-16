import Logger from '../log'
import IMigrator from './IMigrator'

export default abstract class SqlMigrator implements IMigrator {
  protected readonly log: Logger

  protected constructor(log: Logger) {
    this.log = log
  }

  protected abstract latestVersion(): number
  protected abstract ensureMetaTable(): Promise<void>
  protected abstract readVersion(): Promise<number>
  protected abstract writeVersion(version: number): Promise<void>
  protected abstract ensureSchema(): Promise<void>

  async isLatest(): Promise<boolean> {
    await this.ensureMetaTable()
    const current = await this.readVersion()
    const latest = this.latestVersion()
    const isLatest = current >= latest

    if (isLatest) {
      this.log.info('Latest migration is applied (%s)', latest)
    } else {
      this.log.info('Have migrations to be applied: %s -> %s', current, latest)
    }

    return isLatest
  }

  async sync(n?: string): Promise<void> {
    await this.ensureMetaTable()

    const latest = this.latestVersion()
    const destination = n ? Number.parseInt(n, 10) : latest
    const target = Number.isNaN(destination)
      ? latest
      : Math.min(Math.max(destination, 0), latest)

    this.log.info('Syncing migrations till %s', target)

    if (target === 0) {
      return
    }

    await this.ensureSchema()
    await this.writeVersion(target)
  }

  async lastMigrationNumber(): Promise<string> {
    return String(this.latestVersion())
  }
}
