import { styled } from '@linaria/react'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { toResizedDataUrl } from '../lib/image-resize'
import { STORE_TIME_ZONE } from '../lib/store-country'
import { useTranslation } from '../lib/use-translation'
import type { TranslationKey } from '../lib/translations'
import { useDeliverDesignMutation, useUpdateArtistEstimateMutation, type ArtistQueueRequest, type CustomDesignRequestStatus } from '../store/catalog-api'
import { Field, FieldRow, Input, PrimaryButton } from './primitives'
import { StateMessage } from './StateMessage'

/** Only these two statuses reach the artist as something they still owe work on; `delivered` just waits. */
const DELIVERABLE_STATUSES: CustomDesignRequestStatus[] = ['pending', 'changes_requested']

const statusKeys: Partial<Record<CustomDesignRequestStatus, TranslationKey>> = {
  pending: 'artist.statusPending',
  delivered: 'artist.statusDelivered',
  changes_requested: 'artist.statusChangesRequested',
}

/** Design review reference images pushed through this card are resized before they leave the browser. */
const DESIGN_IMAGE_MAX_SIDE = 1600

const Card = styled.details`
  border: 1px solid var(--color-border);
  padding: 1.5rem;

  &[open] > summary {
    margin-bottom: 1.25rem;
  }
`
const Summary = styled.summary`
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.04em;
`
const Body = styled.div`
  display: grid;
  gap: 1rem;
`
const Muted = styled.p`
  color: var(--color-accent);
  font-size: 0.75rem;
  margin: 0;
`
const Description = styled.p`
  font-size: 0.85rem;
  margin: 0;
`
const Photo = styled.img`
  border: 1px solid var(--color-border);
  max-height: 220px;
  object-fit: contain;
`
const RevisionNote = styled.p`
  background: var(--color-surface);
  font-size: 0.82rem;
  margin: 0;
  padding: 0.75rem 1rem;
`
const EstimateForm = styled.form`
  align-items: end;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr auto;
`
const DeliverForm = styled.form`
  border-top: 1px solid var(--color-border);
  display: grid;
  gap: 0.75rem;
  padding-top: 1rem;
`

export type ArtistRequestCardProps = {
  request: ArtistQueueRequest
}

export function ArtistRequestCard({ request }: ArtistRequestCardProps) {
  const { t, numberLocale } = useTranslation()
  const [updateEstimate, updateEstimateState] = useUpdateArtistEstimateMutation()
  const [deliver, deliverState] = useDeliverDesignMutation()
  const [estimatedDays, setEstimatedDays] = useState(String(request.estimatedDays ?? ''))
  const [finalDesignImage, setFinalDesignImage] = useState<string | undefined>(undefined)
  const [photoFailed, setPhotoFailed] = useState(false)

  const customerName = [request.customerFirstName, request.customerLastName].filter(Boolean).join(' ') || request.customerEmail
  const canDeliver = DELIVERABLE_STATUSES.includes(request.status)

  function saveEstimate(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const days = Number(estimatedDays)
    if (!days) return
    void updateEstimate({ id: request.id, estimatedDays: days })
  }

  function pickFinalDesign(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotoFailed(false)
    void toResizedDataUrl(file, { maxSide: DESIGN_IMAGE_MAX_SIDE }).then(setFinalDesignImage).catch(() => setPhotoFailed(true))
  }

  function sendDesign(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (!finalDesignImage) return
    void deliver({ id: request.id, finalDesignImage })
  }

  const statusKey = statusKeys[request.status]

  return (
    <Card>
      <Summary>{`${customerName} — ${statusKey ? t(statusKey) : request.status}`}</Summary>
      <Body>
        <Muted>{t('artist.requestedOn', { date: new Date(request.createdAt).toLocaleString(numberLocale, { timeZone: STORE_TIME_ZONE }) })}</Muted>
        <Muted>{t('artist.customer', { name: customerName })}</Muted>
        <Muted>{t('artist.garment', { name: request.garmentName })}</Muted>
        {request.characterDescription && (
          <div>
            <Muted>{t('artist.description')}</Muted>
            <Description>{request.characterDescription}</Description>
          </div>
        )}
        <Photo src={request.referenceImageUrl} alt="" />
        {request.revisionNote && <RevisionNote>{t('artist.revisionNote', { comment: request.revisionNote })}</RevisionNote>}

        <EstimateForm onSubmit={saveEstimate}>
          <Field>
            {t('artist.estimateLabel')}
            <Input type="number" min={1} max={60} value={estimatedDays} onChange={(event) => setEstimatedDays(event.target.value)} />
          </Field>
          <PrimaryButton type="submit" disabled={updateEstimateState.isLoading}>
            {t('artist.saveEstimate')}
          </PrimaryButton>
        </EstimateForm>

        {canDeliver ? (
          <DeliverForm onSubmit={sendDesign}>
            <FieldRow>
              <Field>
                {t('artist.uploadDesign')}
                <input type="file" accept="image/png,image/jpeg,image/webp" required onChange={pickFinalDesign} />
              </Field>
            </FieldRow>
            {photoFailed && <StateMessage kind="error">{t('account.photoError')}</StateMessage>}
            {finalDesignImage && <Photo src={finalDesignImage} alt="" />}
            <PrimaryButton type="submit" disabled={!finalDesignImage || deliverState.isLoading}>
              {t('artist.deliver')}
            </PrimaryButton>
            {deliverState.isError && <StateMessage kind="error">{t('artist.updateError')}</StateMessage>}
          </DeliverForm>
        ) : (
          <Muted>{t('artist.awaitingApproval')}</Muted>
        )}
      </Body>
    </Card>
  )
}
