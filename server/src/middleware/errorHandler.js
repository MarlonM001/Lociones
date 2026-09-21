import { ApiError } from '../utils/ApiError.js'
import multer from 'multer'

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Ruta no encontrada.' })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    if (err.retryAfterSeconds) res.setHeader('Retry-After', String(err.retryAfterSeconds))
    return res.status(err.status).json({ error: err.message })
  }

  // Cuerpo de la petición mal formado o demasiado grande: es un error del cliente, no del servidor.
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido.' })
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'La petición es demasiado grande.' })
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'El archivo pesa demasiado.' })
    return res.status(400).json({ error: `Error al subir el archivo: ${err.message}` })
  }

  if (err?.code === '23505') {
    return res.status(409).json({ error: 'El registro ya existe.' })
  }
  // Postgres rechazó un dato (texto donde iba un número, número fuera de rango, texto demasiado largo,
  // dato que incumple una regla o referencia que no existe): es un dato inválido de quien llamó.
  if (['22P02', '22003', '22007', '22001', '23502', '23503', '23514'].includes(err?.code)) {
    return res.status(400).json({ error: 'Alguno de los datos enviados no es válido.' })
  }

  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor.' })
}
