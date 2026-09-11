import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPromoBanner, isPromoBannerActive, DEFAULT_BANNER } from '@/services/promotions'

export function PromoBanner() {
  const [banner, setBanner] = useState(DEFAULT_BANNER)

  useEffect(() => {
    getPromoBanner()
      .then(setBanner)
      .catch(() => {})
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
