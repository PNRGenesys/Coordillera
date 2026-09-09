import type { FastifyError, FastifyInstance } from 'fastify'
import { ZodError } from 'zod'

export type DomainErrorCode =
  | 'cart_not_found'
  | 'cart_empty'
  | 'cart_item_not_found'
  | 'product_not_found'
  | 'variant_not_found'
  | 'collection_not_found'
  | 'out_of_stock'
  | 'invalid_adjustment'
  | 'email_taken'
  | 'invalid_credentials'
  | 'unauthenticated'
  | 'forbidden'
  | 'order_not_found'
  | 'invalid_status_change'
  | 'email_required'
  | 'outside_business_hours'
  | 'artist_unavailable'
  | 'no_artists_available'
  | 'custom_design_request_not_found'
  | 'customer_not_found'
  | 'notification_not_found'

const statusByCode: Record<DomainErrorCode, number> = {
  cart_not_found: 404,
  cart_empty: 409,
  cart_item_not_found: 404,
  product_not_found: 404,
  variant_not_found: 404,
  collection_not_found: 404,
  out_of_stock: 409,
  invalid_adjustment: 409,
  email_taken: 409,
  invalid_credentials: 401,
  unauthenticated: 401,
  forbidden: 403,
  order_not_found: 404,
  invalid_status_change: 409,
  email_required: 400,
  outside_business_hours: 409,
  artist_unavailable: 409,
  no_artists_available: 409,
  custom_design_request_not_found: 404,
  customer_not_found: 404,
  notification_not_found: 404,
}

export class DomainError extends Error {
  readonly code: DomainErrorCode
  readonly details: Record<string, string>

  constructor(code: DomainErrorCode, message: string, details: Record<string, string> = {}) {
    super(message)
    this.name = 'DomainError'
    this.code = code
    this.details = details
  }

  get statusCode(): number {
    return statusByCode[this.code]
  }
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler<FastifyError>((error, request, reply) => {
    if (error instanceof DomainError) {
      return reply.code(error.statusCode).send({ code: error.code, message: error.message, details: error.details })
    }
    if (error instanceof ZodError) {
      return reply.code(400).send({ code: 'invalid_request', message: 'Request payload is invalid', issues: error.issues })
    }
    request.log.error(error)
    const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500
    return reply.code(statusCode).send({ code: 'internal_error', message: statusCode === 500 ? 'Unexpected server error' : error.message })
  })
}
