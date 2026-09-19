import multer from 'multer'
import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ApiError } from '../utils/ApiError.js'

const SERVER_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const UPLOAD_ROOT = path.isAbsolute(process.env.UPLOAD_DIR ?? 'uploads')
  ? process.env.UPLOAD_DIR
  : path.join(SERVER_ROOT, process.env.UPLOAD_DIR ?? 'uploads')

export const UPLOAD_DIR = UPLOAD_ROOT

function makeStorage(subdir) {
  return multer.diskStorage({
    destination: path.join(UPLOAD_ROOT, subdir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase()
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`)
    },
  })
}

export const uploadProductImage = multer({
  storage: makeStorage('products'),
  limits: { fileSize: Number(process.env.MAX_IMAGE_SIZE_MB ?? 8) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(ApiError.badRequest('El archivo debe ser una imagen.'))
    }
    cb(null, true)
  },
})

export const uploadAuctionImage = multer({
  storage: makeStorage('auctions'),
  limits: { fileSize: Number(process.env.MAX_IMAGE_SIZE_MB ?? 8) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(ApiError.badRequest('El archivo debe ser una imagen.'))
    }
    cb(null, true)
  },
})

const REFERENCE_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const REFERENCE_VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.m4v', '.webm', '.mkv', '.avi', '.3gp'])

export const MAX_REFERENCE_IMAGE_BYTES = Number(process.env.MAX_IMAGE_SIZE_MB ?? 8) * 1024 * 1024

/**
 * Referencia de entrega: un video o una foto. Se exige que el tipo declarado
 * y la extensión coincidan (no se acepta cualquier archivo con nombre .html o
 * .svg). El tope de tamaño de las fotos se revisa en la ruta, porque multer
 * solo admite un límite y aquí manda el de los videos.
 */
export const uploadReferenceMedia = multer({
  storage: makeStorage('references'),
  limits: { fileSize: Number(process.env.MAX_VIDEO_SIZE_MB ?? 100) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (file.mimetype.startsWith('image/')) {
      if (!REFERENCE_IMAGE_EXTENSIONS.has(ext) || !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
        return cb(ApiError.badRequest('Formatos de imagen permitidos: JPG, PNG o WEBP.'))
      }
      return cb(null, true)
    }
    if (file.mimetype.startsWith('video/')) {
      if (!REFERENCE_VIDEO_EXTENSIONS.has(ext)) {
        return cb(ApiError.badRequest('Formato de video no admitido. Prueba con MP4 o MOV.'))
      }
      return cb(null, true)
    }
    cb(ApiError.badRequest('El archivo debe ser un video o una imagen (JPG, PNG o WEBP).'))
  },
})

export function publicUploadUrl(subdir, filename) {
  return `/uploads/${subdir}/${filename}`
}

/** Borra del disco un archivo subido a partir de su URL pública (`/uploads/<carpeta>/<archivo>`). */
export async function removeUploadedFile(publicUrl) {
  const match = /^\/uploads\/([\w-]+)\/([\w.-]+)$/.exec(publicUrl ?? '')
  if (!match) return
  await fs.unlink(path.join(UPLOAD_ROOT, match[1], match[2])).catch(() => {})
}
