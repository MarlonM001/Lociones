import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPromoBanner, isPromoBannerActive, DEFAULT_BANNER } from '@/services/promotions'

const CACHE_KEY = 'essence_promo_banner_cache'

/**
 * El banner solo se sabe si debe mostrarse después de consultar la API, y
 * como vive arriba de todo (Navbar incluido) en el flujo normal del
 * documento, aparecer recién cuando esa respuesta llega empuja el resto de
 * la página hacia abajo — en el celular eso se siente como "la página se
 * corre sola" y puede hacer que un toque sobre el logo (que ya se movió)
 * falle. Arrancar desde el último valor visto en este navegador evita ese
 * salto en cualquier visita que no sea la primera; el fetch sigue
 * ejecutándose para mantenerlo al día.
 */
function readCachedBanner() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : DEFAULT_BANNER
  } catch {
    return DEFAULT_BANNER
  }
}

export function PromoBanner() {
  const [banner, setBanner] = useState(readCachedBanner)

  useEffect(() => {
    getPromoBanner()
      .then((fresh) => {
        setBanner(fresh)
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(fresh))
        } catch {
          // Almacenamiento no disponible (privado/bloqueado): sin caché, sin problema.
        }
      })
      .catch(() => {})
  }, [])

  const isActive = isPromoBannerActive(banner)

  if (!isActive) return null

  return (
    <div className="relative flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-gold px-10 py-2 text-center text-sm font-medium text-on-gold">
      <span>{banner.message}</span>
      {banner.linkTo && banner.linkLabel && (
        <Link to={banner.linkTo} className="inline-flex min-h-8 items-center px-2 underline underline-offset-2 hover:opacity-80">
          {banner.linkLabel}
        </Link>
      )}
    </div>
  )
}
