import { sql } from 'drizzle-orm'
import { inventoryItems } from './schema.js'

/** Units that can still be sold for a variant: on hand minus already reserved. */
export const availableUnits = sql<number>`greatest(${inventoryItems.onHand} - ${inventoryItems.reserved}, 0)`

/** Same value aggregated over every variant joined to a product. */
export const productAvailableUnits = sql<number>`coalesce(sum(greatest(${inventoryItems.onHand} - ${inventoryItems.reserved}, 0))::int, 0)`

/** Sequential, human readable order number backed by a Postgres sequence. */
export const nextOrderNumber = sql<string>`'ORD-' || lpad(nextval('order_number_seq')::text, 6, '0')`
