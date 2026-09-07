import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import { registerErrorHandler } from './errors.js'
import { registerRoutes } from './routes/index.js'

export async function buildApp() {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' })
  // `credentials` lets the browser send the session cookie when the web app is served from another origin.
  await app.register(cors, { origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'], credentials: true })
  await app.register(cookie)

  registerErrorHandler(app)
  app.get('/api/health', async () => ({ status: 'ok' }))
  registerRoutes(app)

  return app
}
