import { styled } from '@linaria/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PrimaryButton, Section, SectionHeader, SectionTitle, TextButton, Textarea } from '../components/primitives'
import { RowSkeleton } from '../components/Skeleton'
import { StateMessage } from '../components/StateMessage'
import { useTranslation } from '../lib/use-translation'
import type { TranslationKey } from '../lib/translations'
import {
  useApproveCustomDesignRequestMutation,
  useGetCustomDesignRequestQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useRequestDesignChangesMutation,
  type Notification,
} from '../store/catalog-api'

const NOTIFICATIONS_SKELETON_ROWS = 3

const messageKeys: Record<Notification['kind'], TranslationKey> = {
  design_delivered: 'notifications.designDelivered',
  changes_requested: 'notifications.changesRequested',
  design_approved: 'notifications.designApproved',
}

const Card = styled.div<{ $unread: boolean }>`
  border: 1px solid var(--color-border);
  border-left: 3px solid ${(props) => (props.$unread ? 'var(--color-accent)' : 'var(--color-border)')};
  display: grid;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
`
const Message = styled.p`
  font-size: 0.9rem;
  margin: 0;
`
const CardList = styled.div`
  display: grid;
  gap: 1rem;
`
const Photo = styled.img`
  border: 1px solid var(--color-border);
  max-height: 220px;
  object-fit: contain;
`
const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`

function DesignDeliveredActions({ requestId }: { requestId: string }) {
  const { t } = useTranslation()
  const { data: request } = useGetCustomDesignRequestQuery(requestId)
  const [approve, approveState] = useApproveCustomDesignRequestMutation()
  const [requestChanges, requestChangesState] = useRequestDesignChangesMutation()
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [comment, setComment] = useState('')

  if (!request || request.status !== 'delivered') return null

  function sendComment(): void {
    if (!comment.trim()) return
    void requestChanges({ id: requestId, comment })
  }

  if (requestChangesState.isSuccess) return <StateMessage kind="empty">{t('notifications.changesSent')}</StateMessage>
  if (approveState.isSuccess) return <StateMessage kind="empty">{t('notifications.approved')}</StateMessage>

  return (
    <>
      {request.finalDesignImageUrl && <Photo src={request.finalDesignImageUrl} alt="" />}
      <Actions>
        <PrimaryButton type="button" disabled={approveState.isLoading} onClick={() => void approve(requestId)}>
          {t('notifications.approve')}
        </PrimaryButton>
        <TextButton type="button" onClick={() => setShowCommentForm((current) => !current)}>
          {t('notifications.requestChanges')}
        </TextButton>
      </Actions>
      {showCommentForm && (
        <Actions>
          <Textarea placeholder={t('notifications.commentPlaceholder')} value={comment} onChange={(event) => setComment(event.target.value)} />
          <PrimaryButton type="button" disabled={requestChangesState.isLoading || !comment.trim()} onClick={sendComment}>
            {t('notifications.sendComment')}
          </PrimaryButton>
        </Actions>
      )}
      {(approveState.isError || requestChangesState.isError) && <StateMessage kind="error">{t('notifications.error')}</StateMessage>}
    </>
  )
}

function NotificationCard({ notification }: { notification: Notification }) {
  const { t } = useTranslation()
  const [markRead] = useMarkNotificationReadMutation()

  useEffect(() => {
    if (!notification.readAt) void markRead(notification.id)
  }, [notification.id, notification.readAt, markRead])

  return (
    <Card $unread={!notification.readAt}>
      <Message>{t(messageKeys[notification.kind], notification.payload)}</Message>
      {notification.kind === 'design_delivered' && <DesignDeliveredActions requestId={notification.relatedRequestId} />}
      {(notification.kind === 'changes_requested' || notification.kind === 'design_approved') && (
        <Link to="/artist">{t('notifications.viewInArtistPanel')}</Link>
      )}
    </Card>
  )
}

export function NotificationsPage() {
  const { t } = useTranslation()
  const { data: notifications, isLoading, isError } = useGetNotificationsQuery()

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>{t('notifications.title')}</SectionTitle>
      </SectionHeader>
      <CardList>
        {isLoading && Array.from({ length: NOTIFICATIONS_SKELETON_ROWS }, (_, index) => <RowSkeleton key={index} height="4rem" />)}
        {isError && <StateMessage kind="error">{t('notifications.error')}</StateMessage>}
        {notifications?.length === 0 && <StateMessage kind="empty">{t('notifications.empty')}</StateMessage>}
        {notifications?.map((notification) => <NotificationCard key={notification.id} notification={notification} />)}
      </CardList>
    </Section>
  )
}
