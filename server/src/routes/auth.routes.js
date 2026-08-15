import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { ApiError } from '../utils/ApiError.js'
import * as authService from '../services/auth.service.js'

const router = Router()

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const result = await authService.registerUser(req.body)
    res.status(201).json(result)
  }),
)

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const result = await authService.loginUser(req.body)
    res.json(result)
  }),
)

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await authService.getUserById(req.user.id)
    if (!user) throw ApiError.notFound('Usuario no encontrado.')
    res.json(user)
  }),
)

router.get(
  '/users',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json(await authService.listUsers())
  }),
)

export default router
