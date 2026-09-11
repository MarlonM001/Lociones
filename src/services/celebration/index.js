import { apiFetch } from '../api/client'

/**
 * Configuración del efecto de celebración (confeti lateral) que se reproduce
 * al entrar a la tienda. Habla con la API real (`server/`).
 */

export const DEFAULT_CELEBRATION = {
  enabled: false,
}

export async function getCelebrationConfig() {
  return apiFetch('/api/celebration')
}

export async function saveCelebrationConfig(config) {
  return apiFetch('/api/celebration', { method: 'PUT', body: config })
}
