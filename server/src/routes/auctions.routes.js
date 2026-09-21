import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAuth, requireAdmin, attachUserIfPresent } from '../middleware/auth.js'
import { uploadAuctionImage, verifyImageSignatures, publicUploadUrl } from '../middleware/upload.js'
import { ApiError } from '../utils/ApiError.js'
import * as auctionsService from '../services/auctions.service.js'
import { broadcastAuctionBid } from '../realtime/liveEvents.js'

/** La lista de productos llega como texto JSON dentro del formulario; si viene mal armada es un error 400. */
function parseItems(raw) {
  try {
    const items = JSON.parse(raw)
    if (Array.isArray(items)) return items
  } catch {
    // cae al error de abajo
  }
  throw ApiError.badRequest('La lista de productos de la subasta no es válida.')
}

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
  verifyImageSignatures,
  asyncHandler(async (req, res) => {
    const imageUrl = req.file ? publicUploadUrl('auctions', req.file.filename) : undefined
    const items = req.body.items ? parseItems(req.body.items) : []
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

// Pujas visibles para todo el público (nombres abreviados). Las del admin, con contactos, van en /:id/bids.
router.get(
  '/:id/feed',
  asyncHandler(async (req, res) => {
    const auctionId = Number(req.params.id)
    if (!Number.isInteger(auctionId)) throw ApiError.badRequest('Subasta no válida.')
    res.json(await auctionsService.getPublicBidFeed(auctionId))
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
    const { lastBid, ...auction } = await auctionsService.placeBid({
      auctionId: Number(req.params.id),
      userId: req.user.id,
      amount: req.body.amount,
    })
    broadcastAuctionBid({
      auctionId: auction.id,
      bid: lastBid,
      currentPrice: auction.currentPrice,
      bidCount: auction.bidCount,
      nextMinBid: auction.nextMinBid,
    })
    res.status(201).json(auction)
  }),
)

router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  uploadAuctionImage.single('image'),
  verifyImageSignatures,
  asyncHandler(async (req, res) => {
    const updates = { ...req.body }
    if (req.file) updates.imageUrl = publicUploadUrl('auctions', req.file.filename)
    if (updates.items) updates.items = parseItems(updates.items)
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
