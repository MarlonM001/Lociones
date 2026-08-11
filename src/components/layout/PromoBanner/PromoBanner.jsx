import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPromoBanner, isPromoBannerActive } from '@/services/promotions'

export function PromoBanner() {
  const [banner, setBanner] = useState(getPromoBanner)

  useEffect(() => {
    // Si el admin cambia el banner en otra pestaña del mismo navegador, se refleja sin recargar.
    const handleStorage = (event) => {
      if (event.key === null || event.key === 'essence_promo_banner') {
        setBanner(getPromoBanner())
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const isActive = isPromoBannerActive(banner)

  if (!isActive) return null

  return (
    <div className="relative flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-gold px-10 py-2 text-center text-sm font-medium text-on-gold">
      <span>{banner.message}</span>
      {banner.linkTo && banner.linkLabel && (
        <Link to={banner.linkTo} className="underline underline-offset-2 hover:opacity-80">
          {banner.linkLabel}
        </Link>
      )}
    </div>
  )
}
