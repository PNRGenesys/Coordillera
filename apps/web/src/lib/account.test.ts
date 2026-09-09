import { describe, expect, it } from 'vitest'
import type { AccountProfile, ShippingAddress } from '../store/catalog-api'
import { accountDisplayName, accountErrorKey, accountFullName, formatAddress } from './account'

function profile(overrides: Partial<AccountProfile> = {}): AccountProfile {
  return { id: 'id', email: 'ana@cordillera.test', firstName: 'Ana', lastName: 'Ruiz', phone: null, role: 'customer', avatar: null, shippingAddress: null, acceptingRequests: true, ...overrides }
}

function address(overrides: Partial<ShippingAddress> = {}): ShippingAddress {
  return { line1: 'Cra 7 # 45-10', line2: '', city: 'Bogota', region: 'Cundinamarca', postalCode: '110111', country: 'CO', ...overrides }
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
    expect(accountDisplayName(profile({ firstName: null }))).toBe('ana@cordillera.test')
  })
})

describe('accountFullName', () => {
  it('joins first and last name', () => {
    expect(accountFullName(profile())).toBe('Ana Ruiz')
  })

  it('keeps the half it has', () => {
    expect(accountFullName(profile({ lastName: null }))).toBe('Ana')
  })

  it('falls back to the email when there is no name', () => {
    expect(accountFullName(profile({ firstName: null, lastName: null }))).toBe('ana@cordillera.test')
  })
})

describe('formatAddress', () => {
  it('reads as one line, without repeating the country on every address', () => {
    expect(formatAddress(address())).toBe('Cra 7 # 45-10, Bogota, Cundinamarca, 110111')
  })

  it('leaves out the parts the customer did not fill', () => {
    expect(formatAddress(address({ line2: '  ', postalCode: '' }))).toBe('Cra 7 # 45-10, Bogota, Cundinamarca')
  })

  it('includes the second line when there is one', () => {
    expect(formatAddress(address({ line2: 'Apto 401' }))).toContain('Apto 401')
  })
})
