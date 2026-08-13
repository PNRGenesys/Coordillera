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

const statusByCode: Record<DomainErrorCode, number> = {
  cart_not_found: 404,
  cart_empty: 409,
  cart_item_not_found: 404,
  product_not_found: 404,
  variant_not_found: 404,
  collection_not_found: 404,
  out_of_stock: 409,
  invalid_adjustment: 409,
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
