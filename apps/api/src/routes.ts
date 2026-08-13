import type { FastifyInstance } from 'fastify'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from './db/client.js'
import { cartItems, carts, customers, inventoryItems, inventoryMovements, inventoryReservations, orderItems, orders, productVariants, products } from './db/schema.js'

const cartSchema = z.object({ sessionId: z.string().uuid() })
const addCartItemSchema = cartSchema.extend({ variantId: z.string().uuid(), quantity: z.number().int().min(1).max(20) })
const checkoutSchema = cartSchema.extend({
  email: z.string().email(), firstName: z.string().min(1).max(100), lastName: z.string().min(1).max(100), phone: z.string().min(7).max(40),
  shippingAddress: z.object({ line1: z.string().min(3), city: z.string().min(2), region: z.string().min(2), postalCode: z.string().min(2), country: z.string().length(2) }),
})
const productCreateSchema = z.object({
  name: z.string().min(2).max(180), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().max(10_000).optional(), categoryId: z.string().uuid().optional(),
  variants: z.array(z.object({ sku: z.string().min(1).max(80), name: z.string().min(1).max(180), priceCents: z.number().int().positive(), color: z.string().max(60).optional(), size: z.string().max(30).optional(), initialStock: z.number().int().min(0).default(0) })).min(1),
})
function parse<T>(schema: z.ZodType<T>, value: unknown): T { return schema.parse(value) }

export async function registerRoutes(app: FastifyInstance) {
  app.get('/api/products', async () => db.select({ id: products.id, name: products.name, slug: products.slug, description: products.description, priceCents: productVariants.priceCents, sku: productVariants.sku, color: productVariants.color, size: productVariants.size })
    .from(products).innerJoin(productVariants, eq(productVariants.productId, products.id)).where(eq(products.status, 'active')))

  app.get('/api/products/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const result = await db.select().from(products).where(and(eq(products.slug, slug), eq(products.status, 'active')))
    if (!result[0]) return reply.code(404).send({ message: 'Producto no encontrado' })
    const variants = await db.select().from(productVariants).where(eq(productVariants.productId, result[0].id))
    return { ...result[0], variants }
  })

  app.post('/api/cart/items', async (request, reply) => {
    const input = parse(addCartItemSchema, request.body)
    const [cart] = await db.insert(carts).values({ sessionId: input.sessionId }).onConflictDoUpdate({ target: carts.sessionId, set: { updatedAt: new Date() } }).returning()
    await db.insert(cartItems).values({ cartId: cart.id, variantId: input.variantId, quantity: input.quantity }).onConflictDoUpdate({ target: [cartItems.cartId, cartItems.variantId], set: { quantity: sql`${cartItems.quantity} + ${input.quantity}`, updatedAt: new Date() } })
    return reply.code(201).send({ cartId: cart.id })
  })

  app.get('/api/cart/:sessionId', async (request) => {
    const { sessionId } = parse(cartSchema, request.params)
    return db.select({ quantity: cartItems.quantity, variantId: productVariants.id, sku: productVariants.sku, name: productVariants.name, priceCents: productVariants.priceCents, color: productVariants.color, size: productVariants.size })
      .from(carts).innerJoin(cartItems, eq(cartItems.cartId, carts.id)).innerJoin(productVariants, eq(productVariants.id, cartItems.variantId)).where(eq(carts.sessionId, sessionId))
  })

  app.post('/api/checkout', async (request, reply) => {
    const input = parse(checkoutSchema, request.body)
    const order = await db.transaction(async (tx) => {
      const [cart] = await tx.select().from(carts).where(eq(carts.sessionId, input.sessionId))
      if (!cart) throw new Error('El carrito no existe')
      const lines = await tx.select({ quantity: cartItems.quantity, variantId: productVariants.id, sku: productVariants.sku, name: productVariants.name, priceCents: productVariants.priceCents })
        .from(cartItems).innerJoin(productVariants, eq(productVariants.id, cartItems.variantId)).where(eq(cartItems.cartId, cart.id))
      if (!lines.length) throw new Error('El carrito está vacío')
      const [customer] = await tx.insert(customers).values({ email: input.email, firstName: input.firstName, lastName: input.lastName, phone: input.phone }).onConflictDoUpdate({ target: customers.email, set: { firstName: input.firstName, lastName: input.lastName, phone: input.phone, updatedAt: new Date() } }).returning()
      const subtotalCents = lines.reduce((total, line) => total + line.priceCents * line.quantity, 0)
      const [created] = await tx.insert(orders).values({ number: `ORD-${Date.now()}`, customerId: customer.id, subtotalCents, totalCents: subtotalCents, shippingAddress: input.shippingAddress }).returning()
      for (const line of lines) {
        const [stock] = await tx.update(inventoryItems).set({ reserved: sql`${inventoryItems.reserved} + ${line.quantity}`, updatedAt: new Date() })
          .where(and(eq(inventoryItems.variantId, line.variantId), sql`${inventoryItems.onHand} - ${inventoryItems.reserved} >= ${line.quantity}`)).returning()
        if (!stock) throw new Error(`Sin inventario disponible para ${line.sku}`)
        await tx.insert(orderItems).values({ orderId: created.id, variantId: line.variantId, sku: line.sku, name: line.name, unitPriceCents: line.priceCents, quantity: line.quantity })
        await tx.insert(inventoryReservations).values({ inventoryItemId: stock.id, orderId: created.id, quantity: line.quantity, expiresAt: new Date(Date.now() + 20 * 60 * 1000) })
        await tx.insert(inventoryMovements).values({ inventoryItemId: stock.id, type: 'reservation', quantity: -line.quantity, reference: created.number })
      }
      await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id))
      return created
    })
    return reply.code(201).send(order)
  })

  app.post('/api/admin/inventory/adjustments', { preHandler: requireAdmin }, async (request, reply) => {
    const input = parse(z.object({ variantId: z.string().uuid(), quantity: z.number().int().refine((value) => value !== 0), note: z.string().min(3).max(500) }), request.body)
    const [stock] = await db.update(inventoryItems).set({ onHand: sql`${inventoryItems.onHand} + ${input.quantity}`, updatedAt: new Date() })
      .where(and(eq(inventoryItems.variantId, input.variantId), sql`${inventoryItems.onHand} + ${input.quantity} >= 0`)).returning()
    if (!stock) return reply.code(409).send({ message: 'Ajuste inválido o variante sin inventario inicializado' })
    await db.insert(inventoryMovements).values({ inventoryItemId: stock.id, type: 'adjustment', quantity: input.quantity, note: input.note })
    return stock
  })

  app.post('/api/admin/products', { preHandler: requireAdmin }, async (request, reply) => {
    const input = parse(productCreateSchema, request.body)
    const product = await db.transaction(async (tx) => {
      const [created] = await tx.insert(products).values({ name: input.name, slug: input.slug, description: input.description, categoryId: input.categoryId, status: 'draft' }).returning()
      for (const variant of input.variants) {
        const [createdVariant] = await tx.insert(productVariants).values({ productId: created.id, sku: variant.sku, name: variant.name, priceCents: variant.priceCents, color: variant.color, size: variant.size }).returning()
        const [stock] = await tx.insert(inventoryItems).values({ variantId: createdVariant.id, onHand: variant.initialStock }).returning()
        if (variant.initialStock) await tx.insert(inventoryMovements).values({ inventoryItemId: stock.id, type: 'restock', quantity: variant.initialStock, note: 'Inventario inicial' })
      }
      return created
    })
    return reply.code(201).send(product)
  })
}

async function requireAdmin(request: { headers: Record<string, string | string[] | undefined> }, reply: { code: (statusCode: number) => { send: (body: unknown) => unknown } }) {
  const expected = process.env.ADMIN_API_KEY
  if (!expected || request.headers['x-admin-key'] !== expected) return reply.code(401).send({ message: 'No autorizado' })
}
