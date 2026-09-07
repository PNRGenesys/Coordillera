import { randomUUID } from 'node:crypto'
import { eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../app.js'
import { db } from '../db/client.js'
import { carts, customers, inventoryItems, inventoryMovements, orders, productVariants, products } from '../db/schema.js'

/** Integration tests: they need the local PostgreSQL instance from docker compose. */

const TEST_PRODUCT_SLUG = 'admin-test-product'
const TEST_SKU = 'ADMIN-TEST-SKU'
const ADMIN_EMAIL = 'admin-test-admin@coordillera.test'
const SHOPPER_EMAIL = 'admin-test-shopper@coordillera.test'
const PASSWORD = 'coordillera-test-password'
const INITIAL_STOCK = 5
const ORDERED_UNITS = 2

const testEmails = [ADMIN_EMAIL, SHOPPER_EMAIL]

/** `app.inject` does not keep a cookie jar, so the session cookie is carried over by hand. */
function sessionCookie(setCookie: string): string {
  return setCookie.split(';')[0]
}

function required<Entry>(entry: Entry | undefined, what: string): Entry {
  if (!entry) throw new Error(`${what} is missing from the admin response`)
  return entry
}

type AdminVariant = { sku: string; onHand: number; reserved: number; availableUnits: number }
type AdminProduct = { slug: string; status: string; variants: AdminVariant[] }
type AdminOrder = { id: string; status: string; customerEmail: string; shippingAddress: Record<string, string>; items: { sku: string; quantity: number }[] }

let app: FastifyInstance
let adminCookie: string
let shopperCookie: string
let productId: string
let variantId: string
let inventoryItemId: string
let orderId: string
const sessionId = randomUUID()

beforeAll(async () => {
  app = await buildApp()
  await db.delete(customers).where(inArray(customers.email, testEmails))

  const [product] = await db.insert(products).values({ name: 'Admin Test Product', slug: TEST_PRODUCT_SLUG, status: 'draft' }).returning({ id: products.id })
  const [variant] = await db.insert(productVariants).values({ productId: product.id, sku: TEST_SKU, name: 'Admin Test Variant', color: 'Test', size: 'M', priceCents: 1_000_00 }).returning({ id: productVariants.id })
  const [stock] = await db.insert(inventoryItems).values({ variantId: variant.id, onHand: INITIAL_STOCK }).returning({ id: inventoryItems.id })
  productId = product.id
  variantId = variant.id
  inventoryItemId = stock.id

  const admin = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { email: ADMIN_EMAIL, password: PASSWORD, firstName: 'Root', lastName: 'Admin' } })
  adminCookie = sessionCookie(String(admin.headers['set-cookie']))
  await db.update(customers).set({ role: 'admin' }).where(eq(customers.email, ADMIN_EMAIL))

  const shopper = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { email: SHOPPER_EMAIL, password: PASSWORD, firstName: 'Ana', lastName: 'Ruiz' } })
  shopperCookie = sessionCookie(String(shopper.headers['set-cookie']))

  await app.inject({ method: 'POST', url: '/api/cart/items', payload: { sessionId, variantId, quantity: ORDERED_UNITS } })
  const checkout = await app.inject({
    method: 'POST',
    url: '/api/checkout',
    payload: {
      sessionId, email: SHOPPER_EMAIL, firstName: 'Ana', lastName: 'Ruiz', phone: '3001234567',
      shippingAddress: { line1: 'Cra 1 #2-3', city: 'Bogota', region: 'Cundinamarca', postalCode: '110111', country: 'CO' },
    },
  })
  const [created] = await db.select({ id: orders.id }).from(orders).where(eq(orders.number, checkout.json().number))
  orderId = created.id
})

afterAll(async () => {
  await db.delete(orders).where(eq(orders.id, orderId))
  await db.delete(customers).where(inArray(customers.email, testEmails))
  await db.delete(carts).where(eq(carts.sessionId, sessionId))
  await db.delete(inventoryMovements).where(eq(inventoryMovements.inventoryItemId, inventoryItemId))
  await db.delete(products).where(eq(products.slug, TEST_PRODUCT_SLUG))
  await app.close()
})

describe('admin access control', () => {
  it('rejects a request without a session', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/admin/products' })
    expect(response.statusCode).toBe(401)
    expect(response.json().code).toBe('unauthenticated')
  })

  it('rejects a signed in customer that is not an administrator', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/admin/products', headers: { cookie: shopperCookie } })
    expect(response.statusCode).toBe(403)
    expect(response.json().code).toBe('forbidden')
  })

  it('reports the role in the account profile', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie: adminCookie } })
    expect(response.json().account.role).toBe('admin')
  })
})

describe('admin catalog', () => {
  it('lists products with their variants and stock, including drafts', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/admin/products', headers: { cookie: adminCookie } })
    expect(response.statusCode).toBe(200)

    const product = required(response.json<AdminProduct[]>().find((entry) => entry.slug === TEST_PRODUCT_SLUG), TEST_PRODUCT_SLUG)
    expect(product.status).toBe('draft')
    expect(product.variants).toHaveLength(1)
    expect(product.variants[0]).toMatchObject({ sku: TEST_SKU, onHand: INITIAL_STOCK, reserved: ORDERED_UNITS, availableUnits: INITIAL_STOCK - ORDERED_UNITS })
  })

  it('renames a product', async () => {
    const response = await app.inject({ method: 'PATCH', url: `/api/admin/products/${productId}`, headers: { cookie: adminCookie }, payload: { name: 'Renamed Admin Product' } })
    expect(response.statusCode).toBe(200)
    expect(response.json().name).toBe('Renamed Admin Product')
  })

  it('changes the price of a variant', async () => {
    const response = await app.inject({ method: 'PATCH', url: `/api/admin/variants/${variantId}`, headers: { cookie: adminCookie }, payload: { priceCents: 2_000_00 } })
    expect(response.statusCode).toBe(200)
    expect(response.json().priceCents).toBe(2_000_00)
  })

  it('rejects an update with no fields', async () => {
    const response = await app.inject({ method: 'PATCH', url: `/api/admin/products/${productId}`, headers: { cookie: adminCookie }, payload: {} })
    expect(response.statusCode).toBe(400)
  })

  it('adds stock through an adjustment and leaves a movement behind', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/admin/inventory/adjustments', headers: { cookie: adminCookie }, payload: { variantId, quantity: 3, note: 'Admin test restock' } })
    expect(response.statusCode).toBe(200)
    expect(response.json().onHand).toBe(INITIAL_STOCK + 3)
  })
})

describe('admin orders', () => {
  it('lists the order with its lines, customer and address', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/admin/orders', headers: { cookie: adminCookie } })
    const order = required(response.json<AdminOrder[]>().find((entry) => entry.id === orderId), 'test order')

    expect(order.customerEmail).toBe(SHOPPER_EMAIL)
    expect(order.status).toBe('pending_payment')
    expect(order.shippingAddress.city).toBe('Bogota')
    expect(order.items[0]).toMatchObject({ sku: TEST_SKU, quantity: ORDERED_UNITS })
  })

  it('stores carrier and tracking number', async () => {
    const response = await app.inject({ method: 'PATCH', url: `/api/admin/orders/${orderId}`, headers: { cookie: adminCookie }, payload: { status: 'shipped', carrier: 'Servientrega', trackingNumber: 'SE-123' } })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ status: 'shipped', carrier: 'Servientrega', trackingNumber: 'SE-123' })
  })

  it('turns the reservation into a sale when the order is paid', async () => {
    await app.inject({ method: 'PATCH', url: `/api/admin/orders/${orderId}`, headers: { cookie: adminCookie }, payload: { status: 'paid' } })

    const [stock] = await db.select({ onHand: inventoryItems.onHand, reserved: inventoryItems.reserved }).from(inventoryItems).where(eq(inventoryItems.id, inventoryItemId))
    expect(stock).toEqual({ onHand: INITIAL_STOCK + 3 - ORDERED_UNITS, reserved: 0 })
  })

  it('refuses to reopen a cancelled order', async () => {
    await app.inject({ method: 'PATCH', url: `/api/admin/orders/${orderId}`, headers: { cookie: adminCookie }, payload: { status: 'cancelled' } })
    const response = await app.inject({ method: 'PATCH', url: `/api/admin/orders/${orderId}`, headers: { cookie: adminCookie }, payload: { status: 'paid' } })

    expect(response.statusCode).toBe(409)
    expect(response.json().code).toBe('invalid_status_change')
  })
})
