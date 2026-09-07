import type { FastifyInstance } from 'fastify'
import { and, asc, desc, eq, exists, inArray, sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { availableUnits, productAvailableUnits } from '../db/queries.js'
import { categories, collections, inventoryItems, productImages, productVariants, products, sizeGuides } from '../db/schema.js'
import { DomainError } from '../errors.js'
import { overridesFor, type Locale } from '../i18n.js'
import { catalogQuerySchema, localeQuerySchema, slugSchema } from '../schemas.js'

type ProductImage = { url: string; alt: string | null; position: number }

/** Colours and sizes are filtered by their stored value, so the translated text travels next to it as a label. */
type Facet = { value: string; label: string }

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

/** Facets come from the variants of the listed products, so they need the translation of each variant. */
async function findFacetsByProduct(productIds: string[], locale: Locale): Promise<Map<string, { colors: Facet[]; sizes: Facet[] }>> {
  const grouped = new Map<string, { colors: Facet[]; sizes: Facet[] }>()
  if (!productIds.length) return grouped
  const rows = await db.select({ productId: productVariants.productId, color: productVariants.color, size: productVariants.size, translations: productVariants.translations })
    .from(productVariants).where(inArray(productVariants.productId, productIds)).orderBy(asc(productVariants.sku))

  for (const row of rows) {
    const overrides = overridesFor(row.translations, locale)
    const current = grouped.get(row.productId) ?? { colors: [], sizes: [] }
    if (row.color && !current.colors.some((facet) => facet.value === row.color)) current.colors.push({ value: row.color, label: overrides.color ?? row.color })
    if (row.size && !current.sizes.some((facet) => facet.value === row.size)) current.sizes.push({ value: row.size, label: overrides.size ?? row.size })
    grouped.set(row.productId, current)
  }
  return grouped
}

export function registerCatalogRoutes(app: FastifyInstance): void {
  app.get('/api/collections', async (request) => {
    const { lang } = localeQuerySchema.parse(request.query)
    const rows = await db.select({ id: collections.id, name: collections.name, slug: collections.slug, tagline: collections.tagline, heroImageUrl: collections.heroImageUrl, releasedAt: collections.releasedAt, featured: collections.featured, translations: collections.translations })
      .from(collections).orderBy(desc(collections.featured), desc(collections.releasedAt))

    return rows.map(({ translations, ...collection }) => {
      const overrides = overridesFor(translations, lang)
      return { ...collection, name: overrides.name ?? collection.name, tagline: overrides.tagline ?? collection.tagline }
    })
  })

  app.get('/api/categories', async (request) => {
    const { lang } = localeQuerySchema.parse(request.query)
    const rows = await db.select({ id: categories.id, name: categories.name, slug: categories.slug, position: categories.position, translations: categories.translations })
      .from(categories).orderBy(asc(categories.position), asc(categories.name))

    return rows.map(({ translations, ...category }) => ({ ...category, name: overridesFor(translations, lang).name ?? category.name }))
  })

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
      translations: products.translations,
      release: products.release,
      availableAt: products.availableAt,
      categorySlug: categories.slug,
      collectionSlug: collections.slug,
      collectionName: collections.name,
      collectionTranslations: collections.translations,
      minPriceCents: sql<number>`min(${productVariants.priceCents})::int`,
      maxPriceCents: sql<number>`max(${productVariants.priceCents})::int`,
      availableUnits: productAvailableUnits,
    })
      .from(products)
      .innerJoin(productVariants, eq(productVariants.productId, products.id))
      .leftJoin(inventoryItems, eq(inventoryItems.variantId, productVariants.id))
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .leftJoin(collections, eq(collections.id, products.collectionId))
      .where(where)
      .groupBy(products.id, categories.slug, collections.slug, collections.name, collections.translations)

    const paged = query.availability === 'in_stock' ? base.having(sql`${productAvailableUnits} > 0`) : base
    const rows = await paged.orderBy(desc(products.createdAt)).limit(query.pageSize).offset((query.page - 1) * query.pageSize)

    const [countRow] = await db.select({ total: sql<number>`count(distinct ${products.id})::int` })
      .from(products)
      .innerJoin(productVariants, eq(productVariants.productId, products.id))
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .leftJoin(collections, eq(collections.id, products.collectionId))
      .where(where)

    const productIds = rows.map((row) => row.id)
    const imagesByProduct = await findImagesByProduct(productIds)
    const facetsByProduct = await findFacetsByProduct(productIds, query.lang)

    return {
      page: query.page,
      pageSize: query.pageSize,
      total: countRow?.total ?? 0,
      items: rows.map(({ translations, collectionTranslations, ...row }) => {
        const facets = facetsByProduct.get(row.id) ?? { colors: [], sizes: [] }
        return {
          ...row,
          name: overridesFor(translations, query.lang).name ?? row.name,
          collectionName: overridesFor(collectionTranslations, query.lang).name ?? row.collectionName,
          colors: facets.colors,
          sizes: facets.sizes,
          imageUrl: imagesByProduct.get(row.id)?.[0]?.url ?? null,
        }
      }),
    }
  })

  app.get('/api/products/:slug', async (request) => {
    const { slug } = slugSchema.parse(request.params)
    const { lang } = localeQuerySchema.parse(request.query)
    const [row] = await db.select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      composition: products.composition,
      translations: products.translations,
      release: products.release,
      availableAt: products.availableAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryTranslations: categories.translations,
      collectionName: collections.name,
      collectionSlug: collections.slug,
      collectionTranslations: collections.translations,
      sizeGuideName: sizeGuides.name,
      sizeGuideUnit: sizeGuides.measurementUnit,
      sizeGuideColumns: sizeGuides.columns,
      sizeGuideRows: sizeGuides.rows,
      sizeGuideTranslations: sizeGuides.translations,
    })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .leftJoin(collections, eq(collections.id, products.collectionId))
      .leftJoin(sizeGuides, eq(sizeGuides.id, categories.sizeGuideId))
      .where(and(eq(products.slug, slug), eq(products.status, 'active')))
    if (!row) throw new DomainError('product_not_found', 'Product not found', { slug })

    const { translations, categoryTranslations, collectionTranslations, sizeGuideTranslations, ...product } = row
    const overrides = overridesFor(translations, lang)
    const guide = overridesFor(sizeGuideTranslations, lang)

    const variantRows = await db.select({
      id: productVariants.id,
      sku: productVariants.sku,
      name: productVariants.name,
      color: productVariants.color,
      size: productVariants.size,
      translations: productVariants.translations,
      priceCents: productVariants.priceCents,
      compareAtPriceCents: productVariants.compareAtPriceCents,
      availableUnits: sql<number>`coalesce(${availableUnits}, 0)::int`,
    }).from(productVariants).leftJoin(inventoryItems, eq(inventoryItems.variantId, productVariants.id))
      .where(eq(productVariants.productId, product.id)).orderBy(asc(productVariants.size), asc(productVariants.sku))

    const variants = variantRows.map(({ translations: variantTranslations, ...variant }) => {
      const variantOverrides = overridesFor(variantTranslations, lang)
      return { ...variant, name: variantOverrides.name ?? variant.name, color: variantOverrides.color ?? variant.color, size: variantOverrides.size ?? variant.size }
    })

    const images = (await findImagesByProduct([product.id])).get(product.id) ?? []
    return {
      ...product,
      name: overrides.name ?? product.name,
      description: overrides.description ?? product.description,
      composition: overrides.composition ?? product.composition,
      categoryName: overridesFor(categoryTranslations, lang).name ?? product.categoryName,
      collectionName: overridesFor(collectionTranslations, lang).name ?? product.collectionName,
      sizeGuideName: guide.name ?? product.sizeGuideName,
      sizeGuideColumns: guide.columns ?? product.sizeGuideColumns,
      sizeGuideRows: guide.rows ?? product.sizeGuideRows,
      images,
      variants,
    }
  })
}
