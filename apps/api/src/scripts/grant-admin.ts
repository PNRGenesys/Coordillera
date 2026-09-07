import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { customers } from '../db/schema.js'

/** Promotes an existing account to administrator: `npm run admin:grant --workspace=@cordillera/api -- <email>`. */
const email = process.argv[2]
if (!email) {
  console.error('Usage: admin:grant -- <email>')
  process.exit(1)
}

const [account] = await db.update(customers).set({ role: 'admin', updatedAt: new Date() })
  .where(eq(customers.email, email)).returning({ email: customers.email, role: customers.role, hasPassword: customers.passwordHash })

if (!account) {
  console.error(`No customer with email ${email}. Create the account from the store first.`)
  process.exit(1)
}
if (!account.hasPassword) {
  console.error(`${email} has no password yet, so it cannot sign in. Register it from the store first.`)
  process.exit(1)
}

console.info(`${account.email} is now ${account.role}.`)
process.exit(0)
