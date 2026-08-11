/**
 * Configuración del efecto de celebración (confeti lateral) que se reproduce
 * al entrar a la tienda. Un simple interruptor guardado en localStorage.
 */
const STORAGE_KEY = 'essence_celebration'

export const DEFAULT_CELEBRATION = {
  enabled: false,
}

export function getCelebrationConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_CELEBRATION, ...JSON.parse(raw) } : { ...DEFAULT_CELEBRATION }
  } catch {
    return { ...DEFAULT_CELEBRATION }
  }
}

export function saveCelebrationConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}
