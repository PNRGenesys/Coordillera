import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { hashPassword } from '../auth/password.js'
import { db } from '../db/client.js'
import { customerSessions, customers } from '../db/schema.js'

const [email, password] = process.argv.slice(2)
const passwordHash = await hashPassword(password)

const [account] = await db.update(customers).set({ passwordHash, updatedAt: new Date() })
  .where(eq(customers.email, email)).returning({ id: customers.id, email: customers.email, role: customers.role })

// A password change must invalidate the sessions opened with the old one.
const removed = await db.delete(customerSessions).where(eq(customerSessions.customerId, account.id)).returning({ id: customerSessions.id })

console.info(`Password updated for ${account.email} (${account.role}). Closed sessions: ${removed.length}.`)
process.exit(0)
