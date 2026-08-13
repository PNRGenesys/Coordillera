import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL es obligatoria. Copia apps/api/.env.example a .env.')
}

const client = postgres(connectionString)
export const db = drizzle({ client, schema })
