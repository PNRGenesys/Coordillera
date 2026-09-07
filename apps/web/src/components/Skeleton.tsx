import { styled } from '@linaria/react'

/** Shimmering placeholder block; every skeleton shape below is built from this. */
export const SkeletonBlock = styled.div`
  background: linear-gradient(90deg, var(--color-surface) 25%, var(--color-surface-alt) 50%, var(--color-surface) 75%);
  background-size: 200% 100%;
  animation: skeletonShimmer 1.4s ease-in-out infinite;

  @keyframes skeletonShimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background-position: 0 0;
  }
`

const CardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`
const CardVisual = styled(SkeletonBlock)`
  aspect-ratio: 0.82;
`
const Line = styled(SkeletonBlock)<{ $width?: string; $height?: string }>`
  height: ${(props) => props.$height ?? '0.8rem'};
  width: ${(props) => props.$width ?? '100%'};
`

/** Mirrors the shape of `ProductCard`, used while `getProducts` is loading. */
export function ProductCardSkeleton() {
  return (
    <CardWrapper>
      <CardVisual />
      <Line $width="70%" />
      <Line $width="40%" />
    </CardWrapper>
  )
}

const DetailLayout = styled.div`
  display: grid;
  gap: clamp(2rem, 5vw, 4rem);
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`
const DetailGallery = styled(SkeletonBlock)`
  aspect-ratio: 0.9;
`
const DetailInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`

/** Mirrors the two-column shape of `ProductPage`, used while `getProduct` is loading. */
export function ProductDetailSkeleton() {
  return (
    <DetailLayout>
      <DetailGallery />
      <DetailInfo>
        <Line $width="60%" $height="2.5rem" />
        <Line $width="30%" $height="1.2rem" />
        <Line />
        <Line $width="85%" />
        <Line $width="45%" $height="2.5rem" />
      </DetailInfo>
    </DetailLayout>
  )
}

const Row = styled(SkeletonBlock)<{ $height?: string }>`
  height: ${(props) => props.$height ?? '4.5rem'};
  margin-bottom: 1.25rem;
`

/** Generic placeholder row, used for cart lines and admin cards while their lists are loading. */
export function RowSkeleton({ height }: { height?: string }) {
  return <Row $height={height} />
}
