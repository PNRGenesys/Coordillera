import { styled } from '@linaria/react'
import { AdminOrderCard } from '../components/AdminOrderCard'
import { AdminProductCard } from '../components/AdminProductCard'
import { Kicker, Section, SectionHeader, SectionTitle } from '../components/primitives'
import { StateMessage } from '../components/StateMessage'
import { useAccount } from '../lib/use-account'
import { useTranslation } from '../lib/use-translation'
import { useGetAdminOrdersQuery, useGetAdminProductsQuery } from '../store/catalog-api'

const CardList = styled.div`
  display: grid;
  gap: 1.5rem;
`

export function AdminPage() {
  const { t } = useTranslation()
  const { account, isLoading: isLoadingAccount } = useAccount()
  const isAdmin = account?.role === 'admin'
  const { data: products, isLoading: isLoadingProducts } = useGetAdminProductsQuery(undefined, { skip: !isAdmin })
  const { data: orders, isLoading: isLoadingOrders } = useGetAdminOrdersQuery(undefined, { skip: !isAdmin })

  if (isLoadingAccount) return <Section><StateMessage kind="loading">{t('admin.loading')}</StateMessage></Section>
  if (!isAdmin) return <Section><StateMessage kind="error">{t('admin.forbidden')}</StateMessage></Section>

  return (
    <>
      <Section>
        <SectionHeader>
          <div>
            <Kicker>{t('admin.title')}</Kicker>
            <SectionTitle>{t('admin.productsTitle')}</SectionTitle>
          </div>
        </SectionHeader>
        <CardList>
          {isLoadingProducts && <StateMessage kind="loading">{t('admin.loading')}</StateMessage>}
          {products?.length === 0 && <StateMessage kind="empty">{t('admin.noProducts')}</StateMessage>}
          {products?.map((product) => <AdminProductCard key={product.id} product={product} />)}
        </CardList>
      </Section>
      <Section>
        <SectionHeader>
          <SectionTitle>{t('admin.ordersTitle')}</SectionTitle>
        </SectionHeader>
        <CardList>
          {isLoadingOrders && <StateMessage kind="loading">{t('admin.loading')}</StateMessage>}
          {orders?.length === 0 && <StateMessage kind="empty">{t('admin.noOrders')}</StateMessage>}
          {orders?.map((order) => <AdminOrderCard key={order.id} order={order} />)}
        </CardList>
      </Section>
    </>
  )
}
