import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import fs from 'node:fs/promises'
import { uploadReferenceMedia, verifyImageSignatures, publicUploadUrl, removeUploadedFile } from '../middleware/upload.js'
import { ApiError } from '../utils/ApiError.js'
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
  verifyImageSignatures,
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('Selecciona una foto para subir.')

    try {
      await referencesService.assertCanUpload({ userId: req.user.id, isAdmin: req.user.role === 'admin' })
      const reference = await referencesService.addReference({
        ...req.body,
        mediaUrl: publicUploadUrl('references', req.file.filename),
        createdBy: req.user.id,
        isAdmin: req.user.role === 'admin',
      })
      res.status(201).json(reference)
    } catch (error) {
      // No dejar el archivo huérfano si la referencia no se llegó a guardar.
      await fs.unlink(req.file.path).catch(() => {})
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
