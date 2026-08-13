import { randomUUID } from 'node:crypto'
import { eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../app.js'
import { db } from '../db/client.js'
import { cartItems, carts, customers, inventoryItems, inventoryMovements, orders, productVariants, products } from '../db/schema.js'

/** Integration tests: they need the local PostgreSQL instance from docker compose. */

const TEST_PRODUCT_SLUG = 'checkout-test-product'
const TEST_SKU = 'CHECKOUT-TEST-SKU'
const TEST_EMAIL = 'checkout-test@coordillera.test'
const SINGLE_UNIT_STOCK = 1

const shippingAddress = { line1: 'Cra 1 #2-3', city: 'Bogota', region: 'Cundinamarca', postalCode: '110111', country: 'CO' }

function checkoutPayload(sessionId: string) {
  return { sessionId, email: TEST_EMAIL, firstName: 'Ana', lastName: 'Ruiz', phone: '3001234567', shippingAddress }
}

let app: FastifyInstance
let variantId: string
let inventoryItemId: string
const firstSessionId = randomUUID()
const secondSessionId = randomUUID()
const createdOrderNumbers: string[] = []

beforeAll(async () => {
  app = await buildApp()

  const [product] = await db.insert(products).values({ name: 'Checkout Test Product', slug: TEST_PRODUCT_SLUG, status: 'draft' }).returning({ id: products.id })
  const [variant] = await db.insert(productVariants).values({ productId: product.id, sku: TEST_SKU, name: 'Checkout Test Variant', color: 'Test', size: 'M', priceCents: 1_000_00 }).returning({ id: productVariants.id })
  const [item] = await db.insert(inventoryItems).values({ variantId: variant.id, onHand: SINGLE_UNIT_STOCK }).returning({ id: inventoryItems.id })
  variantId = variant.id
  inventoryItemId = item.id
})

afterAll(async () => {
  if (createdOrderNumbers.length) await db.delete(orders).where(inArray(orders.number, createdOrderNumbers))
  await db.delete(customers).where(eq(customers.email, TEST_EMAIL))
  await db.delete(carts).where(inArray(carts.sessionId, [firstSessionId, secondSessionId]))
  await db.delete(inventoryMovements).where(eq(inventoryMovements.inventoryItemId, inventoryItemId))
  await db.delete(products).where(eq(products.slug, TEST_PRODUCT_SLUG))
  await app.close()
})

describe('POST /api/checkout', () => {
  it('reserves stock for the first order and rejects the second one that competes for the same unit', async () => {
    for (const sessionId of [firstSessionId, secondSessionId]) {
      const added = await app.inject({ method: 'POST', url: '/api/cart/items', payload: { sessionId, variantId, quantity: SINGLE_UNIT_STOCK } })
      expect(added.statusCode).toBe(201)
    }

    const first = await app.inject({ method: 'POST', url: '/api/checkout', payload: checkoutPayload(firstSessionId) })
    expect(first.statusCode).toBe(201)
    createdOrderNumbers.push(first.json().number)

    const second = await app.inject({ method: 'POST', url: '/api/checkout', payload: checkoutPayload(secondSessionId) })
    expect(second.statusCode).toBe(409)
    expect(second.json().code).toBe('out_of_stock')

    const [stock] = await db.select({ reserved: inventoryItems.reserved, onHand: inventoryItems.onHand }).from(inventoryItems).where(eq(inventoryItems.id, inventoryItemId))
    expect(stock).toEqual({ reserved: SINGLE_UNIT_STOCK, onHand: SINGLE_UNIT_STOCK })
  })

  it('leaves the rejected cart untouched so the customer can retry', async () => {
    const cart = await app.inject({ method: 'GET', url: `/api/cart/${secondSessionId}` })
    expect(cart.json().itemCount).toBe(SINGLE_UNIT_STOCK)
  })

  it('empties the cart of the order that went through', async () => {
    const cart = await app.inject({ method: 'GET', url: `/api/cart/${firstSessionId}` })
    expect(cart.json().items).toEqual([])
  })

  it('rejects a checkout for an unknown session', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/checkout', payload: checkoutPayload(randomUUID()) })
    expect(response.statusCode).toBe(404)
    expect(response.json().code).toBe('cart_not_found')
  })

  it('rejects a checkout with an empty cart', async () => {
    await db.delete(cartItems).where(inArray(cartItems.cartId, db.select({ id: carts.id }).from(carts).where(eq(carts.sessionId, secondSessionId))))
    const response = await app.inject({ method: 'POST', url: '/api/checkout', payload: checkoutPayload(secondSessionId) })
    expect(response.statusCode).toBe(409)
    expect(response.json().code).toBe('cart_empty')
  })
})

describe('POST /api/cart/items', () => {
  it('rejects a quantity above the available units', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/cart/items', payload: { sessionId: secondSessionId, variantId, quantity: SINGLE_UNIT_STOCK } })
    expect(response.statusCode).toBe(409)
    expect(response.json()).toMatchObject({ code: 'out_of_stock', details: { sku: TEST_SKU, available: '0' } })
  })
})
