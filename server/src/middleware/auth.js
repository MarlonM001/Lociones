import jwt from 'jsonwebtoken'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from './errorHandler.js'

function extractToken(req) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length).trim()
}

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req)
  if (!token) throw ApiError.unauthorized('Falta el token de sesión.')

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: payload.sub, role: payload.role }
    next()
  } catch {
    throw ApiError.unauthorized('Token inválido o expirado.')
  }
})

/** Igual que requireAuth, pero no falla si no hay token: solo adjunta req.user cuando existe. */
export const attachUserIfPresent = asyncHandler(async (req, res, next) => {
  const token = extractToken(req)
  if (!token) return next()

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: payload.sub, role: payload.role }
  } catch {
    // Token inválido en una ruta opcional: se ignora, la request sigue como invitado.
  }
  next()
})

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    throw ApiError.forbidden('Se requiere rol de administrador.')
  }
  next()
}
