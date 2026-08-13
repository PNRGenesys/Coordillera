import { css } from '@linaria/core'
import { styled } from '@linaria/react'
import { useMemo, useState } from 'react'
import heroCollection from './assets/hero-collection.png'
import { formatPrice } from './lib/format-price'
import { useAddCartItemMutation, useGetProductsQuery } from './store/catalog-api'

const page = css`
  min-height: 100vh;
  background: #f3f0e8;
  color: #17231e;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
`
const Header = styled.header`
  align-items: center; display: flex; justify-content: space-between; padding: 1.25rem clamp(1.25rem, 4vw, 4rem); border-bottom: 1px solid #c8c8bd; background: #f3f0e8; position: sticky; top: 0; z-index: 2;
`
const Brand = styled.a`
  color: inherit; font-family: Georgia, serif; font-size: 1.75rem; font-weight: 700; letter-spacing: -0.09em; text-decoration: none;
`
const Nav = styled.nav`
  display: flex; gap: clamp(0.8rem, 3vw, 2.25rem); font-size: 0.78rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  @media (max-width: 640px) { display: none; }
`
const Link = styled.a`color: inherit; text-decoration: none;`
const Hero = styled.section`
  background: #d9d0c0; display: grid; grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr); min-height: 620px;
  @media (max-width: 760px) { grid-template-columns: 1fr; }
`
const HeroCopy = styled.div`
  align-items: flex-start; display: flex; flex-direction: column; justify-content: center; padding: clamp(3rem, 8vw, 8rem) clamp(1.25rem, 6vw, 7rem);
`
const Kicker = styled.p`
  color: #49634e; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.16em; margin: 0 0 1.25rem; text-transform: uppercase;
`
const Title = styled.h1`
  font-family: Georgia, serif; font-size: clamp(3.75rem, 7.2vw, 7.5rem); font-weight: 400; letter-spacing: -0.09em; line-height: 0.84; margin: 0; max-width: 700px;
`
const Lead = styled.p`
  font-size: 1.06rem; line-height: 1.6; margin: 2rem 0; max-width: 420px;
`
const Action = styled.a`
  background: #17231e; border: 1px solid #17231e; color: #f3f0e8; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.1em; padding: 1rem 1.35rem; text-decoration: none; text-transform: uppercase;
`
const HeroImage = styled.img`
  height: 100%; min-height: 420px; object-fit: cover; width: 100%;
`
const Section = styled.section`padding: clamp(3.5rem, 8vw, 7rem) clamp(1.25rem, 4vw, 4rem);`
const SectionTop = styled.div`
  align-items: end; display: flex; gap: 1rem; justify-content: space-between; margin-bottom: 2rem;
`
const SectionTitle = styled.h2`
  font-family: Georgia, serif; font-size: clamp(2.25rem, 4vw, 4rem); font-weight: 400; letter-spacing: -0.07em; margin: 0;
`
const TextLink = styled.a`
  color: inherit; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.1em; text-decoration: underline; text-underline-offset: 0.35rem; text-transform: uppercase;
`
const Categories = styled.div`
  display: grid; gap: 1px; grid-template-columns: repeat(3, 1fr); background: #c8c8bd;
  @media (max-width: 700px) { grid-template-columns: 1fr; }
`
const Category = styled.a`
  background: #ece9e1; color: inherit; min-height: 190px; padding: 1.5rem; text-decoration: none; transition: background 160ms ease;
  &:hover { background: #d7dec5; }
`
const CategoryNumber = styled.span`color: #49634e; font-size: 0.8rem; font-weight: 800;`
const CategoryName = styled.h3`font-family: Georgia, serif; font-size: 2.2rem; font-weight: 400; letter-spacing: -0.06em; margin: 3.5rem 0 0;`
const ProductGrid = styled.div`
  display: grid; gap: 1.5rem; grid-template-columns: repeat(4, minmax(0, 1fr));
  @media (max-width: 900px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`
const Product = styled.article`min-width: 0;`
const ProductVisual = styled.div`
  align-items: center; aspect-ratio: 0.82; background: #d9d0c0; color: #58715d; display: flex; font-family: Georgia, serif; font-size: 1.4rem; justify-content: center; margin-bottom: 0.9rem; text-align: center;
`
const ProductName = styled.h3`font-size: 0.84rem; letter-spacing: 0.04em; margin: 0 0 0.4rem; text-transform: uppercase;`
const ProductPrice = styled.p`font-size: 0.9rem; margin: 0;`
const AddButton = styled.button`
  background: transparent; border: 0; color: #49634e; cursor: pointer; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; margin-top: 0.7rem; padding: 0; text-decoration: underline; text-underline-offset: 0.3rem; text-transform: uppercase;
`
const Empty = styled.div`
  border: 1px solid #c8c8bd; padding: 2rem; grid-column: 1 / -1;
`
const Notice = styled.section`
  background: #17231e; color: #f3f0e8; display: grid; gap: 1.5rem; grid-template-columns: 1fr auto; padding: 2rem clamp(1.25rem, 4vw, 4rem);
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`
const NoticeTitle = styled.h2`font-family: Georgia, serif; font-size: 2rem; font-weight: 400; letter-spacing: -0.05em; margin: 0;`

const categoryItems = [
  { number: '01', name: 'T-shirts' },
  { number: '02', name: 'Outerwear' },
  { number: '03', name: 'Accessories' },
]

function App() {
  const { data: products = [], isLoading, isError } = useGetProductsQuery()
  const [addCartItem] = useAddCartItemMutation()
  const [cartCount, setCartCount] = useState(0)
  const highlightedProducts = useMemo(() => products.slice(0, 4), [products])

  function getSessionId(): string {
    const sessionStorageKey = 'coordillera-cart-session'
    const existingSessionId = window.localStorage.getItem(sessionStorageKey)
    if (existingSessionId) return existingSessionId
    const sessionId = crypto.randomUUID()
    window.localStorage.setItem(sessionStorageKey, sessionId)
    return sessionId
  }

  function addToCart(variantId: string): void {
    void addCartItem({ sessionId: getSessionId(), variantId, quantity: 1 }).unwrap().then(() => setCartCount((count) => count + 1))
  }

  return (
    <main className={page}>
      <Header>
        <Brand href="#top">Coordillera</Brand>
        <Nav aria-label="Primary navigation"><Link href="#shop">Shop</Link><Link href="#collections">Collections</Link><Link href="#about">About</Link></Nav>
        <Link href="#cart" aria-label="Cart">Bag ({cartCount})</Link>
      </Header>
      <Hero id="top">
        <HeroCopy><Kicker>Edition 01 / Temporary collection</Kicker><Title>Wear your own terrain.</Title><Lead>Purposeful layers, honest materials and a quieter approach to everyday uniform.</Lead><Action href="#shop">Explore the collection</Action></HeroCopy>
        <HeroImage src={heroCollection} alt="Unbranded streetwear collection" />
      </Hero>
      <Section id="collections">
        <SectionTop><SectionTitle>Shop by form.</SectionTitle><TextLink href="#shop">View all</TextLink></SectionTop>
        <Categories>{categoryItems.map((category) => <Category href="#shop" key={category.number}><CategoryNumber>{category.number}</CategoryNumber><CategoryName>{category.name}</CategoryName></Category>)}</Categories>
      </Section>
      <Section id="shop">
        <SectionTop><div><Kicker>Latest drop</Kicker><SectionTitle>Current pieces.</SectionTitle></div><TextLink href="#shop">Filter collection</TextLink></SectionTop>
        <ProductGrid>
          {isLoading && <Empty>Loading collection.</Empty>}
          {isError && <Empty>The collection is temporarily unavailable.</Empty>}
          {!isLoading && !isError && highlightedProducts.length === 0 && <Empty>Products will appear here when the first collection is published.</Empty>}
          {highlightedProducts.map((product) => <Product key={product.sku}><ProductVisual>{product.color ?? 'Coordillera'}</ProductVisual><ProductName>{product.name}</ProductName><ProductPrice>{formatPrice(product.priceCents)}</ProductPrice><AddButton onClick={() => addToCart(product.variantId)}>Add to bag</AddButton></Product>)}
        </ProductGrid>
      </Section>
      <Notice id="about"><div><Kicker>In the works</Kicker><NoticeTitle>Receive new drops and restocks first.</NoticeTitle></div><Action href="mailto:hello@coordillera.local">Join the list</Action></Notice>
    </main>
  )
}

export default App
