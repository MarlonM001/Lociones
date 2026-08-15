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
    return res.status(err.status).json({ error: err.message })
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Error al subir el archivo: ${err.message}` })
  }

  if (err?.code === '23505') {
    return res.status(409).json({ error: 'El registro ya existe.' })
  }

  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor.' })
}
