import { useGetAccountQuery, type AccountProfile } from '../store/catalog-api'

export type AccountState = {
  account: AccountProfile | undefined
  isLoading: boolean
}

/** Single entry point for the signed in customer; `GET /api/auth/me` answers with an empty account for a guest. */
export function useAccount(): AccountState {
  const { data, isLoading } = useGetAccountQuery()
  return { account: data?.account, isLoading }
}
