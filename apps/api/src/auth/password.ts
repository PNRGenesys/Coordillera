import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const deriveKey = promisify<string, string, number, Buffer>(scrypt)

const SALT_BYTES = 16
const KEY_BYTES = 64
const ALGORITHM = 'scrypt'

/** Stored as `scrypt$<salt hex>$<derived key hex>` so the salt travels with the hash. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString('hex')
  const derived = await deriveKey(password, salt, KEY_BYTES)
  return `${ALGORITHM}$${salt}$${derived.toString('hex')}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, salt, keyHex] = storedHash.split('$')
  if (algorithm !== ALGORITHM || !salt || !keyHex) return false

  const expected = Buffer.from(keyHex, 'hex')
  const derived = await deriveKey(password, salt, KEY_BYTES)
  return expected.length === derived.length && timingSafeEqual(expected, derived)
}
