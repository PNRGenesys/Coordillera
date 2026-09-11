import { styled } from '@linaria/react'
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { VariantSelector } from '../components/VariantSelector'
import {
  Field,
  FieldRow,
  Input,
  PrimaryButton,
  Section,
  SectionHeader,
  SectionTitle,
  Select,
  Textarea,
} from '../components/primitives'
import { StateMessage } from '../components/StateMessage'
import { formatPrice } from '../lib/format-price'
import { isCustomDesignWindowOpen } from '../lib/business-hours'
import { toResizedDataUrl } from '../lib/image-resize'
import { COLOMBIA_REGIONS } from '../lib/store-country'
import { useAccount } from '../lib/use-account'
import { useTranslation } from '../lib/use-translation'
import {
  useGetCategoriesQuery,
  useGetCustomDesignArtistsQuery,
  useGetProductQuery,
  useGetProductsQuery,
  useSubmitCustomDesignRequestMutation,
  type ShippingAddress,
} from '../store/catalog-api'

/** The reference photo is a full frame (never cropped), scaled down before it becomes a data URL. */
const REFERENCE_IMAGE_MAX_SIDE = 1024

const emptyAddress: ShippingAddress = { line1: '', line2: '', city: '', region: '', postalCode: '' }

const Form = styled.form`
  display: grid;
  gap: 1.5rem;
  max-width: 640px;
`
const Preview = styled.img`
  border: 1px solid var(--color-border);
  margin-top: 0.5rem;
  max-height: 220px;
  object-fit: contain;
`
const ArtistList = styled.div`
  display: grid;
  gap: 0.5rem;
`
const ArtistOption = styled.label<{ $selected: boolean }>`
  align-items: center;
  border: 1px solid ${(props) => (props.$selected ? 'var(--color-ink)' : 'var(--color-border)')};
  cursor: pointer;
  display: flex;
  font-size: 0.85rem;
  gap: 0.75rem;
  justify-content: space-between;
  padding: 0.75rem 1rem;
`
const PriceSummary = styled.p`
  font-size: 0.95rem;
  margin: 0;
`
const Confirmation = styled.div`
  display: grid;
  gap: 0.5rem;
  max-width: 640px;
`

/**
 * The whole category is listed in one dropdown. It mirrors `config.catalogMaxPageSize` in the API,
 * which is the side that enforces it: asking for more makes the request fail and the list come back empty.
 */
const CATEGORY_PAGE_SIZE = 60

export function CustomDesignRequestPage() {
  const { t, language, numberLocale } = useTranslation()
  const { account } = useAccount()
  const [searchParams] = useSearchParams()
  const initialProductSlug = searchParams.get('product') ?? undefined
  const initialVariantId = searchParams.get('variant') ?? undefined
  const windowOpen = isCustomDesignWindowOpen()

  const [categorySlug, setCategorySlug] = useState<string | undefined>(undefined)
  const [productSlug, setProductSlug] = useState<string | undefined>(initialProductSlug)
  const [variantId, setVariantId] = useState<string | undefined>(initialVariantId)
  const [description, setDescription] = useState('')
  const [referenceImage, setReferenceImage] = useState<string | undefined>(undefined)
  const [photoFailed, setPhotoFailed] = useState(false)
  const [artistId, setArtistId] = useState('fastest')
  const [address, setAddress] = useState<ShippingAddress>(account?.shippingAddress ?? emptyAddress)

  const { data: categories } = useGetCategoriesQuery(language)
  const { data: preselectedProduct } = useGetProductQuery({ slug: initialProductSlug ?? '', lang: language }, { skip: !initialProductSlug })
  const { data: categoryProducts } = useGetProductsQuery({ lang: language, category: categorySlug, pageSize: CATEGORY_PAGE_SIZE }, { skip: !categorySlug })
  const { data: product } = useGetProductQuery({ slug: productSlug ?? '', lang: language }, { skip: !productSlug })
  const { data: artistsResponse } = useGetCustomDesignArtistsQuery()
  const [submitRequest, submitState] = useSubmitCustomDesignRequestMutation()

  // The product the customer arrived from sets the starting category, without locking them out of picking another.
  useEffect(() => {
    if (preselectedProduct?.categorySlug && !categorySlug) setCategorySlug(preselectedProduct.categorySlug)
  }, [preselectedProduct, categorySlug])

  function updateAddressField(field: keyof ShippingAddress) {
    return (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { value } = event.target
      setAddress((current) => ({ ...current, [field]: value }))
    }
  }

  function pickCategory(event: ChangeEvent<HTMLSelectElement>): void {
    setCategorySlug(event.target.value || undefined)
    setProductSlug(undefined)
    setVariantId(undefined)
  }

  function pickProduct(event: ChangeEvent<HTMLSelectElement>): void {
    setProductSlug(event.target.value || undefined)
    setVariantId(undefined)
  }

  function pickPhoto(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotoFailed(false)
    void toResizedDataUrl(file, { maxSide: REFERENCE_IMAGE_MAX_SIDE }).then(setReferenceImage).catch(() => setPhotoFailed(true))
  }

  const selectedVariant = product?.variants.find((variant) => variant.id === variantId)
  const surchargePercent = artistsResponse?.surchargePercent ?? 0
  const totalCents = selectedVariant ? Math.round((selectedVariant.priceCents * (100 + surchargePercent)) / 100) : 0
  const canSubmit = Boolean(selectedVariant && referenceImage && artistId) && windowOpen

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (!selectedVariant || !referenceImage) return
    void submitRequest({
      baseVariantId: selectedVariant.id,
      characterDescription: description || undefined,
      referenceImage,
      artistId,
      shippingAddress: address,
    })
  }

  if (submitState.isSuccess) {
    const created = submitState.data
    return (
      <Section>
        <SectionHeader>
          <SectionTitle>{t('customDesign.confirmedTitle')}</SectionTitle>
        </SectionHeader>
        <Confirmation>
          <StateMessage kind="empty">{t('customDesign.confirmed', { number: created.orderNumber })}</StateMessage>
        </Confirmation>
      </Section>
    )
  }

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>{t('customDesign.title')}</SectionTitle>
      </SectionHeader>
      {!windowOpen && <StateMessage kind="empty">{t('customDesign.outsideHours')}</StateMessage>}
      <Form onSubmit={submit}>
        <FieldRow>
          <Field>
            {t('customDesign.category')}
            <Select value={categorySlug ?? ''} onChange={pickCategory}>
              <option value="">{t('customDesign.chooseCategory')}</option>
              {categories?.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
            </Select>
          </Field>
          <Field>
            {t('customDesign.product')}
            <Select value={productSlug ?? ''} onChange={pickProduct} disabled={!categorySlug}>
              <option value="">{t('customDesign.chooseProduct')}</option>
              {categoryProducts?.items.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
            </Select>
          </Field>
        </FieldRow>
        {product && <VariantSelector variants={product.variants} selectedVariantId={variantId} onSelect={setVariantId} />}

        <Field>
          {t('customDesign.description')}
          <Textarea placeholder={t('customDesign.descriptionPlaceholder')} value={description} onChange={(event) => setDescription(event.target.value)} />
        </Field>
        <Field>
          {t('customDesign.referencePhoto')}
          <input type="file" accept="image/png,image/jpeg,image/webp" required onChange={pickPhoto} />
        </Field>
        {photoFailed && <StateMessage kind="error">{t('account.photoError')}</StateMessage>}
        {referenceImage && <Preview src={referenceImage} alt="" />}

        <Field>
          {t('customDesign.artist')}
          <ArtistList role="radiogroup">
            <ArtistOption $selected={artistId === 'fastest'}>
              <span>{t('customDesign.fastestArtist')}</span>
              <input type="radio" name="artist" value="fastest" checked={artistId === 'fastest'} onChange={() => setArtistId('fastest')} />
            </ArtistOption>
            {artistsResponse?.artists.map((artist) => (
              <ArtistOption key={artist.id} $selected={artistId === artist.id}>
                <span>{`${artist.name} — ${t('customDesign.artistQueueCount', { count: artist.pendingCount })}`}</span>
                <input type="radio" name="artist" value={artist.id} checked={artistId === artist.id} onChange={() => setArtistId(artist.id)} />
              </ArtistOption>
            ))}
          </ArtistList>
          {artistsResponse && artistsResponse.artists.length === 0 && <StateMessage kind="empty">{t('customDesign.noArtistsAvailable')}</StateMessage>}
        </Field>

        {selectedVariant && (
          <PriceSummary>
            {t('customDesign.priceSummary', {
              basePrice: formatPrice(selectedVariant.priceCents, undefined, numberLocale),
              percent: surchargePercent,
              total: formatPrice(totalCents, undefined, numberLocale),
            })}
          </PriceSummary>
        )}

        <Field>{t('checkout.line1')}<Input required autoComplete="address-line1" value={address.line1} onChange={updateAddressField('line1')} /></Field>
        <Field>{t('checkout.line2')}<Input autoComplete="address-line2" value={address.line2 ?? ''} onChange={updateAddressField('line2')} /></Field>
        <FieldRow>
          <Field>{t('checkout.city')}<Input required autoComplete="address-level2" value={address.city} onChange={updateAddressField('city')} /></Field>
          <Field>
            {t('checkout.region')}
            <Select required autoComplete="address-level1" value={address.region} onChange={updateAddressField('region')}>
              <option value="">{t('checkout.regionPlaceholder')}</option>
              {COLOMBIA_REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}
            </Select>
          </Field>
        </FieldRow>
        <Field>{t('checkout.postalCode')}<Input required autoComplete="postal-code" value={address.postalCode} onChange={updateAddressField('postalCode')} /></Field>

        <PrimaryButton type="submit" disabled={!canSubmit || submitState.isLoading}>
          {t('customDesign.submit')}
        </PrimaryButton>
        {submitState.isError && <StateMessage kind="error">{t('customDesign.error')}</StateMessage>}
      </Form>
    </Section>
  )
}
