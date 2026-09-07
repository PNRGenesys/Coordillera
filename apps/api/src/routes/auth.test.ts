import { eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../app.js'
import { db } from '../db/client.js'
import { customers } from '../db/schema.js'

/** Integration tests: they need the local PostgreSQL instance from docker compose. */

const NEW_EMAIL = 'auth-test-new@cordillera.test'
const GUEST_EMAIL = 'auth-test-guest@cordillera.test'
const RENAMED_EMAIL = 'auth-test-renamed@cordillera.test'
const PASSWORD = 'cordillera-test-password'

function registerPayload(email: string) {
  return { email, password: PASSWORD, firstName: 'Ana', lastName: 'Ruiz', phone: '3001234567' }
}

/** `app.inject` does not keep a cookie jar, so the session cookie is carried over by hand. */
function sessionCookie(setCookie: string): string {
  return setCookie.split(';')[0] ?? setCookie
}

let app: FastifyInstance
let cookie: string

beforeAll(async () => {
  app = await buildApp()
  await db.delete(customers).where(inArray(customers.email, [NEW_EMAIL, GUEST_EMAIL, RENAMED_EMAIL]))
  await db.insert(customers).values({ email: GUEST_EMAIL, firstName: 'Guest', lastName: 'Buyer' })
})

afterAll(async () => {
  await db.delete(customers).where(inArray(customers.email, [NEW_EMAIL, GUEST_EMAIL, RENAMED_EMAIL]))
  await app.close()
})

describe('POST /api/auth/register', () => {
  it('creates the account, returns the profile without the password and opens a session', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/auth/register', payload: registerPayload(NEW_EMAIL) })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toMatchObject({ email: NEW_EMAIL, firstName: 'Ana', lastName: 'Ruiz' })
    expect(response.json()).not.toHaveProperty('passwordHash')

    const setCookie = response.headers['set-cookie']
    expect(typeof setCookie).toBe('string')
    cookie = sessionCookie(String(setCookie))
    expect(String(setCookie)).toContain('HttpOnly')
  })

  it('stores the password hashed instead of in plain text', async () => {
    const [account] = await db.select({ passwordHash: customers.passwordHash }).from(customers).where(eq(customers.email, NEW_EMAIL))
    expect(account?.passwordHash).toMatch(/^scrypt\$[0-9a-f]+\$[0-9a-f]+$/)
  })

  it('rejects an email that already has an account', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/auth/register', payload: registerPayload(NEW_EMAIL) })
    expect(response.statusCode).toBe(409)
    expect(response.json().code).toBe('email_taken')
  })

  it('claims the customer created by a guest checkout instead of duplicating it', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/auth/register', payload: registerPayload(GUEST_EMAIL) })
    expect(response.statusCode).toBe(201)

    const rows = await db.select({ id: customers.id }).from(customers).where(eq(customers.email, GUEST_EMAIL))
    expect(rows).toHaveLength(1)
  })

  it('rejects a password shorter than the minimum', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { ...registerPayload('auth-test-short@cordillera.test'), password: 'short' } })
    expect(response.statusCode).toBe(400)
    expect(response.json().code).toBe('invalid_request')
  })
})

describe('POST /api/auth/login', () => {
  it('accepts the right credentials', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: NEW_EMAIL, password: PASSWORD } })
    expect(response.statusCode).toBe(200)
    expect(response.json().email).toBe(NEW_EMAIL)
  })

  it('rejects a wrong password and an unknown email with the same error', async () => {
    const wrongPassword = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: NEW_EMAIL, password: 'not-the-password' } })
    const unknownEmail = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'auth-test-missing@cordillera.test', password: PASSWORD } })

    expect(wrongPassword.statusCode).toBe(401)
    expect(unknownEmail.statusCode).toBe(401)
    expect(wrongPassword.json().code).toBe('invalid_credentials')
    expect(unknownEmail.json().code).toBe('invalid_credentials')
  })
})

describe('PATCH /api/auth/me', () => {
  const address = { line1: 'Cra 1 #2-3', city: 'Bogota', region: 'Cundinamarca', postalCode: '110111', country: 'CO' }
  const picture = 'data:image/png;base64,iVBORw0KGgo='

  it('saves the address, the picture and the rest of the profile', async () => {
    const response = await app.inject({
      method: 'PATCH', url: '/api/auth/me', headers: { cookie },
      payload: { firstName: 'Ana Maria', phone: '3009998877', avatar: picture, shippingAddress: address },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ firstName: 'Ana Maria', phone: '3009998877', avatar: picture, shippingAddress: address })
  })

  it('changes the email and keeps the session working', async () => {
    const changed = await app.inject({ method: 'PATCH', url: '/api/auth/me', headers: { cookie }, payload: { email: RENAMED_EMAIL } })
    expect(changed.json().email).toBe(RENAMED_EMAIL)

    const profile = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie } })
    expect(profile.json().account.email).toBe(RENAMED_EMAIL)

    await app.inject({ method: 'PATCH', url: '/api/auth/me', headers: { cookie }, payload: { email: NEW_EMAIL } })
  })

  it('refuses an email that belongs to another account', async () => {
    const response = await app.inject({ method: 'PATCH', url: '/api/auth/me', headers: { cookie }, payload: { email: GUEST_EMAIL } })
    expect(response.statusCode).toBe(409)
    expect(response.json().code).toBe('email_taken')
  })

  it('clears the picture and the address with null', async () => {
    const response = await app.inject({ method: 'PATCH', url: '/api/auth/me', headers: { cookie }, payload: { avatar: null, shippingAddress: null } })
    expect(response.json()).toMatchObject({ avatar: null, shippingAddress: null })
  })

  it('rejects a picture that is not an image data URL', async () => {
    const response = await app.inject({ method: 'PATCH', url: '/api/auth/me', headers: { cookie }, payload: { avatar: 'https://example.test/photo.png' } })
    expect(response.statusCode).toBe(400)
  })

  it('rejects a request without a session', async () => {
    const response = await app.inject({ method: 'PATCH', url: '/api/auth/me', payload: { firstName: 'Nadie' } })
    expect(response.statusCode).toBe(401)
    expect(response.json().code).toBe('unauthenticated')
  })
})

describe('GET /api/auth/me', () => {
  it('returns the profile of the session cookie', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie } })
    expect(response.statusCode).toBe(200)
    expect(response.json().account.email).toBe(NEW_EMAIL)
  })

  it('returns an empty account for a guest instead of an error', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/auth/me' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({})
  })

  it('forgets the session after logging out', async () => {
    const loggedOut = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { cookie } })
    expect(loggedOut.statusCode).toBe(204)

    const response = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie } })
    expect(response.json()).toEqual({})
  })
})
