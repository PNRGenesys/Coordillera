import { integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}

export const productStatus = pgEnum('product_status', ['draft', 'active', 'archived'])
export const orderStatus = pgEnum('order_status', ['pending_payment', 'paid', 'processing', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded'])
export const inventoryMovementType = pgEnum('inventory_movement_type', ['restock', 'adjustment', 'reservation', 'release', 'sale', 'return'])

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(), name: varchar('name', { length: 120 }).notNull(), slug: varchar('slug', { length: 140 }).notNull().unique(), parentId: uuid('parent_id'), ...timestamps,
})
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(), categoryId: uuid('category_id').references(() => categories.id), name: varchar('name', { length: 180 }).notNull(), slug: varchar('slug', { length: 200 }).notNull().unique(), description: text('description'), status: productStatus('status').default('draft').notNull(), ...timestamps,
})
export const productVariants = pgTable('product_variants', {
  id: uuid('id').defaultRandom().primaryKey(), productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(), sku: varchar('sku', { length: 80 }).notNull().unique(), barcode: varchar('barcode', { length: 80 }), name: varchar('name', { length: 180 }).notNull(), color: varchar('color', { length: 60 }), size: varchar('size', { length: 30 }), priceCents: integer('price_cents').notNull(), compareAtPriceCents: integer('compare_at_price_cents'), weightGrams: integer('weight_grams'), attributes: jsonb('attributes').$type<Record<string, string>>().default({}).notNull(), ...timestamps,
})
export const productImages = pgTable('product_images', {
  id: uuid('id').defaultRandom().primaryKey(), productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(), variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }), url: text('url').notNull(), alt: varchar('alt', { length: 180 }), position: integer('position').default(0).notNull(), ...timestamps,
})
export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').defaultRandom().primaryKey(), variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }).notNull().unique(), onHand: integer('on_hand').default(0).notNull(), reserved: integer('reserved').default(0).notNull(), reorderPoint: integer('reorder_point').default(0).notNull(), ...timestamps,
})
export const inventoryMovements = pgTable('inventory_movements', {
  id: uuid('id').defaultRandom().primaryKey(), inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id).notNull(), type: inventoryMovementType('type').notNull(), quantity: integer('quantity').notNull(), reference: varchar('reference', { length: 120 }), note: text('note'), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(), email: varchar('email', { length: 320 }).notNull().unique(), firstName: varchar('first_name', { length: 100 }), lastName: varchar('last_name', { length: 100 }), phone: varchar('phone', { length: 40 }), ...timestamps,
})
export const carts = pgTable('carts', {
  id: uuid('id').defaultRandom().primaryKey(), sessionId: uuid('session_id').notNull().unique(), customerId: uuid('customer_id').references(() => customers.id), currency: varchar('currency', { length: 3 }).default('COP').notNull(), ...timestamps,
})
export const cartItems = pgTable('cart_items', {
  id: uuid('id').defaultRandom().primaryKey(), cartId: uuid('cart_id').references(() => carts.id, { onDelete: 'cascade' }).notNull(), variantId: uuid('variant_id').references(() => productVariants.id).notNull(), quantity: integer('quantity').notNull(), ...timestamps,
}, (table) => [uniqueIndex('cart_variant_unique').on(table.cartId, table.variantId)])
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(), number: varchar('number', { length: 24 }).notNull().unique(), customerId: uuid('customer_id').references(() => customers.id).notNull(), status: orderStatus('status').default('pending_payment').notNull(), currency: varchar('currency', { length: 3 }).default('COP').notNull(), subtotalCents: integer('subtotal_cents').notNull(), shippingCents: integer('shipping_cents').default(0).notNull(), discountCents: integer('discount_cents').default(0).notNull(), taxCents: integer('tax_cents').default(0).notNull(), totalCents: integer('total_cents').notNull(), shippingAddress: jsonb('shipping_address').$type<Record<string, string>>().notNull(), ...timestamps,
})
export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(), orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(), variantId: uuid('variant_id').references(() => productVariants.id).notNull(), sku: varchar('sku', { length: 80 }).notNull(), name: varchar('name', { length: 180 }).notNull(), unitPriceCents: integer('unit_price_cents').notNull(), quantity: integer('quantity').notNull(), ...timestamps,
})
export const inventoryReservations = pgTable('inventory_reservations', {
  id: uuid('id').defaultRandom().primaryKey(), inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id).notNull(), orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(), quantity: integer('quantity').notNull(), expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(), releasedAt: timestamp('released_at', { withTimezone: true }), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
