export default function migrationsConfig(connectionUrl: string) {
  const url = new URL(connectionUrl)
  return {
    cmdOptions: {
      'migrations-dir': './packages/iohtee/lib/storage/sqlite/migrations/',
    },
    config: {
      defaultEnv: 'defaultSqlite',
      defaultSqlite: {
        driver: 'sqlite3',
        filename: url.pathname,
      },
    },
  }
}
