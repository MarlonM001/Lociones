import { HeroSection } from './HeroSection'
import { TrustBar } from './TrustBar'
import { CategoriesSection } from './CategoriesSection'
import { BestsellersSection } from './BestsellersSection'
import { FeaturedSection } from './FeaturedSection'
import { ReferencesTeaser } from './ReferencesTeaser'

export function Home() {
  return (
    <>
      <HeroSection />
      <TrustBar />
      <BestsellersSection />
      <CategoriesSection />
      <FeaturedSection />
      <ReferencesTeaser />
    </>
  )
}
