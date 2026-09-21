import multer from 'multer'
import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ApiError } from '../utils/ApiError.js'
import { detectFileKind, IMAGE_KINDS } from '../utils/fileSignature.js'
import { asyncHandler } from './errorHandler.js'

const SERVER_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const UPLOAD_ROOT = path.isAbsolute(process.env.UPLOAD_DIR ?? 'uploads')
  ? process.env.UPLOAD_DIR
  : path.join(SERVER_ROOT, process.env.UPLOAD_DIR ?? 'uploads')

export const UPLOAD_DIR = UPLOAD_ROOT

// Las imágenes se guardan con la extensión que corresponde a su tipo, no con la del nombre que trae el archivo.
const IMAGE_EXTENSION_BY_MIME = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }

function makeStorage(subdir) {
  return multer.diskStorage({
    destination: path.join(UPLOAD_ROOT, subdir),
    filename: (req, file, cb) => {
      const ext =
        IMAGE_EXTENSION_BY_MIME[file.mimetype] ?? path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '')
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`)
    },
  })
}

// Topes generales para que un formulario malicioso no mande cientos de campos o textos enormes.
const FORM_LIMITS = { fields: 30, fieldSize: 20_000, parts: 40 }

function imageOnlyFilter(req, file, cb) {
  if (!IMAGE_EXTENSION_BY_MIME[file.mimetype]) {
    return cb(ApiError.badRequest('Formatos de imagen permitidos: JPG, PNG o WEBP.'))
  }
  cb(null, true)
}

/**
 * Se ejecuta DESPUÉS de multer: abre cada archivo recibido y comprueba que por dentro sea de verdad
 * una imagen (JPG, PNG o WEBP). El tipo que declara el cliente no basta: se puede mandar un SVG o un
 * HTML con nombre y tipo de imagen. Si algo no cuadra se borran todos los archivos y se responde 400.
 */
export const verifyImageSignatures = asyncHandler(async (req, res, next) => {
  const files = [...(req.file ? [req.file] : []), ...Object.values(req.files ?? {}).flat()]
  for (const file of files) {
    if (!IMAGE_KINDS.has(await detectFileKind(file.path))) {
      await Promise.all(files.map((item) => fs.unlink(item.path).catch(() => {})))
      throw ApiError.badRequest('El archivo no es una imagen válida (JPG, PNG o WEBP).')
    }
  }
  next()
})

export const uploadProductImage = multer({
  storage: makeStorage('products'),
  limits: { fileSize: Number(process.env.MAX_IMAGE_SIZE_MB ?? 8) * 1024 * 1024, files: 2, ...FORM_LIMITS },
  fileFilter: imageOnlyFilter,
})

export const uploadAuctionImage = multer({
  storage: makeStorage('auctions'),
  limits: { fileSize: Number(process.env.MAX_IMAGE_SIZE_MB ?? 8) * 1024 * 1024, files: 1, ...FORM_LIMITS },
  fileFilter: imageOnlyFilter,
})

const REFERENCE_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

/**
 * Referencia de entrega: solo fotos (ya no se aceptan videos). Se exige que el
 * tipo declarado y la extensión coincidan (no se acepta cualquier archivo con
 * nombre .html o .svg); el contenido real se verifica después en la ruta.
 */
export const uploadReferenceMedia = multer({
  storage: makeStorage('references'),
  limits: { fileSize: Number(process.env.MAX_IMAGE_SIZE_MB ?? 8) * 1024 * 1024, files: 1, ...FORM_LIMITS },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (!REFERENCE_IMAGE_EXTENSIONS.has(ext) || !IMAGE_EXTENSION_BY_MIME[file.mimetype]) {
      return cb(ApiError.badRequest('Solo se aceptan fotos en formato JPG, PNG o WEBP.'))
    }
    cb(null, true)
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
