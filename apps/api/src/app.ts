import Fastify from 'fastify'
import cors from '@fastify/cors'
import { registerErrorHandler } from './errors.js'
import { registerRoutes } from './routes/index.js'

export async function buildApp() {
  const app = Fastify({ logger: true })
  await app.register(cors, { origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'] })

  registerErrorHandler(app)
  app.get('/api/health', async () => ({ status: 'ok' }))
  registerRoutes(app)

  return app
}
