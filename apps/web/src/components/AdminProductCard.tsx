import { styled } from '@linaria/react'
import { useState, type FormEvent } from 'react'
import { centsToUnits, unitsToCents } from '../lib/format-price'
import { useTranslation } from '../lib/use-translation'
import type { TranslationKey } from '../lib/translations'
import {
  useAdjustInventoryMutation,
  useUpdateAdminProductMutation,
  useUpdateAdminVariantMutation,
  type AdminProduct,
  type AdminVariant,
  type ProductRelease,
  type ProductStatus,
} from '../store/catalog-api'
import { Field, FieldRow, Input, PrimaryButton, Select } from './primitives'
import { StateMessage } from './StateMessage'

const statusKeys: Record<ProductStatus, TranslationKey> = {
  draft: 'admin.statusDraft',
  active: 'admin.statusActive',
  archived: 'admin.statusArchived',
}
const releaseKeys: Record<ProductRelease, TranslationKey> = {
  available: 'admin.releaseAvailable',
  preorder: 'admin.releasePreorder',
  coming_soon: 'admin.releaseComingSoon',
}

/** With the whole catalog on one page the cards start collapsed, so the list stays scannable. */
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
  text-transform: uppercase;
`
const Body = styled.div`
  display: grid;
  gap: 1.25rem;
`
const Head = styled.div`
  align-items: center;
  display: grid;
  gap: 1rem;
  grid-template-columns: 84px minmax(0, 1fr);
`
const Thumb = styled.img`
  aspect-ratio: 1;
  background: var(--color-surface);
  object-fit: cover;
  width: 100%;
`
const Slug = styled.p`
  color: var(--color-accent);
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  margin: 0 0 0.5rem;
  text-transform: uppercase;
`
const Form = styled.form`
  display: grid;
  gap: 0.75rem;
`
const VariantList = styled.div`
  display: grid;
  gap: 1rem;
`
const VariantForm = styled.form`
  border-top: 1px solid var(--color-border);
  display: grid;
  gap: 0.75rem;
  padding-top: 1rem;
`
const VariantHead = styled.p`
  font-size: 0.8rem;
  font-weight: 700;
  margin: 0;
`
const StockLine = styled.p`
  color: var(--color-accent);
  font-size: 0.75rem;
  margin: 0;
`
const Legend = styled.h3`
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
`

export type AdminProductCardProps = {
  product: AdminProduct
}

export function AdminProductCard({ product }: AdminProductCardProps) {
  const { t } = useTranslation()
  const [updateProduct, updateProductState] = useUpdateAdminProductMutation()
  const [name, setName] = useState(product.name)
  const [status, setStatus] = useState<ProductStatus>(product.status)
  const [release, setRelease] = useState<ProductRelease>(product.release)

  function saveProduct(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    void updateProduct({ id: product.id, changes: { name, status, release } })
  }

  return (
    <Card>
      <Summary>{`${product.name} — ${t(statusKeys[product.status])}`}</Summary>
      <Body>
        <Head>
          {product.imageUrl && <Thumb src={product.imageUrl} alt={product.name} />}
          <div>
            <Slug>{product.slug}</Slug>
            <Form onSubmit={saveProduct}>
              <Field>
                {t('admin.productName')}
                <Input required value={name} onChange={(event) => setName(event.target.value)} />
              </Field>
              <FieldRow>
                <Field>
                  {t('admin.status')}
                  <Select value={status} onChange={(event) => setStatus(event.target.value as ProductStatus)}>
                    {Object.entries(statusKeys).map(([value, key]) => <option key={value} value={value}>{t(key)}</option>)}
                  </Select>
                </Field>
                <Field>
                  {t('admin.release')}
                  <Select value={release} onChange={(event) => setRelease(event.target.value as ProductRelease)}>
                    {Object.entries(releaseKeys).map(([value, key]) => <option key={value} value={value}>{t(key)}</option>)}
                  </Select>
                </Field>
              </FieldRow>
              <PrimaryButton type="submit" disabled={updateProductState.isLoading}>
                {updateProductState.isSuccess ? t('admin.saved') : t('admin.save')}
              </PrimaryButton>
              {updateProductState.isError && <StateMessage kind="error">{t('admin.updateError')}</StateMessage>}
            </Form>
          </div>
        </Head>
        <Legend>{t('admin.variants')}</Legend>
        <VariantList>
          {product.variants.map((variant) => <AdminVariantRow key={variant.id} variant={variant} />)}
        </VariantList>
      </Body>
    </Card>
  )
}

type AdminVariantRowProps = {
  variant: AdminVariant
}

function AdminVariantRow({ variant }: AdminVariantRowProps) {
  const { t } = useTranslation()
  const [updateVariant, updateVariantState] = useUpdateAdminVariantMutation()
  const [adjustInventory, adjustInventoryState] = useAdjustInventoryMutation()
  const [price, setPrice] = useState(String(centsToUnits(variant.priceCents)))
  const [adjustment, setAdjustment] = useState('')
  const [note, setNote] = useState('')

  function savePrice(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    void updateVariant({ id: variant.id, changes: { priceCents: unitsToCents(Number(price)) } })
  }

  function applyAdjustment(): void {
    void adjustInventory({ variantId: variant.id, quantity: Number(adjustment), note })
  }

  const label = [variant.color, variant.size].filter(Boolean).join(' / ') || variant.name

  return (
    <VariantForm onSubmit={savePrice}>
      <VariantHead>{`${label} — ${variant.sku}`}</VariantHead>
      <StockLine>
        {`${t('admin.onHand')}: ${variant.onHand} · ${t('admin.reserved')}: ${variant.reserved} · ${t('admin.available')}: ${variant.availableUnits}`}
      </StockLine>
      <FieldRow>
        <Field>
          {t('admin.price')}
          <Input type="number" min={1} required value={price} onChange={(event) => setPrice(event.target.value)} />
        </Field>
        <Field>
          {t('admin.adjustment')}
          <Input type="number" value={adjustment} onChange={(event) => setAdjustment(event.target.value)} />
        </Field>
      </FieldRow>
      <Field>
        {t('admin.adjustmentNote')}
        <Input value={note} onChange={(event) => setNote(event.target.value)} />
      </Field>
      <FieldRow>
        <PrimaryButton type="submit" disabled={updateVariantState.isLoading}>
          {updateVariantState.isSuccess ? t('admin.saved') : t('admin.save')}
        </PrimaryButton>
        <PrimaryButton type="button" disabled={adjustInventoryState.isLoading || !Number(adjustment) || !note.trim()} onClick={applyAdjustment}>
          {t('admin.applyAdjustment')}
        </PrimaryButton>
      </FieldRow>
      {(updateVariantState.isError || adjustInventoryState.isError) && <StateMessage kind="error">{t('admin.updateError')}</StateMessage>}
    </VariantForm>
  )
}
