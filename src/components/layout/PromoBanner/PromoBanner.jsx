import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPromoBanner, isPromoBannerActive } from '@/services/promotions'

const DISMISS_KEY = 'essence_promo_dismissed'

export function PromoBanner() {
  const [banner, setBanner] = useState(getPromoBanner)
  const [dismissedMessage, setDismissedMessage] = useState(() => sessionStorage.getItem(DISMISS_KEY))

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
  const isDismissed = dismissedMessage === banner.message

  if (!isActive || isDismissed) return null

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, banner.message)
    setDismissedMessage(banner.message)
  }

  return (
    <div className="relative flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-gold px-10 py-2 text-center text-sm font-medium text-on-gold">
      <span>{banner.message}</span>
      {banner.linkTo && banner.linkLabel && (
        <Link to={banner.linkTo} className="underline underline-offset-2 hover:opacity-80">
          {banner.linkLabel}
        </Link>
      )}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Cerrar aviso"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-gold/70 transition-colors hover:text-on-gold"
      >
        ✕
      </button>
    </div>
  )
}
