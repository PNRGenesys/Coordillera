import type { FastifyInstance } from 'fastify'
import { registerAdminRoutes } from './admin.js'
import { registerAuthRoutes } from './auth.js'
import { registerCartRoutes } from './cart.js'
import { registerCatalogRoutes } from './catalog.js'
import { registerCheckoutRoutes } from './checkout.js'

export function registerRoutes(app: FastifyInstance): void {
  registerAuthRoutes(app)
  registerCatalogRoutes(app)
  registerCartRoutes(app)
  registerCheckoutRoutes(app)
  registerAdminRoutes(app)
}
