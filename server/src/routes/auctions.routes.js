import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAuth, requireAdmin, attachUserIfPresent } from '../middleware/auth.js'
import { uploadAuctionImage, publicUploadUrl } from '../middleware/upload.js'
import * as auctionsService from '../services/auctions.service.js'

const router = Router()

router.get(
  '/config',
  asyncHandler(async (req, res) => {
    res.json(await auctionsService.getAuctionConfig())
  }),
)

router.put(
  '/config',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json(await auctionsService.setAuctionConfig(req.body.enabled))
  }),
)

router.get(
  '/',
  attachUserIfPresent,
  asyncHandler(async (req, res) => {
    const includeCancelled = req.query.includeCancelled === 'true'
    res.json(await auctionsService.listAuctions({ includeCancelled, currentUserId: req.user?.id }))
  }),
)

router.post(
  '/',
  requireAuth,
  requireAdmin,
  uploadAuctionImage.single('image'),
  asyncHandler(async (req, res) => {
    const imageUrl = req.file ? publicUploadUrl('auctions', req.file.filename) : undefined
    const items = req.body.items ? JSON.parse(req.body.items) : []
    const auction = await auctionsService.createAuction({ ...req.body, imageUrl, items })
    res.status(201).json(auction)
  }),
)

router.get(
  '/:slug',
  attachUserIfPresent,
  asyncHandler(async (req, res) => {
    const auction = await auctionsService.getAuctionBySlug(req.params.slug, req.user?.id)
    if (!auction) return res.status(404).json({ error: 'Subasta no encontrada.' })
    res.json(auction)
  }),
)

router.get(
  '/:id/bids',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json(await auctionsService.getAuctionBidsAdmin(Number(req.params.id)))
  }),
)

router.post(
  '/:id/bids',
  requireAuth,
  asyncHandler(async (req, res) => {
    const auction = await auctionsService.placeBid({
      auctionId: Number(req.params.id),
      userId: req.user.id,
      amount: req.body.amount,
    })
    res.status(201).json(auction)
  }),
)

router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  uploadAuctionImage.single('image'),
  asyncHandler(async (req, res) => {
    const updates = { ...req.body }
    if (req.file) updates.imageUrl = publicUploadUrl('auctions', req.file.filename)
    if (updates.items) updates.items = JSON.parse(updates.items)
    const auction = await auctionsService.updateAuction(Number(req.params.id), updates)
    res.json(auction)
  }),
)

router.post(
  '/:id/cancel',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await auctionsService.cancelAuction(Number(req.params.id))
    res.status(204).end()
  }),
)

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await auctionsService.deleteAuction(Number(req.params.id))
    res.status(204).end()
  }),
)

export default router
