import { Navigate } from 'react-router-dom'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { useAuth } from '@/hooks/useAuth'
import { hasLandedInAdmin } from '@/utils/adminLanding'
import { HeroSection } from './HeroSection'
import { TrustBar } from './TrustBar'
import { CollectionsCarousel } from './CollectionsCarousel'
import { BestsellersSection } from './BestsellersSection'
import { FeaturedSection } from './FeaturedSection'
import { ReferencesTeaser } from './ReferencesTeaser'

export function Home() {
  useDocumentMeta({})
  const { isAdmin, initializing } = useAuth()

  // Al abrir el sitio, el admin va directo al panel (una vez por pestaña; ver utils/adminLanding).
  if (!initializing && isAdmin && !hasLandedInAdmin()) {
    return <Navigate to="/admin" replace />
  }

  return (
    <>
      <HeroSection />
      <CollectionsCarousel />
      <BestsellersSection />
      <FeaturedSection />
      <ReferencesTeaser />
      <TrustBar />
    </>
  )
}
