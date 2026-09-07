import { describe, expect, it } from 'vitest'
import type { AccountProfile } from '../store/catalog-api'
import { accountDisplayName, accountErrorKey } from './account'

function profile(overrides: Partial<AccountProfile> = {}): AccountProfile {
  return { id: 'id', email: 'ana@coordillera.test', firstName: 'Ana', lastName: 'Ruiz', phone: null, ...overrides }
}

describe('accountErrorKey', () => {
  it('reports wrong credentials on 401', () => {
    expect(accountErrorKey({ status: 401, data: undefined })).toBe('account.invalidCredentials')
  })

  it('reports a taken email on 409', () => {
    expect(accountErrorKey({ status: 409, data: undefined })).toBe('account.emailTaken')
  })

  it('falls back to the generic message for any other failure', () => {
    expect(accountErrorKey({ status: 'FETCH_ERROR', error: 'offline' })).toBe('account.genericError')
    expect(accountErrorKey(undefined)).toBe('account.genericError')
  })
})

describe('accountDisplayName', () => {
  it('prefers the first name', () => {
    expect(accountDisplayName(profile())).toBe('Ana')
  })

  it('uses the email when the account has no first name', () => {
    expect(accountDisplayName(profile({ firstName: null }))).toBe('ana@coordillera.test')
  })
})
