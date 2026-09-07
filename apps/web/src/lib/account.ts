import type { SerializedError } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { AccountProfile } from '../store/catalog-api'
import type { TranslationKey } from './translations'

/** Mirrors `config.passwordMinLength` in the API, which is the side that actually rejects short passwords. */
export const PASSWORD_MIN_LENGTH = 8

const HTTP_UNAUTHORIZED = 401
const HTTP_CONFLICT = 409

/** The API answers with the same shape for every error, so only the status is needed to pick the message. */
export function accountErrorKey(error: FetchBaseQueryError | SerializedError | undefined): TranslationKey {
  if (error && 'status' in error) {
    if (error.status === HTTP_UNAUTHORIZED) return 'account.invalidCredentials'
    if (error.status === HTTP_CONFLICT) return 'account.emailTaken'
  }
  return 'account.genericError'
}

export function accountDisplayName(account: AccountProfile): string {
  return account.firstName ?? account.email
}
