import type { FastifyInstance } from 'fastify'
import { and, asc, desc, eq, exists, inArray, sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { availableUnits, productAvailableUnits } from '../db/queries.js'
import { categories, collections, inventoryItems, productImages, productVariants, products, sizeGuides } from '../db/schema.js'
import { DomainError } from '../errors.js'
import { catalogQuerySchema, slugSchema } from '../schemas.js'

type ProductImage = { url: string; alt: string | null; position: number }

async function findImagesByProduct(productIds: string[]): Promise<Map<string, ProductImage[]>> {
  const grouped = new Map<string, ProductImage[]>()
  if (!productIds.length) return grouped
  const rows = await db.select({ productId: productImages.productId, url: productImages.url, alt: productImages.alt, position: productImages.position })
    .from(productImages).where(inArray(productImages.productId, productIds)).orderBy(asc(productImages.position))
  for (const row of rows) {
    const current = grouped.get(row.productId) ?? []
    current.push({ url: row.url, alt: row.alt, position: row.position })
    grouped.set(row.productId, current)
  }
  return grouped
}

export function registerCatalogRoutes(app: FastifyInstance): void {
  app.get('/api/collections', async () => db.select({ id: collections.id, name: collections.name, slug: collections.slug, tagline: collections.tagline, heroImageUrl: collections.heroImageUrl, releasedAt: collections.releasedAt, featured: collections.featured })
    .from(collections).orderBy(desc(collections.featured), desc(collections.releasedAt)))

  app.get('/api/categories', async () => db.select({ id: categories.id, name: categories.name, slug: categories.slug, position: categories.position })
    .from(categories).orderBy(asc(categories.position), asc(categories.name)))

  app.get('/api/products', async (request) => {
    const query = catalogQuerySchema.parse(request.query)
    const filters = [eq(products.status, 'active')]
    if (query.collection) filters.push(eq(collections.slug, query.collection))
    if (query.category) filters.push(eq(categories.slug, query.category))
    if (query.color) filters.push(exists(db.select({ value: sql`1` }).from(productVariants).where(and(eq(productVariants.productId, products.id), eq(productVariants.color, query.color)))))
    if (query.size) filters.push(exists(db.select({ value: sql`1` }).from(productVariants).where(and(eq(productVariants.productId, products.id), eq(productVariants.size, query.size)))))
    const where = and(...filters)

    const base = db.select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      release: products.release,
      availableAt: products.availableAt,
      categorySlug: categories.slug,
      collectionSlug: collections.slug,
      collectionName: collections.name,
      minPriceCents: sql<number>`min(${productVariants.priceCents})::int`,
      maxPriceCents: sql<number>`max(${productVariants.priceCents})::int`,
      colors: sql<string[]>`coalesce(array_agg(distinct ${productVariants.color}) filter (where ${productVariants.color} is not null), '{}')`,
      sizes: sql<string[]>`coalesce(array_agg(distinct ${productVariants.size}) filter (where ${productVariants.size} is not null), '{}')`,
      availableUnits: productAvailableUnits,
    })
      .from(products)
      .innerJoin(productVariants, eq(productVariants.productId, products.id))
      .leftJoin(inventoryItems, eq(inventoryItems.variantId, productVariants.id))
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .leftJoin(collections, eq(collections.id, products.collectionId))
      .where(where)
      .groupBy(products.id, categories.slug, collections.slug, collections.name)

    const paged = query.availability === 'in_stock' ? base.having(sql`${productAvailableUnits} > 0`) : base
    const rows = await paged.orderBy(desc(products.createdAt)).limit(query.pageSize).offset((query.page - 1) * query.pageSize)

    const [countRow] = await db.select({ total: sql<number>`count(distinct ${products.id})::int` })
      .from(products)
      .innerJoin(productVariants, eq(productVariants.productId, products.id))
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .leftJoin(collections, eq(collections.id, products.collectionId))
      .where(where)

    const imagesByProduct = await findImagesByProduct(rows.map((row) => row.id))
    return {
      page: query.page,
      pageSize: query.pageSize,
      total: countRow?.total ?? 0,
      items: rows.map((row) => ({ ...row, imageUrl: imagesByProduct.get(row.id)?.[0]?.url ?? null })),
    }
  })

  app.get('/api/products/:slug', async (request) => {
    const { slug } = slugSchema.parse(request.params)
    const [product] = await db.select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      composition: products.composition,
      release: products.release,
      availableAt: products.availableAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
      collectionName: collections.name,
      collectionSlug: collections.slug,
      sizeGuideName: sizeGuides.name,
      sizeGuideUnit: sizeGuides.measurementUnit,
      sizeGuideColumns: sizeGuides.columns,
      sizeGuideRows: sizeGuides.rows,
    })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .leftJoin(collections, eq(collections.id, products.collectionId))
      .leftJoin(sizeGuides, eq(sizeGuides.id, categories.sizeGuideId))
      .where(and(eq(products.slug, slug), eq(products.status, 'active')))
    if (!product) throw new DomainError('product_not_found', 'Product not found', { slug })

    const variants = await db.select({
      id: productVariants.id,
      sku: productVariants.sku,
      name: productVariants.name,
      color: productVariants.color,
      size: productVariants.size,
      priceCents: productVariants.priceCents,
      compareAtPriceCents: productVariants.compareAtPriceCents,
      availableUnits: sql<number>`coalesce(${availableUnits}, 0)::int`,
    }).from(productVariants).leftJoin(inventoryItems, eq(inventoryItems.variantId, productVariants.id))
      .where(eq(productVariants.productId, product.id)).orderBy(asc(productVariants.size), asc(productVariants.sku))

    const images = (await findImagesByProduct([product.id])).get(product.id) ?? []
    return { ...product, images, variants }
  })
}
