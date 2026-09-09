import Fastify from 'fastify'
import compress from '@fastify/compress'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import { registerErrorHandler } from './errors.js'
import { registerRoutes } from './routes/index.js'

export async function buildApp() {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' })
  // Every response is JSON, which compresses well; this matters most on the slow mobile networks
  // the storefront targets. Test keeps responses uncompressed so `app.inject()` payloads stay plain JSON.
  if (process.env.NODE_ENV !== 'test') await app.register(compress, { global: true })
  // `credentials` lets the browser send the session cookie when the web app is served from another origin.
  await app.register(cors, { origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'], credentials: true })
  await app.register(cookie)

  registerErrorHandler(app)
  app.get('/api/health', async () => ({ status: 'ok' }))
  registerRoutes(app)

  return app
}
