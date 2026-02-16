import { loadConfig } from './config.js'
import { createServer } from './server.js'

async function bootstrap(): Promise<void> {
  const config = loadConfig()
  const { app } = await createServer(config)

  await app.listen({
    host: config.host,
    port: config.port,
  })
}

bootstrap().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
