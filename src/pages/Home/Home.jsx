import { HeroSection } from './HeroSection'
import { TrustBar } from './TrustBar'
import { CollectionsCarousel } from './CollectionsCarousel'
import { BestsellersSection } from './BestsellersSection'
import { FeaturedSection } from './FeaturedSection'
import { ReferencesTeaser } from './ReferencesTeaser'

export function Home() {
  return (
    <>
      <HeroSection />
      <BestsellersSection />
      <CollectionsCarousel />
      <FeaturedSection />
      <ReferencesTeaser />
      <TrustBar />
    </>
  )
}
