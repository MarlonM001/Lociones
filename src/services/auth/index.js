import { apiFetch, setToken, clearToken, getToken } from '../api/client'

/**
 * Capa de autenticación. Habla con la API real (`server/`): JWT guardado en
 * localStorage, adjuntado como `Authorization: Bearer` en cada request por
 * `apiFetch`. Ver docs/DATABASE_SCHEMA.sql para la forma de `users`.
 */

export async function registerUser({ name, email, phone, password, city, address }) {
  const { user, token } = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: { name, email, phone, password, city, address },
  })
  setToken(token)
  return user
}

export async function loginUser({ email, password }) {
  const { user, token } = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  })
  setToken(token)
  return user
}

export function logoutUser() {
  clearToken()
}

/** Devuelve el usuario de la sesión actual, o null si no hay token o ya no es válido. */
export async function getSession() {
  if (!getToken()) return null
  try {
    return await apiFetch('/api/auth/me')
  } catch {
    clearToken()
    return null
  }
}

export async function getAllUsers() {
  return apiFetch('/api/auth/users')
}
