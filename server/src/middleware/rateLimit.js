import { ApiError } from '../utils/ApiError.js'

/**
 * IP real del cliente. En Vercel las funciones corren detrás de su propio proxy, que pone la IP
 * real del visitante en `X-Forwarded-For` (primer valor de la lista); esa cabecera no se puede
 * falsear desde fuera porque Vercel la sobrescribe. Si no está presente (ej. corriendo local),
 * se usa la IP de la conexión.
 */
export function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for']
  const first = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(',')[0]?.trim()
  return first || req.socket?.remoteAddress || 'unknown'
}

/**
 * Contador en memoria con ventana fija. Suficiente para un único proceso Node;
 * si algún día hay varias instancias habría que moverlo a Redis/Postgres.
 */
export function createCounter({ windowMs }) {
  const hits = new Map()

  const sweep = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key)
    }
  }, Math.max(windowMs, 60_000))
  sweep.unref()

  return {
    count(key) {
      const entry = hits.get(key)
      if (!entry || entry.resetAt <= Date.now()) return { count: 0, retryAfterMs: 0 }
      return { count: entry.count, retryAfterMs: entry.resetAt - Date.now() }
    },
    hit(key) {
      const now = Date.now()
      const entry = hits.get(key)
      if (!entry || entry.resetAt <= now) {
        hits.set(key, { count: 1, resetAt: now + windowMs })
        return 1
      }
      entry.count += 1
      return entry.count
    },
    reset(key) {
      hits.delete(key)
    },
  }
}

export function tooManyRequests(retryAfterMs, message) {
  const error = ApiError.tooManyRequests(message)
  error.retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000))
  return error
}

/** Middleware genérico: máximo `max` peticiones por IP en la ventana. */
export function rateLimitByIp({ windowMs, max, message }) {
  const counter = createCounter({ windowMs })
  return (req, res, next) => {
    const key = getClientIp(req)
    if (counter.hit(key) > max) {
      const { retryAfterMs } = counter.count(key)
      return next(tooManyRequests(retryAfterMs, message))
    }
    next()
  }
}
