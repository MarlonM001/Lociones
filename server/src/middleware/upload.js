import multer from 'multer'
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

export const uploadReferenceVideo = multer({
  storage: makeStorage('references'),
  limits: { fileSize: Number(process.env.MAX_VIDEO_SIZE_MB ?? 100) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('video/')) {
      return cb(ApiError.badRequest('El archivo debe ser un video.'))
    }
    cb(null, true)
  },
})

export function publicUploadUrl(subdir, filename) {
  return `/uploads/${subdir}/${filename}`
}
