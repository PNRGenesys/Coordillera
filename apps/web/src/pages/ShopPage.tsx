import { styled } from '@linaria/react'
import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { ProductGrid, Section, SectionHeader, SectionTitle } from '../components/primitives'
import { StateMessage } from '../components/StateMessage'
import { useTranslation } from '../lib/use-translation'
import { type CatalogAvailability, type CatalogFacet, type CatalogFilters, useGetCategoriesQuery, useGetCollectionsQuery, useGetProductsQuery } from '../store/catalog-api'

const Filters = styled.form`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
`
const Field = styled.label`
  display: flex;
  flex-direction: column;
  font-size: 0.72rem;
  font-weight: 700;
  gap: 0.35rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`
const Select = styled.select`
  border: 1px solid var(--color-border);
  font-size: 0.85rem;
  padding: 0.5rem 0.6rem;
`
const Pagination = styled.div`
  align-items: center;
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2.5rem;
`
const PageButton = styled.button`
  background: transparent;
  border: 1px solid var(--color-ink);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 0.5rem 1rem;
  text-transform: uppercase;

  &:disabled {
    border-color: var(--color-border);
    color: var(--color-border);
    cursor: not-allowed;
  }
`

function readAvailability(value: string | null): CatalogAvailability {
  return value === 'in_stock' ? 'in_stock' : 'all'
}

/** The dropdowns list every attribute of the visible page once, sorted by the text the customer reads. */
function uniqueFacets(facets: CatalogFacet[] | undefined): CatalogFacet[] {
  const byValue = new Map((facets ?? []).map((facet) => [facet.value, facet]))
  return [...byValue.values()].sort((left, right) => left.label.localeCompare(right.label))
}

export function ShopPage() {
  const { t, language } = useTranslation()
  const { collection } = useParams<{ collection?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: categories } = useGetCategoriesQuery(language)
  const { data: collections } = useGetCollectionsQuery(language, { skip: !collection })

  const filters: CatalogFilters = {
    lang: language,
    collection,
    category: searchParams.get('category') ?? undefined,
    color: searchParams.get('color') ?? undefined,
    size: searchParams.get('size') ?? undefined,
    availability: readAvailability(searchParams.get('availability')),
    page: Number(searchParams.get('page') ?? '1'),
  }

  const { data, isLoading, isError } = useGetProductsQuery(filters)

  const colorOptions = useMemo(() => uniqueFacets(data?.items.flatMap((item) => item.colors)), [data])
  const sizeOptions = useMemo(() => uniqueFacets(data?.items.flatMap((item) => item.sizes)), [data])

  function updateFilter(key: string, value: string): void {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  function goToPage(page: number): void {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(page))
    setSearchParams(next)
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1
  const collectionName = collection ? (collections?.find((entry) => entry.slug === collection)?.name ?? collection) : undefined

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>{collectionName ?? t('shop.title')}</SectionTitle>
      </SectionHeader>
      <Filters onSubmit={(event) => event.preventDefault()}>
        <Field>
          {t('shop.category')}
          <Select value={searchParams.get('category') ?? ''} onChange={(event) => updateFilter('category', event.target.value)}>
            <option value="">{t('shop.all')}</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          {t('shop.color')}
          <Select value={searchParams.get('color') ?? ''} onChange={(event) => updateFilter('color', event.target.value)}>
            <option value="">{t('shop.all')}</option>
            {colorOptions.map((color) => (
              <option key={color.value} value={color.value}>
                {color.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          {t('shop.size')}
          <Select value={searchParams.get('size') ?? ''} onChange={(event) => updateFilter('size', event.target.value)}>
            <option value="">{t('shop.all')}</option>
            {sizeOptions.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          {t('shop.availability')}
          <Select value={searchParams.get('availability') ?? 'all'} onChange={(event) => updateFilter('availability', event.target.value)}>
            <option value="all">{t('shop.all')}</option>
            <option value="in_stock">{t('shop.inStock')}</option>
          </Select>
        </Field>
      </Filters>
      <ProductGrid>
        {isLoading && <StateMessage kind="loading">{t('catalog.loading')}</StateMessage>}
        {isError && <StateMessage kind="error">{t('catalog.error')}</StateMessage>}
        {!isLoading && !isError && data?.items.length === 0 && <StateMessage kind="empty">{t('shop.empty')}</StateMessage>}
        {data?.items.map((product) => <ProductCard key={product.id} product={product} />)}
      </ProductGrid>
      {data && data.total > 0 && (
        <Pagination>
          <PageButton type="button" disabled={filters.page === 1} onClick={() => goToPage((filters.page ?? 1) - 1)}>
            {t('shop.previous')}
          </PageButton>
          <span>{t('shop.pageOf', { page: filters.page ?? 1, totalPages })}</span>
          <PageButton type="button" disabled={(filters.page ?? 1) >= totalPages} onClick={() => goToPage((filters.page ?? 1) + 1)}>
            {t('shop.next')}
          </PageButton>
        </Pagination>
      )}
    </Section>
  )
}
