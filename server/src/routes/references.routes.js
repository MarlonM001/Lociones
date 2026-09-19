import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import fs from 'node:fs/promises'
import path from 'node:path'
import { uploadReferenceMedia, publicUploadUrl, removeUploadedFile, MAX_REFERENCE_IMAGE_BYTES } from '../middleware/upload.js'
import { ApiError } from '../utils/ApiError.js'
import { transcodeToH264 } from '../utils/transcodeVideo.js'
import * as referencesService from '../services/references.service.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await referencesService.getApprovedReferences())
  }),
)

router.get(
  '/admin',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json(await referencesService.getAllReferencesAdmin())
  }),
)

router.get(
  '/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await referencesService.getReferencesByUser(req.user.id))
  }),
)

router.post(
  '/',
  requireAuth,
  uploadReferenceMedia.single('media'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('Selecciona un video o una foto para subir.')

    const isImage = req.file.mimetype.startsWith('image/')
    let storedFilename = req.file.filename
    try {
      if (isImage && req.file.size > MAX_REFERENCE_IMAGE_BYTES) {
        const maxMb = Math.round(MAX_REFERENCE_IMAGE_BYTES / 1024 / 1024)
        throw ApiError.badRequest(`La foto pesa demasiado (máx. ${maxMb} MB).`)
      }

      if (!isImage) storedFilename = await transcodeToH264(req.file.path)
      const reference = await referencesService.addReference({
        ...req.body,
        mediaUrl: publicUploadUrl('references', storedFilename),
        mediaType: isImage ? 'image' : 'video',
        createdBy: req.user.id,
        isAdmin: req.user.role === 'admin',
      })
      res.status(201).json(reference)
    } catch (error) {
      // No dejar archivos huérfanos si la referencia no se llegó a guardar.
      const dir = path.dirname(req.file.path)
      await Promise.all(
        [req.file.filename, storedFilename].map((name) => fs.unlink(path.join(dir, name)).catch(() => {})),
      )
      throw error
    }
  }),
)

router.patch(
  '/:id/status',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const reference = await referencesService.updateReferenceStatus(Number(req.params.id), req.body.status)
    res.json(reference)
  }),
)

router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const mediaUrl = await referencesService.deleteReference(Number(req.params.id), {
      userId: req.user.id,
      isAdmin: req.user.role === 'admin',
    })
    await removeUploadedFile(mediaUrl)
    res.status(204).end()
  }),
)

export default router
