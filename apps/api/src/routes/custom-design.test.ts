import { eq, inArray } from 'drizzle-orm'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../app.js'
import { db } from '../db/client.js'
import { customDesignRequests, customers, inventoryItems, inventoryMovements, notifications, orders, productVariants, products } from '../db/schema.js'

/** Integration tests: they need the local PostgreSQL instance from docker compose. */

const TEST_PRODUCT_SLUG = 'custom-design-test-product'
const TEST_SKU = 'CUSTOM-DESIGN-TEST-SKU'
const CUSTOMER_EMAIL = 'custom-design-test-customer@cordillera.test'
const OTHER_CUSTOMER_EMAIL = 'custom-design-test-other@cordillera.test'
const ARTIST_EMAIL = 'custom-design-test-artist@cordillera.test'
const PASSWORD = 'cordillera-test-password'
const BASE_PRICE_CENTS = 100_00
const INITIAL_STOCK = 3

const testEmails = [CUSTOMER_EMAIL, OTHER_CUSTOMER_EMAIL, ARTIST_EMAIL]

/** Well inside the 9am-6pm Bogotá window, so the happy-path tests are not tied to when they actually run. */
const DAYTIME_IN_BOGOTA = new Date('2024-01-15T14:00:00-05:00')
/** Same day, but past 6pm Bogotá. */
const NIGHT_IN_BOGOTA = new Date('2024-01-15T20:00:00-05:00')

/**
 * Only the clock is faked. Faking the timer functions too would freeze the ones postgres uses for its
 * connections, and every query inside these tests would hang instead of answering.
 */
const FROZEN_CLOCK_ONLY: Parameters<typeof vi.useFakeTimers>[0] = { toFake: ['Date'] }

const SHIPPING_ADDRESS = { line1: 'Cra 1 #2-3', city: 'Bogota', region: 'Cundinamarca', postalCode: '110111', country: 'CO' }

function sessionCookie(setCookie: string): string {
  return setCookie.split(';')[0] ?? setCookie
}

function required<Entry>(entry: Entry | undefined, what: string): Entry {
  if (!entry) throw new Error(`${what} is missing from the response`)
  return entry
}

type RequestCreated = { requestId: string; orderNumber: string; totalCents: number; artistName: string }
type ArtistList = { surchargePercent: number; artists: { id: string; name: string; pendingCount: number }[] }
type Notification = { id: string; kind: string; relatedRequestId: string; payload: Record<string, string> }

let app: FastifyInstance
let customerCookie: string
let otherCustomerCookie: string
let artistCookie: string
let customerId: string
let artistId: string
let variantId: string
let inventoryItemId: string

beforeAll(async () => {
  app = await buildApp()
  await db.delete(customers).where(inArray(customers.email, testEmails))

  const [insertedProduct] = await db.insert(products).values({ name: 'Custom Design Test Product', slug: TEST_PRODUCT_SLUG, status: 'active' }).returning({ id: products.id })
  const product = required(insertedProduct, 'inserted test product')
  const [insertedVariant] = await db.insert(productVariants).values({ productId: product.id, sku: TEST_SKU, name: 'Custom Design Test Variant', priceCents: BASE_PRICE_CENTS }).returning({ id: productVariants.id })
  variantId = required(insertedVariant, 'inserted test variant').id
  const [insertedStock] = await db.insert(inventoryItems).values({ variantId, onHand: INITIAL_STOCK }).returning({ id: inventoryItems.id })
  inventoryItemId = required(insertedStock, 'inserted test inventory item').id

  const customer = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { email: CUSTOMER_EMAIL, password: PASSWORD, firstName: 'Dana', lastName: 'Cliente' } })
  customerCookie = sessionCookie(String(customer.headers['set-cookie']))
  customerId = customer.json<{ id: string }>().id

  const otherCustomer = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { email: OTHER_CUSTOMER_EMAIL, password: PASSWORD, firstName: 'Otro', lastName: 'Cliente' } })
  otherCustomerCookie = sessionCookie(String(otherCustomer.headers['set-cookie']))

  const artist = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { email: ARTIST_EMAIL, password: PASSWORD, firstName: 'Ari', lastName: 'Artista' } })
  artistCookie = sessionCookie(String(artist.headers['set-cookie']))
  const [artistRow] = await db.update(customers).set({ role: 'artist' }).where(eq(customers.email, ARTIST_EMAIL)).returning({ id: customers.id })
  artistId = required(artistRow, 'artist test customer').id
})

afterEach(() => {
  vi.useRealTimers()
})

afterAll(async () => {
  await db.delete(notifications).where(inArray(notifications.customerId, [customerId, artistId]))
  await db.delete(customDesignRequests).where(eq(customDesignRequests.customerId, customerId))
  await db.delete(orders).where(eq(orders.customerId, customerId))
  await db.delete(customers).where(inArray(customers.email, testEmails))
  await db.delete(inventoryMovements).where(eq(inventoryMovements.inventoryItemId, inventoryItemId))
  await db.delete(products).where(eq(products.slug, TEST_PRODUCT_SLUG))
  await app.close()
})

describe('custom design requests', () => {
  it('rejects a request outside the 9am-6pm Bogotá window', async () => {
    vi.useFakeTimers(FROZEN_CLOCK_ONLY)
    vi.setSystemTime(NIGHT_IN_BOGOTA)

    const response = await app.inject({
      method: 'POST', url: '/api/custom-design/requests', headers: { cookie: customerCookie },
      payload: { baseVariantId: variantId, referenceImage: 'data:image/png;base64,AAAA', artistId: 'fastest', shippingAddress: SHIPPING_ADDRESS },
    })
    expect(response.statusCode).toBe(409)
    expect(response.json().code).toBe('outside_business_hours')
  })

  it('lists the artist as available, with an empty queue', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/custom-design/artists', headers: { cookie: customerCookie } })
    expect(response.statusCode).toBe(200)
    const body = response.json<ArtistList>()
    const artist = required(body.artists.find((entry) => entry.id === artistId), 'test artist')
    expect(artist.pendingCount).toBe(0)
  })

  let requestId: string
  let orderNumber: string

  it('charges the base price plus the surcharge, assigns the fastest artist, and reserves stock', async () => {
    vi.useFakeTimers(FROZEN_CLOCK_ONLY)
    vi.setSystemTime(DAYTIME_IN_BOGOTA)

    const response = await app.inject({
      method: 'POST', url: '/api/custom-design/requests', headers: { cookie: customerCookie },
      payload: { baseVariantId: variantId, characterDescription: 'Blue fox, round glasses', referenceImage: 'data:image/png;base64,AAAA', artistId: 'fastest', shippingAddress: SHIPPING_ADDRESS },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json<RequestCreated>()
    expect(body.totalCents).toBe(BASE_PRICE_CENTS * 1.5)
    expect(body.artistName).toContain('Ari')
    requestId = body.requestId
    orderNumber = body.orderNumber

    const [stock] = await db.select({ reserved: inventoryItems.reserved }).from(inventoryItems).where(eq(inventoryItems.variantId, variantId))
    expect(stock?.reserved).toBe(1)
  })

  it('rejects a second request once stock runs out', async () => {
    vi.useFakeTimers(FROZEN_CLOCK_ONLY)
    vi.setSystemTime(DAYTIME_IN_BOGOTA)

    // Reserve the remaining units so the next request has nothing left.
    await db.update(inventoryItems).set({ reserved: INITIAL_STOCK }).where(eq(inventoryItems.variantId, variantId))

    const response = await app.inject({
      method: 'POST', url: '/api/custom-design/requests', headers: { cookie: customerCookie },
      payload: { baseVariantId: variantId, referenceImage: 'data:image/png;base64,AAAA', artistId: 'fastest', shippingAddress: SHIPPING_ADDRESS },
    })
    expect(response.statusCode).toBe(409)
    expect(response.json().code).toBe('out_of_stock')

    // Restore the reservation left by the successful request above, so the rest of the suite sees a consistent count.
    await db.update(inventoryItems).set({ reserved: 1 }).where(eq(inventoryItems.variantId, variantId))
  })

  it("shows up in the artist's queue and accepts an estimate", async () => {
    const list = await app.inject({ method: 'GET', url: '/api/artist/requests', headers: { cookie: artistCookie } })
    expect(list.statusCode).toBe(200)
    const found = required(list.json<{ id: string; status: string }[]>().find((entry) => entry.id === requestId), 'queued request')
    expect(found.status).toBe('pending')

    const estimate = await app.inject({ method: 'PATCH', url: `/api/artist/requests/${requestId}/estimate`, headers: { cookie: artistCookie }, payload: { estimatedDays: 5 } })
    expect(estimate.statusCode).toBe(200)
    expect(estimate.json().estimatedDays).toBe(5)
  })

  it('delivers the final design and notifies the customer', async () => {
    const response = await app.inject({ method: 'POST', url: `/api/artist/requests/${requestId}/deliver`, headers: { cookie: artistCookie }, payload: { finalDesignImage: 'data:image/png;base64,BBBB' } })
    expect(response.statusCode).toBe(200)
    expect(response.json().status).toBe('delivered')

    const inbox = await app.inject({ method: 'GET', url: '/api/notifications', headers: { cookie: customerCookie } })
    const notification = required(inbox.json<Notification[]>().find((entry) => entry.relatedRequestId === requestId), 'design_delivered notification')
    expect(notification.kind).toBe('design_delivered')
  })

  it('does not let another customer approve someone else\'s request', async () => {
    const response = await app.inject({ method: 'POST', url: `/api/custom-design/requests/${requestId}/approve`, headers: { cookie: otherCustomerCookie } })
    expect(response.statusCode).toBe(404)
  })

  it('lets the customer request changes, which routes it back to the artist queue', async () => {
    const response = await app.inject({ method: 'POST', url: `/api/custom-design/requests/${requestId}/request-changes`, headers: { cookie: customerCookie }, payload: { comment: 'Make the ears bigger' } })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ status: 'changes_requested', revisionNote: 'Make the ears bigger' })

    const queue = await app.inject({ method: 'GET', url: '/api/artist/requests', headers: { cookie: artistCookie } })
    const found = required(queue.json<{ id: string; revisionNote: string | null }[]>().find((entry) => entry.id === requestId), 'requeued request')
    expect(found.revisionNote).toBe('Make the ears bigger')
  })

  it('approves the request once it is delivered again, and notifies the artist', async () => {
    await app.inject({ method: 'POST', url: `/api/artist/requests/${requestId}/deliver`, headers: { cookie: artistCookie }, payload: { finalDesignImage: 'data:image/png;base64,CCCC' } })

    const rejectedEarly = await app.inject({ method: 'POST', url: `/api/custom-design/requests/${requestId}/approve`, headers: { cookie: otherCustomerCookie } })
    expect(rejectedEarly.statusCode).toBe(404)

    const response = await app.inject({ method: 'POST', url: `/api/custom-design/requests/${requestId}/approve`, headers: { cookie: customerCookie } })
    expect(response.statusCode).toBe(200)
    expect(response.json().status).toBe('approved')

    const artistInbox = await app.inject({ method: 'GET', url: '/api/notifications', headers: { cookie: artistCookie } })
    const notification = required(artistInbox.json<Notification[]>().find((entry) => entry.relatedRequestId === requestId), 'design_approved notification')
    expect(notification.kind).toBe('design_approved')
  })

  it('stops offering the artist once they go unavailable, without touching their existing order', async () => {
    const off = await app.inject({ method: 'PATCH', url: '/api/artist/status', headers: { cookie: artistCookie }, payload: { acceptingRequests: false } })
    expect(off.statusCode).toBe(200)
    expect(off.json().acceptingRequests).toBe(false)

    const list = await app.inject({ method: 'GET', url: '/api/custom-design/artists', headers: { cookie: customerCookie } })
    expect(list.json<ArtistList>().artists.some((entry) => entry.id === artistId)).toBe(false)

    vi.useFakeTimers(FROZEN_CLOCK_ONLY)
    vi.setSystemTime(DAYTIME_IN_BOGOTA)
    const rejected = await app.inject({
      method: 'POST', url: '/api/custom-design/requests', headers: { cookie: customerCookie },
      payload: { baseVariantId: variantId, referenceImage: 'data:image/png;base64,AAAA', artistId, shippingAddress: SHIPPING_ADDRESS },
    })
    expect(rejected.statusCode).toBe(409)
    expect(rejected.json().code).toBe('artist_unavailable')

    await app.inject({ method: 'PATCH', url: '/api/artist/status', headers: { cookie: artistCookie }, payload: { acceptingRequests: true } })
  })

  it('confirms the linked order was created with the surcharged total', async () => {
    const [order] = await db.select({ totalCents: orders.totalCents }).from(orders).where(eq(orders.number, orderNumber))
    expect(order?.totalCents).toBe(BASE_PRICE_CENTS * 1.5)

    const [linked] = await db.select({ orderId: customDesignRequests.orderId }).from(customDesignRequests).where(eq(customDesignRequests.id, requestId))
    expect(linked?.orderId).toBeTruthy()
  })
})
