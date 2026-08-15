import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import * as promotionsService from '../services/promotions.service.js'

const router = Router()

router.get(
  '/banner',
  asyncHandler(async (req, res) => {
    res.json(await promotionsService.getPromoBanner())
  }),
)

router.put(
  '/banner',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json(await promotionsService.savePromoBanner(req.body))
  }),
)

export default router
