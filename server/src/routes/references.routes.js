import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { uploadReferenceVideo, publicUploadUrl } from '../middleware/upload.js'
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
  uploadReferenceVideo.single('video'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('Selecciona un video para subir.')
    const transcodedFilename = await transcodeToH264(req.file.path)
    const videoUrl = publicUploadUrl('references', transcodedFilename)
    const reference = await referencesService.addReference({
      ...req.body,
      videoUrl,
      createdBy: req.user.id,
    })
    res.status(201).json(reference)
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
  requireAdmin,
  asyncHandler(async (req, res) => {
    await referencesService.deleteReference(Number(req.params.id))
    res.status(204).end()
  }),
)

export default router
