export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? '')
}

export function isValidPhone(phone) {
  return /^[0-9\s+()-]{7,20}$/.test(phone ?? '')
}

/** Convierte `?limit=` en un entero entre 1 y `max`; con basura devuelve el valor por defecto. */
export function parseLimit(value, fallback = 8, max = 100) {
  const number = Number(value)
  if (value === undefined || !Number.isInteger(number) || number < 1) return fallback
  return Math.min(number, max)
}

/** Devuelve el texto de un parámetro de la URL, o undefined si no es un texto simple (p. ej. `?search[]=a`). */
export function queryText(value, maxLength = 100) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, maxLength) : undefined
}
