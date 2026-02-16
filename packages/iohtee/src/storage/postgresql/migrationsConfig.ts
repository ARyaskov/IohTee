export default function migrationsConfig(connectionUrl: string) {
  const url = new URL(connectionUrl)
  return {
    cmdOptions: {
      'migrations-dir':
        './packages/machinomy/lib/storage/postgresql/migrations/',
    },
    config: {
      defaultEnv: 'defaultPg',
      defaultPg: {
        driver: 'pg',
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        host: url.hostname,
        database: url.pathname.replace(/^\//, ''),
      },
    },
  }
}
