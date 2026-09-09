import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../app.js'
import { db } from '../db/client.js'
import { categories, inventoryItems, productVariants, products } from '../db/schema.js'

/** Integration tests: they need the local PostgreSQL instance from docker compose. */

const TEST_PRODUCT_SLUG = 'catalog-test-product'
const TEST_CATEGORY_SLUG = 'catalog-test-category'
const TEST_SKU = 'CATALOG-TEST-SKU'
const OUT_OF_STOCK_PRODUCT_SLUG = 'catalog-test-out-of-stock'
const OUT_OF_STOCK_SKU = 'CATALOG-TEST-OOS-SKU'

type ProductDetail = {
  name: string
  description: string | null
  categoryName: string | null
  variants: { color: string | null; size: string | null }[]
}

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
  await db.delete(products).where(eq(products.slug, TEST_PRODUCT_SLUG))
  await db.delete(categories).where(eq(categories.slug, TEST_CATEGORY_SLUG))

  const [category] = await db.insert(categories).values({
    name: 'Test Category', slug: TEST_CATEGORY_SLUG, translations: { es: { name: 'Categoria de prueba' } },
  }).returning({ id: categories.id })
  if (!category) throw new Error('Test category insert returned no row')

  const [product] = await db.insert(products).values({
    name: 'Catalog Test Product', slug: TEST_PRODUCT_SLUG, description: 'English description', status: 'active', categoryId: category.id,
    translations: { es: { name: 'Producto de prueba', description: 'Descripcion en espanol' } },
  }).returning({ id: products.id })
  if (!product) throw new Error('Test product insert returned no row')

  const [variant] = await db.insert(productVariants).values({
    productId: product.id, sku: TEST_SKU, name: 'Catalog Test Variant', color: 'Cream', size: 'One size', priceCents: 1_000_00,
    translations: { es: { name: 'Variante de prueba', color: 'Crema', size: 'Talla unica' } },
  }).returning({ id: productVariants.id })
  if (!variant) throw new Error('Test variant insert returned no row')

  await db.insert(inventoryItems).values({ variantId: variant.id, onHand: 5 })

  // No inventory row at all, so `productAvailableUnits` is 0: this product must count towards the
  // catalog's overall `total` but drop out of it once `availability=in_stock` is requested.
  await db.delete(products).where(eq(products.slug, OUT_OF_STOCK_PRODUCT_SLUG))
  const [outOfStockProduct] = await db.insert(products).values({
    name: 'Catalog Test Out Of Stock', slug: OUT_OF_STOCK_PRODUCT_SLUG, status: 'active',
  }).returning({ id: products.id })
  if (!outOfStockProduct) throw new Error('Out of stock test product insert returned no row')
  await db.insert(productVariants).values({
    productId: outOfStockProduct.id, sku: OUT_OF_STOCK_SKU, name: 'Catalog Test Out Of Stock Variant', priceCents: 1_000_00,
  })
})

afterAll(async () => {
  await db.delete(products).where(eq(products.slug, TEST_PRODUCT_SLUG))
  await db.delete(products).where(eq(products.slug, OUT_OF_STOCK_PRODUCT_SLUG))
  await db.delete(categories).where(eq(categories.slug, TEST_CATEGORY_SLUG))
  await app.close()
})

describe('catalog language', () => {
  it('answers in Spanish by default', async () => {
    const response = await app.inject({ method: 'GET', url: `/api/products/${TEST_PRODUCT_SLUG}` })
    const product = response.json<ProductDetail>()

    expect(product.name).toBe('Producto de prueba')
    expect(product.description).toBe('Descripcion en espanol')
    expect(product.categoryName).toBe('Categoria de prueba')
    expect(product.variants[0]).toMatchObject({ color: 'Crema', size: 'Talla unica' })
  })

  it('answers with the stored copy when English is requested', async () => {
    const response = await app.inject({ method: 'GET', url: `/api/products/${TEST_PRODUCT_SLUG}?lang=en` })
    const product = response.json<ProductDetail>()

    expect(product.name).toBe('Catalog Test Product')
    expect(product.description).toBe('English description')
    expect(product.categoryName).toBe('Test Category')
    expect(product.variants[0]).toMatchObject({ color: 'Cream', size: 'One size' })
  })

  it('keeps the stored value of a facet next to its translated label, so filters keep working', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/products?lang=es&pageSize=60' })
    const item = response.json<{ items: { slug: string; colors: { value: string; label: string }[] }[] }>()
      .items.find((entry) => entry.slug === TEST_PRODUCT_SLUG)

    expect(item?.colors).toEqual([{ value: 'Cream', label: 'Crema' }])

    const filtered = await app.inject({ method: 'GET', url: '/api/products?lang=es&color=Cream&pageSize=60' })
    expect(filtered.json<{ items: { slug: string }[] }>().items.some((entry) => entry.slug === TEST_PRODUCT_SLUG)).toBe(true)
  })

  it('rejects a language that is not supported', async () => {
    const response = await app.inject({ method: 'GET', url: `/api/products/${TEST_PRODUCT_SLUG}?lang=fr` })
    expect(response.statusCode).toBe(400)
    expect(response.json().code).toBe('invalid_request')
  })
})

describe('catalog pagination', () => {
  it('counts only in-stock products in `total` once availability=in_stock is requested, not every match', async () => {
    const all = await app.inject({ method: 'GET', url: '/api/products?lang=es&pageSize=1' })
    const inStock = await app.inject({ method: 'GET', url: '/api/products?lang=es&pageSize=1&availability=in_stock' })

    const { total: allTotal } = all.json<{ total: number }>()
    const { total: inStockTotal, items } = inStock.json<{ total: number; items: { slug: string }[] }>()

    expect(inStockTotal).toBeLessThan(allTotal)
    expect(items.every((item) => item.slug !== OUT_OF_STOCK_PRODUCT_SLUG)).toBe(true)
  })
})
