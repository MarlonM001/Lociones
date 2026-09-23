import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
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

    await referencesService.assertCanUpload({ userId: req.user.id, isAdmin: req.user.role === 'admin' })
    const mediaUrl = await publicUploadUrl('reference-media', 'references', req.file)
    const reference = await referencesService.addReference({
      ...req.body,
      mediaUrl,
      createdBy: req.user.id,
      isAdmin: req.user.role === 'admin',
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
