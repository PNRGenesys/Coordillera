import 'dotenv/config'
import { eq, sql } from 'drizzle-orm'
import { db } from './client.js'
import { categories, collections, inventoryItems, inventoryMovements, productImages, productVariants, products, sizeGuides } from './schema.js'

/** Demo dataset used until the real catalog is loaded. Images are local placeholders served by the web app. */
type VariantSeed = { color: string; size: string; stock: number }
type ProductSeed = {
  slug: string
  name: string
  description: string
  composition: string
  categorySlug: string
  collectionSlug: string
  release: 'available' | 'preorder' | 'coming_soon'
  priceCents: number
  colors: string[]
  sizes: string[]
  stockPerVariant: number
}

const PLACEHOLDER_IMAGE_BASE = '/placeholders'

const sizeGuideSeeds = [
  {
    slug: 'tops', name: 'Tops', measurementUnit: 'cm',
    columns: ['Size', 'Chest', 'Length', 'Sleeve'],
    rows: [
      { Size: 'S', Chest: '96', Length: '69', Sleeve: '20' },
      { Size: 'M', Chest: '104', Length: '72', Sleeve: '21' },
      { Size: 'L', Chest: '112', Length: '74', Sleeve: '22' },
      { Size: 'XL', Chest: '120', Length: '77', Sleeve: '23' },
    ],
  },
  {
    slug: 'outerwear', name: 'Outerwear', measurementUnit: 'cm',
    columns: ['Size', 'Chest', 'Length', 'Shoulder'],
    rows: [
      { Size: 'S', Chest: '104', Length: '70', Shoulder: '46' },
      { Size: 'M', Chest: '112', Length: '73', Shoulder: '48' },
      { Size: 'L', Chest: '120', Length: '76', Shoulder: '50' },
      { Size: 'XL', Chest: '128', Length: '79', Shoulder: '52' },
    ],
  },
]

const categorySeeds = [
  { slug: 't-shirts', name: 'T-shirts', position: 1, sizeGuideSlug: 'tops' },
  { slug: 'outerwear', name: 'Outerwear', position: 2, sizeGuideSlug: 'outerwear' },
  { slug: 'accessories', name: 'Accessories', position: 3, sizeGuideSlug: 'tops' },
]

const collectionSeeds = [
  { slug: 'terrain-01', name: 'Terrain 01', tagline: 'Layers built for changing ground.', description: 'First Coordillera drop: honest materials, muted palette, everyday uniform.', featured: true, releasedDaysAgo: 14 },
  { slug: 'basecamp', name: 'Basecamp', tagline: 'Essentials that stay in rotation.', description: 'Year round pieces that anchor the wardrobe.', featured: false, releasedDaysAgo: 60 },
]

const productSeeds: ProductSeed[] = [
  { slug: 'ridgeline-tee', name: 'Ridgeline Tee', description: 'Boxy heavyweight tee with a dropped shoulder and screen printed ridge graphic.', composition: '100% organic cotton, 240 gsm', categorySlug: 't-shirts', collectionSlug: 'terrain-01', release: 'available', priceCents: 12900000, colors: ['Bone', 'Moss'], sizes: ['S', 'M', 'L', 'XL'], stockPerVariant: 12 },
  { slug: 'scree-longsleeve', name: 'Scree Long Sleeve', description: 'Long sleeve with ribbed cuffs and a washed finish.', composition: '100% cotton, 220 gsm', categorySlug: 't-shirts', collectionSlug: 'terrain-01', release: 'available', priceCents: 16900000, colors: ['Slate'], sizes: ['S', 'M', 'L', 'XL'], stockPerVariant: 8 },
  { slug: 'coordillera-work-jacket', name: 'Coordillera Work Jacket', description: 'Unlined chore jacket with three pockets and a straight hem.', composition: '98% cotton, 2% elastane canvas', categorySlug: 'outerwear', collectionSlug: 'terrain-01', release: 'available', priceCents: 39900000, colors: ['Clay', 'Ink'], sizes: ['S', 'M', 'L', 'XL'], stockPerVariant: 5 },
  { slug: 'basin-hoodie', name: 'Basin Hoodie', description: 'Brushed fleece hoodie with a double layered hood.', composition: '80% cotton, 20% recycled polyester', categorySlug: 'outerwear', collectionSlug: 'basecamp', release: 'available', priceCents: 28900000, colors: ['Bone', 'Ink'], sizes: ['S', 'M', 'L', 'XL'], stockPerVariant: 3 },
  { slug: 'summit-cap', name: 'Summit Cap', description: 'Six panel cap with a curved brim and embroidered mark.', composition: '100% cotton twill', categorySlug: 'accessories', collectionSlug: 'basecamp', release: 'available', priceCents: 8900000, colors: ['Moss', 'Bone'], sizes: ['One size'], stockPerVariant: 20 },
  { slug: 'trail-tote', name: 'Trail Tote', description: 'Reinforced canvas tote with an internal pocket.', composition: '100% cotton canvas, 400 gsm', categorySlug: 'accessories', collectionSlug: 'basecamp', release: 'available', priceCents: 10900000, colors: ['Bone'], sizes: ['One size'], stockPerVariant: 0 },
  { slug: 'glacier-overshirt', name: 'Glacier Overshirt', description: 'Padded overshirt releasing with the next drop.', composition: '100% cotton shell, recycled padding', categorySlug: 'outerwear', collectionSlug: 'terrain-01', release: 'preorder', priceCents: 34900000, colors: ['Slate'], sizes: ['S', 'M', 'L'], stockPerVariant: 4 },
]

const DAY_IN_MS = 24 * 60 * 60 * 1000

function buildVariants(product: ProductSeed): VariantSeed[] {
  return product.colors.flatMap((color) => product.sizes.map((size) => ({ color, size, stock: product.stockPerVariant })))
}

function buildSku(product: ProductSeed, variant: VariantSeed): string {
  const code = (value: string): string => value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()
  return `${code(product.slug)}-${code(variant.color)}-${code(variant.size)}`
}

async function seed(): Promise<void> {
  const now = new Date()

  for (const guide of sizeGuideSeeds) {
    await db.insert(sizeGuides).values(guide).onConflictDoNothing({ target: sizeGuides.slug })
  }
  const guideRows = await db.select({ id: sizeGuides.id, slug: sizeGuides.slug }).from(sizeGuides)
  const guideIdBySlug = new Map(guideRows.map((row) => [row.slug, row.id]))

  for (const category of categorySeeds) {
    await db.insert(categories).values({ name: category.name, slug: category.slug, position: category.position, sizeGuideId: guideIdBySlug.get(category.sizeGuideSlug) })
      .onConflictDoNothing({ target: categories.slug })
  }
  const categoryRows = await db.select({ id: categories.id, slug: categories.slug }).from(categories)
  const categoryIdBySlug = new Map(categoryRows.map((row) => [row.slug, row.id]))

  for (const collection of collectionSeeds) {
    await db.insert(collections).values({
      name: collection.name, slug: collection.slug, tagline: collection.tagline, description: collection.description, featured: collection.featured,
      heroImageUrl: `${PLACEHOLDER_IMAGE_BASE}/${collection.slug}.svg`, releasedAt: new Date(now.getTime() - collection.releasedDaysAgo * DAY_IN_MS),
    }).onConflictDoNothing({ target: collections.slug })
  }
  const collectionRows = await db.select({ id: collections.id, slug: collections.slug }).from(collections)
  const collectionIdBySlug = new Map(collectionRows.map((row) => [row.slug, row.id]))

  for (const product of productSeeds) {
    const [inserted] = await db.insert(products).values({
      name: product.name, slug: product.slug, description: product.description, composition: product.composition, status: 'active', release: product.release,
      categoryId: categoryIdBySlug.get(product.categorySlug), collectionId: collectionIdBySlug.get(product.collectionSlug),
      availableAt: product.release === 'available' ? undefined : new Date(now.getTime() + 21 * DAY_IN_MS),
    }).onConflictDoNothing({ target: products.slug }).returning({ id: products.id })
    if (!inserted) continue

    await db.insert(productImages).values({ productId: inserted.id, url: `${PLACEHOLDER_IMAGE_BASE}/${product.slug}.svg`, alt: product.name, position: 0 })

    for (const variant of buildVariants(product)) {
      const [createdVariant] = await db.insert(productVariants).values({
        productId: inserted.id, sku: buildSku(product, variant), name: `${product.name} ${variant.color} ${variant.size}`,
        color: variant.color, size: variant.size, priceCents: product.priceCents,
      }).onConflictDoNothing({ target: productVariants.sku }).returning({ id: productVariants.id })
      if (!createdVariant) continue
      const [stock] = await db.insert(inventoryItems).values({ variantId: createdVariant.id, onHand: variant.stock, reorderPoint: 3 }).returning({ id: inventoryItems.id })
      if (variant.stock) await db.insert(inventoryMovements).values({ inventoryItemId: stock.id, type: 'restock', quantity: variant.stock, note: 'Demo seed stock' })
    }
  }

  const [summary] = await db.select({ total: sql<number>`count(*)::int` }).from(products).where(eq(products.status, 'active'))
  console.info(`Seed completed. Active products: ${summary.total}`)
}

await seed()
process.exit(0)
