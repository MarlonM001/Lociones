/**
 * Configuración del aviso de promoción / fecha especial que se muestra arriba
 * de toda la tienda. Un solo banner activo a la vez, guardado en localStorage.
 */
const STORAGE_KEY = 'essence_promo_banner'

export const DEFAULT_BANNER = {
  enabled: false,
  message: '',
  linkLabel: '',
  linkTo: '',
  expiresAt: '', // 'YYYY-MM-DD', vacío = sin fecha de vencimiento
}

export function getPromoBanner() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_BANNER, ...JSON.parse(raw) } : { ...DEFAULT_BANNER }
  } catch {
    return { ...DEFAULT_BANNER }
  }
}

export function savePromoBanner(banner) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(banner))
}

/** Además de estar "encendido", respeta la fecha de vencimiento si se definió una. */
export function isPromoBannerActive(banner) {
  if (!banner.enabled || !banner.message.trim()) return false
  if (banner.expiresAt) {
    const expires = new Date(`${banner.expiresAt}T23:59:59`)
    if (Date.now() > expires.getTime()) return false
  }
  return true
}
