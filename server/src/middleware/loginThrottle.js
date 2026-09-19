import { createCounter, getClientIp, tooManyRequests } from './rateLimit.js'

const WINDOW_MS = 15 * 60 * 1000

// Tres contadores de intentos fallidos, para cubrir distintos ataques:
// - IP + email: frena a quien insiste con una misma cuenta desde un mismo lugar.
// - IP: frena a quien prueba muchas cuentas (o contraseñas) desde un mismo lugar.
// - email: frena un ataque repartido entre muchas IPs contra una sola cuenta.
const LIMITS = { ipEmail: 5, ip: 30, email: 20 }

const byIpEmail = createCounter({ windowMs: WINDOW_MS })
const byIp = createCounter({ windowMs: WINDOW_MS })
const byEmail = createCounter({ windowMs: WINDOW_MS })

function keysFor(req, email) {
  const ip = getClientIp(req)
  return { ip, ipEmail: `${ip}|${email}`, email }
}

/** Lanza 429 si ya se agotaron los intentos fallidos. Llamar antes de validar la contraseña. */
export function assertLoginAllowed(req, email) {
  const keys = keysFor(req, email)
  const checks = [
    [byIpEmail, keys.ipEmail, LIMITS.ipEmail],
    [byIp, keys.ip, LIMITS.ip],
    [byEmail, keys.email, LIMITS.email],
  ]
  for (const [counter, key, limit] of checks) {
    const { count, retryAfterMs } = counter.count(key)
    if (count >= limit) {
      const minutes = Math.ceil(retryAfterMs / 60_000)
      throw tooManyRequests(
        retryAfterMs,
        `Demasiados intentos fallidos. Intenta de nuevo en ${minutes} minuto${minutes === 1 ? '' : 's'}.`,
      )
    }
  }
}

export function recordLoginFailure(req, email) {
  const keys = keysFor(req, email)
  byIpEmail.hit(keys.ipEmail)
  byIp.hit(keys.ip)
  byEmail.hit(keys.email)
}

export function recordLoginSuccess(req, email) {
  const keys = keysFor(req, email)
  byIpEmail.reset(keys.ipEmail)
  byEmail.reset(keys.email)
}
