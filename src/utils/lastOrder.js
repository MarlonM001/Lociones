const KEY = 'essence_last_order'

/** Guarda el último pedido hecho desde este navegador (número y teléfono) para prellenar el seguimiento. */
export function saveLastOrder({ id, phone }) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ id, phone }))
  } catch {
    // sin almacenamiento local el cliente simplemente escribe los datos a mano
  }
}

export function getLastOrder() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    return raw && raw.id && raw.phone ? { id: raw.id, phone: String(raw.phone) } : null
  } catch {
    return null
  }
}
