const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'
const TOKEN_KEY = 'essence_auth_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * Antepone la URL de la API a los archivos que sirve el backend
 * (`/uploads/...`). Los que empiezan distinto (ej. `/images/products/...`)
 * son activos estáticos propios del frontend y se dejan tal cual.
 */
export function resolveMediaUrl(path) {
  if (!path) return path
  if (path.startsWith('/uploads/')) return `${API_BASE_URL}${path}`
  return path
}

/**
 * Wrapper de fetch: arma la URL, agrega el token de sesión si existe,
 * y ante una respuesta no-2xx lanza un Error con el mensaje que mandó el
 * backend (`{ error: '...' }`) para que los catch existentes en las
 * páginas (`error.message`) sigan funcionando sin cambios.
 */
export async function apiFetch(path, { method = 'GET', body, isFormData = false, headers = {} } = {}) {
  const token = getToken()
  const finalHeaders = { ...headers }
  if (token) finalHeaders.Authorization = `Bearer ${token}`
  if (!isFormData && body !== undefined) finalHeaders['Content-Type'] = 'application/json'

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  })

  if (response.status === 204) return null

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await response.json() : null

  if (!response.ok) {
    const error = new Error(data?.error || 'Ocurrió un error inesperado. Intenta de nuevo.')
    error.status = response.status
    throw error
  }

  return data
}

export function buildFormData(fields) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue
    formData.append(key, value)
  }
  return formData
}
