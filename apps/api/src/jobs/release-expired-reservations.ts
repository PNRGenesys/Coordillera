import 'dotenv/config'
import { and, eq, isNull, lt, sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { inventoryItems, inventoryMovements, inventoryReservations } from '../db/schema.js'

const expired = await db.transaction(async (tx) => {
  const reservations = await tx.select().from(inventoryReservations).where(and(isNull(inventoryReservations.releasedAt), lt(inventoryReservations.expiresAt, new Date())))
  for (const reservation of reservations) {
    await tx.update(inventoryItems).set({ reserved: sql`${inventoryItems.reserved} - ${reservation.quantity}`, updatedAt: new Date() }).where(eq(inventoryItems.id, reservation.inventoryItemId))
    await tx.update(inventoryReservations).set({ releasedAt: new Date() }).where(eq(inventoryReservations.id, reservation.id))
    await tx.insert(inventoryMovements).values({ inventoryItemId: reservation.inventoryItemId, type: 'release', quantity: reservation.quantity, reference: reservation.orderId, note: 'Expired reservation' })
  }
  return reservations.length
})

console.info(`Released reservations: ${expired}`)
// The database pool keeps the event loop alive, so the job has to close itself to be schedulable.
process.exit(0)
