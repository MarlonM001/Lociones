import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAuth, requireAdmin, attachUserIfPresent } from '../middleware/auth.js'
import { uploadProductImage, verifyImageSignatures, publicUploadUrl } from '../middleware/upload.js'
import { ApiError } from '../utils/ApiError.js'
import { parseLimit, queryText } from '../utils/validation.js'
import * as productsService from '../services/products.service.js'

const router = Router()

router.get(
  '/',
  attachUserIfPresent,
  asyncHandler(async (req, res) => {
    const { categoryId, search, includeInactive } = req.query
    const products = await productsService.getProducts({
      categoryId: queryText(categoryId),
      search: queryText(search),
      // Los productos ocultos solo los ve el admin; para el resto el parámetro se ignora.
      includeInactive: includeInactive === 'true' && req.user?.role === 'admin',
    })
    res.json(products)
  }),
)

// Precio vigente y stock de varios productos (refresca el carrito): /api/products/prices?ids=1,2,3
router.get(
  '/prices',
  asyncHandler(async (req, res) => {
    const ids = typeof req.query.ids === 'string' ? req.query.ids.split(',').map((id) => Number(id.trim())) : []
    res.json(await productsService.getProductPrices(ids))
  }),
)

router.get(
  '/featured',
  asyncHandler(async (req, res) => {
    res.json(await productsService.getFeaturedProducts(parseLimit(req.query.limit, 8)))
  }),
)

router.get(
  '/bestsellers',
  asyncHandler(async (req, res) => {
    res.json(await productsService.getBestsellerProducts(parseLimit(req.query.limit, 8)))
  }),
)

router.get(
  '/:slug',
  attachUserIfPresent,
  asyncHandler(async (req, res) => {
    const product = await productsService.getProductBySlug(req.params.slug, { includeInactive: req.user?.role === 'admin' })
    if (!product) throw ApiError.notFound('Producto no encontrado.')
    res.json(product)
  }),
)

router.get(
  '/:slug/related',
  asyncHandler(async (req, res) => {
    const product = await productsService.getProductBySlug(req.params.slug)
    if (!product) throw ApiError.notFound('Producto no encontrado.')
    res.json(await productsService.getRelatedProducts(product, parseLimit(req.query.limit, 4, 24)))
  }),
)

const uploadProductImages = uploadProductImage.fields([
  { name: 'image', maxCount: 1 },
  { name: 'bestsellerImage', maxCount: 1 },
])

router.post(
  '/',
  requireAuth,
  requireAdmin,
  uploadProductImages,
  verifyImageSignatures,
  asyncHandler(async (req, res) => {
    const imageUrl = req.files?.image?.[0] ? publicUploadUrl('products', req.files.image[0].filename) : undefined
    const bestsellerImageUrl = req.files?.bestsellerImage?.[0]
      ? publicUploadUrl('products', req.files.bestsellerImage[0].filename)
      : undefined
    const product = await productsService.createProduct({
      ...req.body,
      imageUrl,
      isBestseller: req.body.isBestseller === 'true',
      bestsellerImageUrl,
    })
    res.status(201).json(product)
  }),
)

router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  uploadProductImages,
  verifyImageSignatures,
  asyncHandler(async (req, res) => {
    const updates = { ...req.body }
    if (typeof updates.active === 'string') updates.active = updates.active === 'true'
    if (typeof updates.isBestseller === 'string') updates.isBestseller = updates.isBestseller === 'true'
    if (req.files?.image?.[0]) updates.imageUrl = publicUploadUrl('products', req.files.image[0].filename)
    if (req.files?.bestsellerImage?.[0]) {
      updates.bestsellerImageUrl = publicUploadUrl('products', req.files.bestsellerImage[0].filename)
    }
    const product = await productsService.updateProduct(Number(req.params.id), updates)
    res.json(product)
  }),
)

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await productsService.deleteProduct(Number(req.params.id))
    res.status(204).end()
  }),
)

export default router
