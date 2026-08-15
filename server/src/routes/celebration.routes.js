import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import * as celebrationService from '../services/celebration.service.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await celebrationService.getCelebrationConfig())
  }),
)

router.put(
  '/',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json(await celebrationService.saveCelebrationConfig(req.body))
  }),
)

export default router
