import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import * as chatService from '../services/chat.service.js'

const router = Router()

router.get(
  '/conversations',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json(await chatService.listConversationsAdmin())
  }),
)

router.get(
  '/conversations/:id/messages',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json(await chatService.listMessages(Number(req.params.id)))
  }),
)

export default router
