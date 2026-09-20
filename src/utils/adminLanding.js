const KEY = 'essence_admin_landed'

/**
 * El admin cae en el panel una sola vez por pestaña (al abrir el sitio). Esta
 * marca evita el rebote: con "Ver tienda" o el logo puede mirar la tienda sin
 * que la página de inicio lo devuelva al panel.
 */
export function hasLandedInAdmin() {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return true
  }
}

export function markAdminLanded() {
  try {
    sessionStorage.setItem(KEY, '1')
  } catch {
    // sin sessionStorage el redireccionamiento simplemente no se repite
  }
}
