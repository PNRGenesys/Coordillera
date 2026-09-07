import { randomUUID } from 'node:crypto'
import { eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../app.js'
import { db } from '../db/client.js'
import { cartItems, carts, customers, inventoryItems, inventoryMovements, orders, productVariants, products, restockRequests } from '../db/schema.js'

/** Integration tests: they need the local PostgreSQL instance from docker compose. */

const TEST_PRODUCT_SLUG = 'checkout-test-product'
const TEST_SKU = 'CHECKOUT-TEST-SKU'
const TEST_EMAIL = 'checkout-test@cordillera.test'
const RESTOCK_EMAIL = 'checkout-test-restock@cordillera.test'
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
const checkoutSessionIds: string[] = []

beforeAll(async () => {
  app = await buildApp()

  const [product] = await db.insert(products).values({ name: 'Checkout Test Product', slug: TEST_PRODUCT_SLUG, status: 'draft' }).returning({ id: products.id })
  if (!product) throw new Error('Test product insert returned no row')
  const [variant] = await db.insert(productVariants).values({ productId: product.id, sku: TEST_SKU, name: 'Checkout Test Variant', color: 'Test', size: 'M', priceCents: 1_000_00 }).returning({ id: productVariants.id })
  if (!variant) throw new Error('Test variant insert returned no row')
  const [item] = await db.insert(inventoryItems).values({ variantId: variant.id, onHand: SINGLE_UNIT_STOCK }).returning({ id: inventoryItems.id })
  if (!item) throw new Error('Test inventory item insert returned no row')
  variantId = variant.id
  inventoryItemId = item.id
})

afterAll(async () => {
  if (createdOrderNumbers.length) await db.delete(orders).where(inArray(orders.number, createdOrderNumbers))
  await db.delete(restockRequests).where(eq(restockRequests.variantId, variantId))
  await db.delete(customers).where(inArray(customers.email, [TEST_EMAIL, RESTOCK_EMAIL]))
  await db.delete(carts).where(inArray(carts.sessionId, [firstSessionId, secondSessionId, ...checkoutSessionIds]))
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

  it('fills the country in by itself, because the store ships to a single one', async () => {
    const sessionId = randomUUID()
    checkoutSessionIds.push(sessionId)
    await db.update(inventoryItems).set({ onHand: SINGLE_UNIT_STOCK + 1 }).where(eq(inventoryItems.id, inventoryItemId))
    await app.inject({ method: 'POST', url: '/api/cart/items', payload: { sessionId, variantId, quantity: SINGLE_UNIT_STOCK } })

    const { country, ...addressWithoutCountry } = shippingAddress
    const response = await app.inject({
      method: 'POST', url: '/api/checkout',
      payload: { ...checkoutPayload(sessionId), shippingAddress: addressWithoutCountry },
    })
    expect(response.statusCode).toBe(201)
    createdOrderNumbers.push(response.json().number)

    const [order] = await db.select({ shippingAddress: orders.shippingAddress }).from(orders).where(eq(orders.number, response.json().number))
    expect(order?.shippingAddress).toMatchObject({ ...addressWithoutCountry, country })
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

describe('POST /api/restock-requests', () => {
  it('uses the email of the session, so a signed in customer does not type it again', async () => {
    const registered = await app.inject({
      method: 'POST', url: '/api/auth/register',
      payload: { email: RESTOCK_EMAIL, password: 'cordillera-test-password', firstName: 'Ana', lastName: 'Ruiz' },
    })
    const cookie = String(registered.headers['set-cookie']).split(';')[0] ?? ''

    const response = await app.inject({ method: 'POST', url: '/api/restock-requests', headers: { cookie }, payload: { variantId } })
    expect(response.statusCode).toBe(202)

    const [saved] = await db.select({ email: restockRequests.email }).from(restockRequests).where(eq(restockRequests.variantId, variantId))
    expect(saved?.email).toBe(RESTOCK_EMAIL)
  })

  it('still asks a guest for an email', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/restock-requests', payload: { variantId } })
    expect(response.statusCode).toBe(400)
    expect(response.json().code).toBe('email_required')
  })
})

describe('POST /api/cart/items', () => {
  it('rejects a quantity above the available units', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/cart/items', payload: { sessionId: secondSessionId, variantId, quantity: SINGLE_UNIT_STOCK } })
    expect(response.statusCode).toBe(409)
    expect(response.json()).toMatchObject({ code: 'out_of_stock', details: { sku: TEST_SKU, available: '0' } })
  })
})
