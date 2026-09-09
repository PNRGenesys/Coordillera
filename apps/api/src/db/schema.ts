import { boolean, index, integer, jsonb, pgEnum, pgSequence, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}

export const productStatus = pgEnum('product_status', ['draft', 'active', 'archived'])
export const orderStatus = pgEnum('order_status', ['pending_payment', 'paid', 'processing', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded'])
export const inventoryMovementType = pgEnum('inventory_movement_type', ['restock', 'adjustment', 'reservation', 'release', 'sale', 'return'])

export const releaseStatus = pgEnum('release_status', ['available', 'preorder', 'coming_soon'])
export const customerRole = pgEnum('customer_role', ['customer', 'admin', 'artist'])
export const customDesignRequestStatus = pgEnum('custom_design_request_status', ['pending', 'delivered', 'changes_requested', 'approved'])
export const notificationKind = pgEnum('notification_kind', ['design_delivered', 'changes_requested', 'design_approved'])

export const orderNumberSequence = pgSequence('order_number_seq', { startWith: 1000, increment: 1 })

/**
 * Catalog copy is stored in the columns as authored, and `translations` holds the overrides per language
 * (`{ "es": { "name": "..." } }`). A missing language or field falls back to the column, so nothing is ever blank.
 */
type Translations<Fields> = Record<string, Partial<Fields>>

export const sizeGuides = pgTable('size_guides', {
  id: uuid('id').defaultRandom().primaryKey(), name: varchar('name', { length: 120 }).notNull(), slug: varchar('slug', { length: 140 }).notNull().unique(), measurementUnit: varchar('measurement_unit', { length: 10 }).default('cm').notNull(), columns: jsonb('columns').$type<string[]>().notNull(), rows: jsonb('rows').$type<Record<string, string>[]>().notNull(), translations: jsonb('translations').$type<Translations<{ name: string; columns: string[]; rows: Record<string, string>[] }>>().default({}).notNull(), ...timestamps,
})
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(), name: varchar('name', { length: 120 }).notNull(), slug: varchar('slug', { length: 140 }).notNull().unique(), parentId: uuid('parent_id'), sizeGuideId: uuid('size_guide_id').references(() => sizeGuides.id), position: integer('position').default(0).notNull(), translations: jsonb('translations').$type<Translations<{ name: string }>>().default({}).notNull(), ...timestamps,
})
export const collections = pgTable('collections', {
  id: uuid('id').defaultRandom().primaryKey(), name: varchar('name', { length: 140 }).notNull(), slug: varchar('slug', { length: 160 }).notNull().unique(), tagline: varchar('tagline', { length: 240 }), description: text('description'), heroImageUrl: text('hero_image_url'), releasedAt: timestamp('released_at', { withTimezone: true }), featured: boolean('featured').default(false).notNull(), translations: jsonb('translations').$type<Translations<{ name: string; tagline: string; description: string }>>().default({}).notNull(), ...timestamps,
})
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(), categoryId: uuid('category_id').references(() => categories.id), collectionId: uuid('collection_id').references(() => collections.id), name: varchar('name', { length: 180 }).notNull(), slug: varchar('slug', { length: 200 }).notNull().unique(), description: text('description'), composition: varchar('composition', { length: 240 }), status: productStatus('status').default('draft').notNull(), release: releaseStatus('release').default('available').notNull(), availableAt: timestamp('available_at', { withTimezone: true }), translations: jsonb('translations').$type<Translations<{ name: string; description: string; composition: string }>>().default({}).notNull(), ...timestamps,
}, (table) => [index('products_status_idx').on(table.status), index('products_collection_idx').on(table.collectionId), index('products_category_idx').on(table.categoryId)])
export const productVariants = pgTable('product_variants', {
  id: uuid('id').defaultRandom().primaryKey(), productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(), sku: varchar('sku', { length: 80 }).notNull().unique(), barcode: varchar('barcode', { length: 80 }), name: varchar('name', { length: 180 }).notNull(), color: varchar('color', { length: 60 }), size: varchar('size', { length: 30 }), priceCents: integer('price_cents').notNull(), compareAtPriceCents: integer('compare_at_price_cents'), weightGrams: integer('weight_grams'), attributes: jsonb('attributes').$type<Record<string, string>>().default({}).notNull(), translations: jsonb('translations').$type<Translations<{ name: string; color: string; size: string }>>().default({}).notNull(), ...timestamps,
}, (table) => [index('product_variants_product_idx').on(table.productId)])
export const productImages = pgTable('product_images', {
  id: uuid('id').defaultRandom().primaryKey(), productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(), variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }), url: text('url').notNull(), alt: varchar('alt', { length: 180 }), position: integer('position').default(0).notNull(), ...timestamps,
}, (table) => [index('product_images_product_idx').on(table.productId)])
export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').defaultRandom().primaryKey(), variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }).notNull().unique(), onHand: integer('on_hand').default(0).notNull(), reserved: integer('reserved').default(0).notNull(), reorderPoint: integer('reorder_point').default(0).notNull(), ...timestamps,
})
export const inventoryMovements = pgTable('inventory_movements', {
  id: uuid('id').defaultRandom().primaryKey(), inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id).notNull(), type: inventoryMovementType('type').notNull(), quantity: integer('quantity').notNull(), reference: varchar('reference', { length: 120 }), note: text('note'), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
/**
 * `passwordHash` stays empty for the customers created by a guest checkout: only registered accounts can sign in.
 * `avatar` holds a small square picture as a data URL. It lives in the row because the project has no file
 * storage yet, and the API caps its size so the column cannot grow without a limit.
 * `shippingAddress` is the address the customer keeps on file; each order still copies its own.
 * `acceptingRequests` only means something for `role: 'artist'`: whether they currently show up as a
 * choice for new custom design requests. Their existing queue keeps going regardless of this flag.
 */
export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(), email: varchar('email', { length: 320 }).notNull().unique(), firstName: varchar('first_name', { length: 100 }), lastName: varchar('last_name', { length: 100 }), phone: varchar('phone', { length: 40 }), passwordHash: varchar('password_hash', { length: 200 }), role: customerRole('role').default('customer').notNull(), avatar: text('avatar'), shippingAddress: jsonb('shipping_address').$type<Record<string, string>>(), acceptingRequests: boolean('accepting_requests').default(true).notNull(), ...timestamps,
})
/** Only the hash of the session token is stored, so a database dump cannot be used to impersonate a customer. */
export const customerSessions = pgTable('customer_sessions', {
  id: uuid('id').defaultRandom().primaryKey(), customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(), tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(), expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index('customer_sessions_customer_idx').on(table.customerId)])
export const carts = pgTable('carts', {
  id: uuid('id').defaultRandom().primaryKey(), sessionId: uuid('session_id').notNull().unique(), customerId: uuid('customer_id').references(() => customers.id), currency: varchar('currency', { length: 3 }).default('COP').notNull(), ...timestamps,
})
export const cartItems = pgTable('cart_items', {
  id: uuid('id').defaultRandom().primaryKey(), cartId: uuid('cart_id').references(() => carts.id, { onDelete: 'cascade' }).notNull(), variantId: uuid('variant_id').references(() => productVariants.id).notNull(), quantity: integer('quantity').notNull(), ...timestamps,
}, (table) => [uniqueIndex('cart_variant_unique').on(table.cartId, table.variantId)])
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(), number: varchar('number', { length: 24 }).notNull().unique(), customerId: uuid('customer_id').references(() => customers.id).notNull(), status: orderStatus('status').default('pending_payment').notNull(), currency: varchar('currency', { length: 3 }).default('COP').notNull(), subtotalCents: integer('subtotal_cents').notNull(), shippingCents: integer('shipping_cents').default(0).notNull(), discountCents: integer('discount_cents').default(0).notNull(), taxCents: integer('tax_cents').default(0).notNull(), totalCents: integer('total_cents').notNull(), shippingAddress: jsonb('shipping_address').$type<Record<string, string>>().notNull(), carrier: varchar('carrier', { length: 120 }), trackingNumber: varchar('tracking_number', { length: 120 }), ...timestamps,
})
export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(), orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(), variantId: uuid('variant_id').references(() => productVariants.id).notNull(), sku: varchar('sku', { length: 80 }).notNull(), name: varchar('name', { length: 180 }).notNull(), unitPriceCents: integer('unit_price_cents').notNull(), quantity: integer('quantity').notNull(), ...timestamps,
})
export const inventoryReservations = pgTable('inventory_reservations', {
  id: uuid('id').defaultRandom().primaryKey(), inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id).notNull(), orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(), quantity: integer('quantity').notNull(), expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(), releasedAt: timestamp('released_at', { withTimezone: true }), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index('reservations_pending_idx').on(table.releasedAt, table.expiresAt)])
export const restockRequests = pgTable('restock_requests', {
  id: uuid('id').defaultRandom().primaryKey(), variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }).notNull(), email: varchar('email', { length: 320 }).notNull(), notifiedAt: timestamp('notified_at', { withTimezone: true }), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex('restock_variant_email_unique').on(table.variantId, table.email)])
/**
 * A custom design (fursona) request pays for its base garment up front, so it always has a matching
 * `orders` row (same lifecycle as a regular order). `referenceImageUrl`/`finalDesignImageUrl` are data
 * URLs, same storage approach as `customers.avatar` until the project has real file storage.
 */
export const customDesignRequests = pgTable('custom_design_requests', {
  id: uuid('id').defaultRandom().primaryKey(), customerId: uuid('customer_id').references(() => customers.id).notNull(), artistId: uuid('artist_id').references(() => customers.id).notNull(), baseVariantId: uuid('base_variant_id').references(() => productVariants.id).notNull(), orderId: uuid('order_id').references(() => orders.id).notNull().unique(), characterDescription: text('character_description'), referenceImageUrl: text('reference_image_url').notNull(), finalDesignImageUrl: text('final_design_image_url'), estimatedDays: integer('estimated_days'), revisionNote: text('revision_note'), status: customDesignRequestStatus('status').default('pending').notNull(), ...timestamps,
}, (table) => [index('custom_design_requests_artist_idx').on(table.artistId), index('custom_design_requests_customer_idx').on(table.customerId)])
/** `payload` carries the values a translated notification message interpolates (e.g. the garment name). */
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(), customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(), kind: notificationKind('kind').notNull(), relatedRequestId: uuid('related_request_id').references(() => customDesignRequests.id, { onDelete: 'cascade' }).notNull(), payload: jsonb('payload').$type<Record<string, string>>().default({}).notNull(), readAt: timestamp('read_at', { withTimezone: true }), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index('notifications_customer_idx').on(table.customerId)])
