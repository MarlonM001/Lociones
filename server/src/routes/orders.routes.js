import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAuth, requireAdmin, attachUserIfPresent } from '../middleware/auth.js'
import { ApiError } from '../utils/ApiError.js'
import * as ordersService from '../services/orders.service.js'

const router = Router()

router.post(
  '/',
  attachUserIfPresent,
  asyncHandler(async (req, res) => {
    const order = await ordersService.createOrder({ ...req.body, userId: req.user?.id ?? null })
    res.status(201).json(order)
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
