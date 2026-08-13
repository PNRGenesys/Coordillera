import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { and, asc, eq, sql } from 'drizzle-orm'
import { config } from '../config.js'
import { db } from '../db/client.js'
import { availableUnits } from '../db/queries.js'
import { inventoryItems, inventoryMovements, productVariants, products } from '../db/schema.js'
import { DomainError } from '../errors.js'
import { inventoryAdjustmentSchema, productCreateSchema } from '../schemas.js'

async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const expected = process.env.ADMIN_API_KEY
  if (!expected || request.headers['x-admin-key'] !== expected) {
    await reply.code(401).send({ code: 'unauthorized', message: 'Missing or invalid admin key' })
  }
}

export function registerAdminRoutes(app: FastifyInstance): void {
  app.get('/api/admin/inventory', { preHandler: requireAdmin }, async () => db.select({
    variantId: productVariants.id,
    sku: productVariants.sku,
    productName: products.name,
    color: productVariants.color,
    size: productVariants.size,
    onHand: inventoryItems.onHand,
    reserved: inventoryItems.reserved,
    reorderPoint: inventoryItems.reorderPoint,
    availableUnits: sql<number>`coalesce(${availableUnits}, 0)::int`,
    lowStock: sql<boolean>`coalesce(${availableUnits}, 0) <= greatest(${inventoryItems.reorderPoint}, ${config.lowStockThreshold})`,
  }).from(productVariants).innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(inventoryItems, eq(inventoryItems.variantId, productVariants.id)).orderBy(asc(products.name), asc(productVariants.sku)))

  app.post('/api/admin/inventory/adjustments', { preHandler: requireAdmin }, async (request) => {
    const input = inventoryAdjustmentSchema.parse(request.body)
    const [stock] = await db.update(inventoryItems).set({ onHand: sql`${inventoryItems.onHand} + ${input.quantity}`, updatedAt: new Date() })
      .where(and(eq(inventoryItems.variantId, input.variantId), sql`${inventoryItems.onHand} + ${input.quantity} >= ${inventoryItems.reserved}`)).returning()
    if (!stock) throw new DomainError('invalid_adjustment', 'Adjustment would leave less stock than already reserved, or the variant has no inventory record', { variantId: input.variantId })
    await db.insert(inventoryMovements).values({ inventoryItemId: stock.id, type: 'adjustment', quantity: input.quantity, note: input.note })
    return stock
  })

  app.post('/api/admin/products', { preHandler: requireAdmin }, async (request, reply) => {
    const input = productCreateSchema.parse(request.body)
    const product = await db.transaction(async (tx) => {
      const [created] = await tx.insert(products).values({
        name: input.name, slug: input.slug, description: input.description, composition: input.composition,
        categoryId: input.categoryId, collectionId: input.collectionId, release: input.release, status: 'draft',
      }).returning()
      for (const variant of input.variants) {
        const [createdVariant] = await tx.insert(productVariants).values({ productId: created.id, sku: variant.sku, name: variant.name, priceCents: variant.priceCents, color: variant.color, size: variant.size }).returning()
        const [stock] = await tx.insert(inventoryItems).values({ variantId: createdVariant.id, onHand: variant.initialStock }).returning()
        if (variant.initialStock) await tx.insert(inventoryMovements).values({ inventoryItemId: stock.id, type: 'restock', quantity: variant.initialStock, note: 'Initial stock' })
      }
      return created
    })
    return reply.code(201).send(product)
  })
}
