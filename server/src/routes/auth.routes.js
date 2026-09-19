import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { rateLimitByIp } from '../middleware/rateLimit.js'
import { assertLoginAllowed, recordLoginFailure, recordLoginSuccess } from '../middleware/loginThrottle.js'
import { ApiError } from '../utils/ApiError.js'
import * as authService from '../services/auth.service.js'

const router = Router()

// Evita crear cuentas en masa desde una misma IP.
const registerLimiter = rateLimitByIp({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Demasiados registros desde esta conexión. Intenta de nuevo más tarde.',
})

router.post(
  '/register',
  registerLimiter,
  asyncHandler(async (req, res) => {
    const result = await authService.registerUser(req.body)
    res.status(201).json(result)
  }),
)

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 254) : ''

    assertLoginAllowed(req, email)
    try {
      const result = await authService.loginUser(req.body)
      recordLoginSuccess(req, email)
      res.json(result)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) recordLoginFailure(req, email)
      throw error
    }
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
