import { css } from '@linaria/core'
import { styled } from '@linaria/react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from '../lib/use-translation'
import { useGetCartQuery } from '../store/catalog-api'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { selectSessionId } from '../store/cart-slice'
import { selectLanguage, setLanguage } from '../store/ui-slice'
import { globalTheme } from './theme'

const Page = styled.div`
  font-family: var(--font-body);
  min-height: 100vh;
`
const Notice = styled.p`
  background: var(--color-ink);
  color: var(--color-background);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin: 0;
  padding: 0.6rem 1.25rem;
  text-align: center;
`
const Header = styled.header`
  align-items: center;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  padding: 1.25rem clamp(1.25rem, 4vw, 4rem);
  position: sticky;
  top: 0;
  z-index: 2;
`
const Brand = styled(Link)`
  color: inherit;
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 5vw, 1.75rem);
  font-weight: 700;
  letter-spacing: -0.09em;
  text-decoration: none;
`
const Nav = styled.nav`
  display: flex;
  gap: clamp(0.8rem, 3vw, 2.25rem);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`
const navItem = css`
  color: inherit;
  text-decoration: none;

  &.active {
    color: var(--color-accent);
  }
`
const HeaderActions = styled.div`
  align-items: center;
  display: flex;
  gap: 1rem;
`
const CartLink = styled(Link)`
  color: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-decoration: none;
  text-transform: uppercase;
`
const Footer = styled.footer`
  background: var(--color-ink);
  color: var(--color-background);
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr auto;
  padding: 2rem clamp(1.25rem, 4vw, 4rem);

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`
const FooterTitle = styled.h2`
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 400;
  letter-spacing: -0.05em;
  margin: 0;
`
const FooterAction = styled.a`
  background: var(--color-background);
  border: 1px solid var(--color-background);
  color: var(--color-ink);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  padding: 1rem 1.35rem;
  text-decoration: none;
  text-transform: uppercase;
`
const LanguageToggle = styled.button`
  background: transparent;
  border: 1px solid var(--color-ink);
  color: inherit;
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  padding: 0.4rem 0.65rem;
`

export function Layout() {
  const dispatch = useAppDispatch()
  const sessionId = useAppSelector(selectSessionId)
  const language = useAppSelector(selectLanguage)
  const { data: cart } = useGetCartQuery(sessionId)
  const { t } = useTranslation()

  return (
    <Page className={globalTheme}>
      <Notice>{t('notice.default')}</Notice>
      <Header>
        <Brand to="/">Coordillera</Brand>
        <Nav aria-label="Primary navigation">
          <NavLink to="/shop" className={({ isActive }) => (isActive ? `${navItem} active` : navItem)}>
            {t('nav.shop')}
          </NavLink>
        </Nav>
        <HeaderActions>
          <CartLink to="/cart" aria-label="Cart">
            {t('nav.bag', { count: cart?.itemCount ?? 0 })}
          </CartLink>
          <LanguageToggle type="button" onClick={() => dispatch(setLanguage(language === 'es' ? 'en' : 'es'))}>
            {t('language.toggleLabel')}
          </LanguageToggle>
        </HeaderActions>
      </Header>
      <Outlet />
      <Footer>
        <div>
          <FooterTitle>{t('footer.title')}</FooterTitle>
        </div>
        <FooterAction href="mailto:hello@coordillera.local">{t('footer.action')}</FooterAction>
      </Footer>
    </Page>
  )
}
