import 'dotenv/config'
import { eq, notInArray, sql } from 'drizzle-orm'
import { db } from './client.js'
import { categories, collections, inventoryItems, inventoryMovements, productImages, productVariants, products, sizeGuides } from './schema.js'

/** Demo dataset built from the Kemono design sheets stored in `apps/web/public`. */
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

const PRODUCT_IMAGE_BASE = '/products'
const COLLECTION_IMAGE_BASE = '/collections'

const APPAREL_SIZES = ['S', 'M', 'L', 'XL']
const TEE_SIZES = ['S', 'M', 'L', 'XL', 'XXL']
const ONE_SIZE = ['One size']

const sizeGuideSeeds = [
  {
    // Measurements taken from the Furry Casual Tee sheet.
    slug: 'tops', name: 'Tops', measurementUnit: 'cm',
    columns: ['Size', 'Length', 'Width'],
    rows: [
      { Size: 'S', Length: '68', Width: '54' },
      { Size: 'M', Length: '72', Width: '58' },
      { Size: 'L', Length: '76', Width: '62' },
      { Size: 'XL', Length: '80', Width: '66' },
      { Size: 'XXL', Length: '82', Width: '70' },
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
  // Pants and accessories have no measurement sheet yet, so they ship without a size guide.
  { slug: 'pants', name: 'Pants', position: 3, sizeGuideSlug: undefined },
  { slug: 'accessories', name: 'Accessories', position: 4, sizeGuideSlug: undefined },
]

const collectionSeeds = [
  { slug: 'wildspirit', name: 'Wildspirit', tagline: 'Furry streetwear for every day.', description: 'Denim, fleece and synthetic fur with embroidered paws, claws and kemono patches.', featured: true, releasedDaysAgo: 14, heroImageUrl: `${COLLECTION_IMAGE_BASE}/wildspirit.jpg` },
  { slug: 'fauna-series', name: 'Fauna Series', tagline: 'One animal, one tee.', description: 'Tees that turn an animal coat into a print. Neutral colours, unisex regular fit.', featured: false, releasedDaysAgo: 40, heroImageUrl: `${PRODUCT_IMAGE_BASE}/dalma-spots-tee.jpg` },
]

const productSeeds: ProductSeed[] = [
  { slug: 'furry-denim-jacket', name: 'Furry Denim Jacket', description: 'Washed black denim jacket lined in synthetic fur, with integrated ears on the collar, a spine of triangular tufts and a short heart shaped tail.', composition: '100% cotton denim, synthetic fur lining', categorySlug: 'outerwear', collectionSlug: 'wildspirit', release: 'available', priceCents: 45900000, colors: ['Washed Black'], sizes: APPAREL_SIZES, stockPerVariant: 4 },
  { slug: 'furry-denim-pants', name: 'Furry Denim Pants', description: 'Relaxed denim pants with cargo pockets, embroidered patches and adjustable fur cuffs at the ankle.', composition: '100% cotton denim, synthetic fur trims', categorySlug: 'pants', collectionSlug: 'wildspirit', release: 'available', priceCents: 32900000, colors: ['Washed Black'], sizes: APPAREL_SIZES, stockPerVariant: 5 },
  { slug: 'furry-casual-tee', name: 'Furry Casual Tee', description: 'Oversize tee with a fur trimmed hood, 3D ears held by a flexible wire and a high density back print.', composition: '100% cotton, 220-240 gsm, synthetic fur details', categorySlug: 't-shirts', collectionSlug: 'wildspirit', release: 'available', priceCents: 18900000, colors: ['Black Purple', 'Grey Orange', 'Cream Blue'], sizes: TEE_SIZES, stockPerVariant: 6 },
  { slug: 'furry-hoodie', name: 'Furry Hoodie', description: 'Heavyweight hoodie with a fur lined hood, integrated ears and embroidered claw and paw graphics.', composition: '100% cotton, 320 gsm, synthetic fur lining', categorySlug: 'outerwear', collectionSlug: 'wildspirit', release: 'available', priceCents: 28900000, colors: ['Yellow'], sizes: APPAREL_SIZES, stockPerVariant: 8 },
  { slug: 'furry-socks', name: 'Furry Socks', description: 'Crew socks with embroidered graphics, light arch compression and a padded paw print sole.', composition: 'Combed cotton with spandex', categorySlug: 'accessories', collectionSlug: 'wildspirit', release: 'available', priceCents: 4900000, colors: ['Yellow'], sizes: ONE_SIZE, stockPerVariant: 30 },
  { slug: 'furry-gloves', name: 'Furry Gloves', description: 'Breathable gloves with flexible 3D printed claws, a fur cuff and a padded non slip paw palm.', composition: 'Nylon and spandex, synthetic microfibre, TPU claws', categorySlug: 'accessories', collectionSlug: 'wildspirit', release: 'available', priceCents: 11900000, colors: ['Yellow'], sizes: APPAREL_SIZES, stockPerVariant: 10 },
  { slug: 'furry-cap', name: 'Furry Cap', description: 'Adjustable cap with removable ears, a 3D silicone nose and nylon whiskers on the crown.', composition: '100% premium cotton twill', categorySlug: 'accessories', collectionSlug: 'wildspirit', release: 'available', priceCents: 9900000, colors: ['Yellow'], sizes: ONE_SIZE, stockPerVariant: 15 },
  { slug: 'furry-beanie', name: 'Furry Beanie', description: 'Two in one wool beanie: fold the muzzle up to wear it as a beanie or pull it down to wear it as a mask. Padded paw ear flaps.', composition: 'Premium acrylic wool, thermal fleece lining', categorySlug: 'accessories', collectionSlug: 'wildspirit', release: 'available', priceCents: 8900000, colors: ['Yellow'], sizes: ONE_SIZE, stockPerVariant: 0 },
  { slug: 'dalma-spots-tee', name: 'Dalma Spots Tee', description: 'Regular fit tee with an all over cartoon spot print, a sky blue rib collar and an embroidered paw on the chest.', composition: '100% premium cotton, pre shrunk', categorySlug: 't-shirts', collectionSlug: 'fauna-series', release: 'available', priceCents: 15900000, colors: ['Cream'], sizes: TEE_SIZES, stockPerVariant: 10 },
  { slug: 'dalma-coat-tee', name: 'Dalma Coat Tee', description: 'Regular fit tee printed with a stylised coat texture on the chest and a sky blue rib collar.', composition: '100% premium cotton, pre shrunk', categorySlug: 't-shirts', collectionSlug: 'fauna-series', release: 'available', priceCents: 15900000, colors: ['Heather Grey'], sizes: TEE_SIZES, stockPerVariant: 10 },
  { slug: 'dalmata-rainbow-tee', name: 'Dalmata Rainbow Tee', description: 'Regular fit tee with a rainbow rib collar, blue ear inspired sleeve stripes and a coat texture print front and back.', composition: '100% premium cotton, pre shrunk', categorySlug: 't-shirts', collectionSlug: 'fauna-series', release: 'preorder', priceCents: 16900000, colors: ['Heather Grey'], sizes: TEE_SIZES, stockPerVariant: 6 },
]

const DAY_IN_MS = 24 * 60 * 60 * 1000

function buildVariants(product: ProductSeed): VariantSeed[] {
  return product.colors.flatMap((color) => product.sizes.map((size) => ({ color, size, stock: product.stockPerVariant })))
}

/** Slug initials keep the code short while staying unique between products such as `furry-cap` and `furry-casual-tee`. */
function buildSku(product: ProductSeed, variant: VariantSeed): string {
  const initials = product.slug.split('-').map((word) => word[0]).join('').toUpperCase()
  const code = (value: string): string => value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()
  return `${initials}-${code(variant.color)}-${code(variant.size)}`
}

/** A repeated SKU would be skipped on insert and leave a product without variants, so it stops the seed. */
function assertUniqueSkus(): void {
  const skus = productSeeds.flatMap((product) => buildVariants(product).map((variant) => buildSku(product, variant)))
  const duplicates = skus.filter((sku, index) => skus.indexOf(sku) !== index)
  if (duplicates.length) throw new Error(`Duplicated SKUs in the seed: ${[...new Set(duplicates)].join(', ')}`)
}

async function seed(): Promise<void> {
  assertUniqueSkus()
  const now = new Date()

  for (const guide of sizeGuideSeeds) {
    await db.insert(sizeGuides).values(guide)
      .onConflictDoUpdate({ target: sizeGuides.slug, set: { name: guide.name, measurementUnit: guide.measurementUnit, columns: guide.columns, rows: guide.rows, updatedAt: new Date() } })
  }
  const guideRows = await db.select({ id: sizeGuides.id, slug: sizeGuides.slug }).from(sizeGuides)
  const guideIdBySlug = new Map(guideRows.map((row) => [row.slug, row.id]))

  for (const category of categorySeeds) {
    const sizeGuideId = category.sizeGuideSlug ? guideIdBySlug.get(category.sizeGuideSlug) : undefined
    await db.insert(categories).values({ name: category.name, slug: category.slug, position: category.position, sizeGuideId })
      .onConflictDoUpdate({ target: categories.slug, set: { name: category.name, position: category.position, sizeGuideId: sizeGuideId ?? null, updatedAt: new Date() } })
  }
  const categoryRows = await db.select({ id: categories.id, slug: categories.slug }).from(categories)
  const categoryIdBySlug = new Map(categoryRows.map((row) => [row.slug, row.id]))

  for (const collection of collectionSeeds) {
    await db.insert(collections).values({
      name: collection.name, slug: collection.slug, tagline: collection.tagline, description: collection.description, featured: collection.featured,
      heroImageUrl: collection.heroImageUrl, releasedAt: new Date(now.getTime() - collection.releasedDaysAgo * DAY_IN_MS),
    }).onConflictDoUpdate({
      target: collections.slug,
      set: { name: collection.name, tagline: collection.tagline, description: collection.description, featured: collection.featured, heroImageUrl: collection.heroImageUrl, updatedAt: new Date() },
    })
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

    await db.insert(productImages).values({ productId: inserted.id, url: `${PRODUCT_IMAGE_BASE}/${product.slug}.jpg`, alt: product.name, position: 0 })

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

  // Products from earlier seeds are archived instead of deleted, because orders may still reference them.
  await db.update(products).set({ status: 'archived', updatedAt: new Date() })
    .where(notInArray(products.slug, productSeeds.map((product) => product.slug)))

  const [summary] = await db.select({ total: sql<number>`count(*)::int` }).from(products).where(eq(products.status, 'active'))
  console.info(`Seed completed. Active products: ${summary.total}`)
}

await seed()
process.exit(0)
