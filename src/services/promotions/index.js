import { apiFetch } from '../api/client'

/**
 * Configuración del aviso de promoción / fecha especial que se muestra
 * arriba de toda la tienda. Habla con la API real (`server/`).
 */

export const DEFAULT_BANNER = {
  enabled: false,
  message: '',
  linkLabel: '',
  linkTo: '',
  expiresAt: '', // 'YYYY-MM-DD', vacío = sin fecha de vencimiento
}

export async function getPromoBanner() {
  return apiFetch('/api/promotions/banner')
}

export async function savePromoBanner(banner) {
  return apiFetch('/api/promotions/banner', { method: 'PUT', body: banner })
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
