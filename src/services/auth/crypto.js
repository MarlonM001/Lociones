/**
 * Hash de contraseña en el cliente (SHA-256 vía Web Crypto). Evita guardar
 * texto plano mientras no existe backend, pero NO reemplaza un hash real:
 * cuando se conecte la API, este hashing debe hacerse en el servidor con
 * bcrypt/argon2 y esta función debe eliminarse.
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
