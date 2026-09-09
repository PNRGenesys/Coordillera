import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { StateMessage } from './components/StateMessage'
import { useTranslation } from './lib/use-translation'

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })))
const ShopPage = lazy(() => import('./pages/ShopPage').then((module) => ({ default: module.ShopPage })))
const ProductPage = lazy(() => import('./pages/ProductPage').then((module) => ({ default: module.ProductPage })))
const CartPage = lazy(() => import('./pages/CartPage').then((module) => ({ default: module.CartPage })))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((module) => ({ default: module.CheckoutPage })))
const AccountPage = lazy(() => import('./pages/AccountPage').then((module) => ({ default: module.AccountPage })))
const AccountEditPage = lazy(() => import('./pages/AccountEditPage').then((module) => ({ default: module.AccountEditPage })))
const AdminPage = lazy(() => import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })))
const CustomDesignRequestPage = lazy(() => import('./pages/CustomDesignRequestPage').then((module) => ({ default: module.CustomDesignRequestPage })))
const ArtistDashboardPage = lazy(() => import('./pages/ArtistDashboardPage').then((module) => ({ default: module.ArtistDashboardPage })))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then((module) => ({ default: module.NotificationsPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))

/** Each page ships as its own chunk, so visiting the storefront never downloads the admin panel's code. */
function RouteFallback() {
  const { t } = useTranslation()
  return <StateMessage kind="loading">{t('app.loading')}</StateMessage>
}

function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="shop/:collection" element={<ShopPage />} />
          <Route path="product/:slug" element={<ProductPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="account/edit" element={<AccountEditPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="custom-design/new" element={<CustomDesignRequestPage />} />
          <Route path="artist" element={<ArtistDashboardPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
