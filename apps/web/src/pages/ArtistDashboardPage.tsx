import { styled } from '@linaria/react'
import { ArtistRequestCard } from '../components/ArtistRequestCard'
import { Kicker, Section, SectionHeader, SectionTitle } from '../components/primitives'
import { RowSkeleton } from '../components/Skeleton'
import { StateMessage } from '../components/StateMessage'
import { useAccount } from '../lib/use-account'
import { useTranslation } from '../lib/use-translation'
import { useGetArtistRequestsQuery, useUpdateArtistStatusMutation } from '../store/catalog-api'

const ARTIST_SKELETON_ROWS = 3

const StatusToggle = styled.button<{ $available: boolean }>`
  background: ${(props) => (props.$available ? 'var(--color-ink)' : 'transparent')};
  border: 1px solid var(--color-ink);
  color: ${(props) => (props.$available ? 'var(--color-background)' : 'inherit')};
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin-bottom: 2rem;
  padding: 0.85rem 1.25rem;
  text-transform: uppercase;
`
const CardList = styled.div`
  display: grid;
  gap: 1.5rem;
`

export function ArtistDashboardPage() {
  const { t } = useTranslation()
  const { account, isLoading: isLoadingAccount } = useAccount()
  const isArtist = account?.role === 'artist'
  const { data: requests, isLoading: isLoadingRequests } = useGetArtistRequestsQuery(undefined, { skip: !isArtist })
  const [updateStatus, updateStatusState] = useUpdateArtistStatusMutation()

  if (isLoadingAccount) return <Section><StateMessage kind="loading">{t('artist.loading')}</StateMessage></Section>
  if (!isArtist) return <Section><StateMessage kind="error">{t('artist.forbidden')}</StateMessage></Section>

  return (
    <Section>
      <SectionHeader>
        <div>
          <Kicker>{t('artist.title')}</Kicker>
          <SectionTitle>{t('artist.queueTitle')}</SectionTitle>
        </div>
      </SectionHeader>
      <StatusToggle
        type="button"
        $available={account.acceptingRequests}
        disabled={updateStatusState.isLoading}
        onClick={() => void updateStatus(!account.acceptingRequests)}
      >
        {account.acceptingRequests ? t('artist.available') : t('artist.unavailable')}
      </StatusToggle>
      {updateStatusState.isError && <StateMessage kind="error">{t('artist.updateError')}</StateMessage>}
      <CardList>
        {isLoadingRequests && Array.from({ length: ARTIST_SKELETON_ROWS }, (_, index) => <RowSkeleton key={index} height="4rem" />)}
        {requests?.length === 0 && <StateMessage kind="empty">{t('artist.noRequests')}</StateMessage>}
        {requests?.map((request) => <ArtistRequestCard key={request.id} request={request} />)}
      </CardList>
    </Section>
  )
}
