export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? '')
}

export function isValidPhone(phone) {
  return /^[0-9\s+()-]{7,20}$/.test(phone ?? '')
}

export function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0
}

export function minLength(value, length) {
  return typeof value === 'string' && value.trim().length >= length
}

/**
 * Valida un objeto contra un mapa de { campo: (valor) => mensajeDeError | null }.
 * Devuelve { valid, errors } donde errors solo contiene los campos con problema.
 */
export function validateFields(values, rules) {
  const errors = {}
  for (const [field, rule] of Object.entries(rules)) {
    const message = rule(values[field])
    if (message) errors[field] = message
  }
  return { valid: Object.keys(errors).length === 0, errors }
}
