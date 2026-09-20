import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAuth, requireAdmin, attachUserIfPresent } from '../middleware/auth.js'
import { rateLimitByIp } from '../middleware/rateLimit.js'
import { ApiError } from '../utils/ApiError.js'
import * as ordersService from '../services/orders.service.js'

const router = Router()

// Evita que un script llene la tienda de pedidos falsos desde una misma IP.
const createOrderLimiter = rateLimitByIp({
  windowMs: 10 * 60 * 1000,
  max: 15,
  message: 'Estás creando pedidos muy seguido. Espera unos minutos e intenta de nuevo.',
})

router.post(
  '/',
  createOrderLimiter,
  attachUserIfPresent,
  asyncHandler(async (req, res) => {
    const order = await ordersService.createOrder({ ...req.body, userId: req.user?.id ?? null })
    res.status(201).json(order)
  }),
)

// Seguimiento sin cuenta: pedido + teléfono. El límite frena a quien intente adivinar teléfonos.
const trackOrderLimiter = rateLimitByIp({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: 'Demasiadas consultas seguidas. Espera unos minutos e intenta de nuevo.',
})

router.post(
  '/track',
  trackOrderLimiter,
  asyncHandler(async (req, res) => {
    res.json(await ordersService.getOrderTracking(req.body ?? {}))
  }),
)

router.get(
  '/',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json(await ordersService.getOrders())
  }),
)

// Antes de '/:id' para que "pending-summary" no se lea como un id de pedido.
router.get(
  '/pending-summary',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json(await ordersService.getPendingOrdersSummary())
  }),
)

router.get(
  '/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await ordersService.getOrdersByUser(req.user.id))
  }),
)

router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const order = await ordersService.getOrderById(Number(req.params.id))
    if (!order) throw ApiError.notFound('Pedido no encontrado.')
    if (req.user.role !== 'admin' && order.userId !== req.user.id) {
      throw ApiError.forbidden()
    }
    res.json(order)
  }),
)

router.patch(
  '/:id/status',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const order = await ordersService.updateOrderStatus(Number(req.params.id), req.body.status)
    res.json(order)
  }),
)

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await ordersService.deleteOrder(Number(req.params.id))
    res.status(204).end()
  }),
)

export default router
