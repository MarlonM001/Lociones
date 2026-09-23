import multer from 'multer'
import { ApiError } from '../utils/ApiError.js'
import { detectFileKind, IMAGE_KINDS } from '../utils/fileSignature.js'
import { asyncHandler } from './errorHandler.js'
import { uploadToSupabaseStorage, removeUploadedFile as removeFromStorage } from '../utils/supabaseStorage.js'

const storage = multer.memoryStorage()

const IMAGE_EXTENSION_BY_MIME = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }

// Topes generales para que un formulario malicioso no mande cientos de campos o textos enormes.
const FORM_LIMITS = { fields: 30, fieldSize: 20_000, parts: 40 }

function imageOnlyFilter(req, file, cb) {
  if (!IMAGE_EXTENSION_BY_MIME[file.mimetype]) {
    return cb(ApiError.badRequest('Formatos de imagen permitidos: JPG, PNG o WEBP.'))
  }
  cb(null, true)
}

/**
 * Se ejecuta DESPUÉS de multer: mira los bytes de cada archivo recibido (ya en memoria) y comprueba
 * que por dentro sea de verdad una imagen (JPG, PNG o WEBP). El tipo que declara el cliente no basta:
 * se puede mandar un SVG o un HTML con nombre y tipo de imagen. Si algo no cuadra se responde 400.
 */
export const verifyImageSignatures = asyncHandler(async (req, res, next) => {
  const files = [...(req.file ? [req.file] : []), ...Object.values(req.files ?? {}).flat()]
  for (const file of files) {
    if (!IMAGE_KINDS.has(await detectFileKind(file.buffer))) {
      throw ApiError.badRequest('El archivo no es una imagen válida (JPG, PNG o WEBP).')
    }
  }
  next()
})

export const uploadProductImage = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_IMAGE_SIZE_MB ?? 4) * 1024 * 1024, files: 2, ...FORM_LIMITS },
  fileFilter: imageOnlyFilter,
})

export const uploadAuctionImage = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_IMAGE_SIZE_MB ?? 4) * 1024 * 1024, files: 1, ...FORM_LIMITS },
  fileFilter: imageOnlyFilter,
})

const REFERENCE_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

/**
 * Referencia de entrega: solo fotos (ya no se aceptan videos). Se exige que el
 * tipo declarado y la extensión coincidan (no se acepta cualquier archivo con
 * nombre .html o .svg); el contenido real se verifica después en la ruta.
 */
export const uploadReferenceMedia = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_IMAGE_SIZE_MB ?? 4) * 1024 * 1024, files: 1, ...FORM_LIMITS },
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() ?? ''
    if (!REFERENCE_IMAGE_EXTENSIONS.has(ext) || !IMAGE_EXTENSION_BY_MIME[file.mimetype]) {
      return cb(ApiError.badRequest('Solo se aceptan fotos en formato JPG, PNG o WEBP.'))
    }
    cb(null, true)
  },
})

/** Sube un archivo ya validado (`req.file`/`req.files`) a Supabase Storage y devuelve su URL pública. */
export async function publicUploadUrl(bucket, subdir, file) {
  return uploadToSupabaseStorage(bucket, subdir, file)
}

export const removeUploadedFile = removeFromStorage
