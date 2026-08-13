import Fastify from 'fastify'
import cors from '@fastify/cors'
import { registerRoutes } from './routes.js'

export async function buildApp() {
  const app = Fastify({ logger: true })
  await app.register(cors, { origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'] })

  app.get('/api/health', async () => ({ status: 'ok' }))
  await registerRoutes(app)

  return app
}
