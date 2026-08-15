import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { uploadProductImage, publicUploadUrl } from '../middleware/upload.js'
import { ApiError } from '../utils/ApiError.js'
import * as productsService from '../services/products.service.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { categoryId, search, includeInactive } = req.query
    const products = await productsService.getProducts({
      categoryId: categoryId || undefined,
      search: search || undefined,
      includeInactive: includeInactive === 'true',
    })
    res.json(products)
  }),
)

router.get(
  '/featured',
  asyncHandler(async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 8
    res.json(await productsService.getFeaturedProducts(limit))
  }),
)

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const product = await productsService.getProductBySlug(req.params.slug)
    if (!product) throw ApiError.notFound('Producto no encontrado.')
    res.json(product)
  }),
)

router.get(
  '/:slug/related',
  asyncHandler(async (req, res) => {
    const product = await productsService.getProductBySlug(req.params.slug)
    if (!product) throw ApiError.notFound('Producto no encontrado.')
    const limit = req.query.limit ? Number(req.query.limit) : 4
    res.json(await productsService.getRelatedProducts(product, limit))
  }),
)

router.post(
  '/',
  requireAuth,
  requireAdmin,
  uploadProductImage.single('image'),
  asyncHandler(async (req, res) => {
    const imageUrl = req.file ? publicUploadUrl('products', req.file.filename) : undefined
    const product = await productsService.createProduct({ ...req.body, imageUrl })
    res.status(201).json(product)
  }),
)

router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  uploadProductImage.single('image'),
  asyncHandler(async (req, res) => {
    const updates = { ...req.body }
    if (typeof updates.active === 'string') updates.active = updates.active === 'true'
    if (req.file) updates.imageUrl = publicUploadUrl('products', req.file.filename)
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
