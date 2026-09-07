import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './password.js'

describe('password hashing', () => {
  it('accepts the original password', async () => {
    const hash = await hashPassword('cordillera-test-password')
    expect(await verifyPassword('cordillera-test-password', hash)).toBe(true)
  })

  it('rejects a different password', async () => {
    const hash = await hashPassword('cordillera-test-password')
    expect(await verifyPassword('another-password', hash)).toBe(false)
  })

  it('uses a new salt on every hash, so two identical passwords look different', async () => {
    const [first, second] = await Promise.all([hashPassword('same-password'), hashPassword('same-password')])
    expect(first).not.toBe(second)
  })

  it('rejects a stored value that is not a scrypt hash', async () => {
    expect(await verifyPassword('cordillera-test-password', 'plain-text')).toBe(false)
  })
})
