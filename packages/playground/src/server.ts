import Fastify, { FastifyInstance } from 'fastify'
import { PlaygroundConfig } from './config.js'
import { createPaywalledRouteHandler, forwardAcceptPayment } from './paywall.js'
import { SqliteTokenStore } from './sqliteStore.js'

export interface PlaygroundServer {
  app: FastifyInstance
  store: SqliteTokenStore
}

export async function createServer(
  config: PlaygroundConfig,
): Promise<PlaygroundServer> {
  const app = Fastify({ logger: true })
  const store = new SqliteTokenStore(config.sqlitePath)

  app.get('/health', async () => ({ status: 'ok' }))

  app.post('/payments/accept', async (request, reply) => {
    await forwardAcceptPayment(request, reply, config, store)
  })

  app.get(
    '/hello',
    createPaywalledRouteHandler(config, store, async (_request, reply) => {
      return reply.status(200).send('Thank you for the payment!')
    }),
  )

  app.addHook('onClose', async () => {
    store.close()
  })

  return { app, store }
}
