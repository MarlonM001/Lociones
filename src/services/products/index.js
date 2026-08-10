import { generateProducts } from '@/data/generateProducts'
import { slugify } from '@/utils/slugify'
import {
  countProductRecords,
  putProductRecord,
  putProductRecords,
  getAllProductRecords,
  deleteProductRecord,
} from './db'

const MAX_IMAGE_SIZE_MB = 8

/**
 * Siembra el catálogo una sola vez (primer arranque) con los 380 productos
 * generados. Comparte la promesa entre llamadas concurrentes para no sembrar
 * dos veces si varias páginas piden productos al mismo tiempo.
 */
let seedPromise = null
function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = countProductRecords().then((count) => {
      if (count === 0) return putProductRecords(generateProducts())
    })
  }
  return seedPromise
}

function toPublicProduct(record) {
  const image = record.imageBlob ? URL.createObjectURL(record.imageBlob) : record.image
  return {
    ...record,
    image,
    images: record.imageBlob ? [image] : record.images,
  }
}

export async function getProducts({ categoryId, search, includeInactive = false } = {}) {
  await ensureSeeded()
  let results = await getAllProductRecords()

  if (!includeInactive) {
    results = results.filter((product) => product.active)
  }
  if (categoryId) {
    results = results.filter((product) => product.categoryId === categoryId)
  }
  if (search) {
    const term = search.trim().toLowerCase()
    results = results.filter((product) => product.name.toLowerCase().includes(term))
  }

  return results.sort((a, b) => b.id - a.id).map(toPublicProduct)
}

export async function getProductBySlug(slug) {
  await ensureSeeded()
  const records = await getAllProductRecords()
  const record = records.find((product) => product.slug === slug)
  return record ? toPublicProduct(record) : null
}

export async function getProductById(id) {
  await ensureSeeded()
  const records = await getAllProductRecords()
  const record = records.find((product) => product.id === Number(id))
  return record ? toPublicProduct(record) : null
}

export async function getFeaturedProducts(limit = 8) {
  await ensureSeeded()
  const records = await getAllProductRecords()
  return records.filter((product) => product.active).slice(0, limit).map(toPublicProduct)
}

export async function getProductCountByCategory(categoryId) {
  await ensureSeeded()
  const records = await getAllProductRecords()
  return records.filter((product) => product.categoryId === categoryId && product.active).length
}

export async function getRelatedProducts(product, limit = 4) {
  await ensureSeeded()
  const records = await getAllProductRecords()
  return records
    .filter((item) => item.categoryId === product.categoryId && item.id !== product.id && item.active)
    .slice(0, limit)
    .map(toPublicProduct)
}

/** Mapa productId -> categoryId sobre TODO el catálogo (incluye inactivos), para reportes históricos. */
export async function getProductCategoryMap() {
  await ensureSeeded()
  const records = await getAllProductRecords()
  return new Map(records.map((product) => [product.id, product.categoryId]))
}

function validateImageFile(file) {
  if (!file) return
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen.')
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    throw new Error(`La imagen no debe superar ${MAX_IMAGE_SIZE_MB}MB.`)
  }
}

export async function createProduct({
  name,
  categoryId,
  price,
  sku,
  stock,
  shortDescription,
  description,
  imageFile,
}) {
  await ensureSeeded()
  validateImageFile(imageFile)

  const records = await getAllProductRecords()
  const id = records.reduce((max, item) => Math.max(max, item.id), 0) + 1

  const record = {
    id,
    name: name.trim(),
    slug: slugify(`${name}-${id}`),
    categoryId,
    sku: sku?.trim() || `CUST-${String(id).padStart(4, '0')}`,
    price: Number(price),
    description: description?.trim() || '',
    shortDescription: shortDescription?.trim() || '',
    image: '/images/products/placeholder.svg',
    images: ['/images/products/placeholder.svg'],
    imageBlob: imageFile ?? null,
    stock: Number(stock) || 0,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await putProductRecord(record)
  return toPublicProduct(record)
}

export async function updateProduct(id, updates) {
  await ensureSeeded()
  if (updates.imageFile) validateImageFile(updates.imageFile)

  const records = await getAllProductRecords()
  const existing = records.find((item) => item.id === Number(id))
  if (!existing) throw new Error('Producto no encontrado.')

  const updated = {
    ...existing,
    ...('name' in updates && { name: updates.name.trim() }),
    ...('categoryId' in updates && { categoryId: updates.categoryId }),
    ...('sku' in updates && { sku: updates.sku.trim() }),
    ...('price' in updates && { price: Number(updates.price) }),
    ...('stock' in updates && { stock: Number(updates.stock) }),
    ...('description' in updates && { description: updates.description.trim() }),
    ...('shortDescription' in updates && { shortDescription: updates.shortDescription.trim() }),
    ...('active' in updates && { active: updates.active }),
    ...(updates.imageFile && { imageBlob: updates.imageFile }),
    updatedAt: new Date().toISOString(),
  }

  await putProductRecord(updated)
  return toPublicProduct(updated)
}

export async function setProductActive(id, active) {
  return updateProduct(id, { active })
}

export async function deleteProduct(id) {
  await deleteProductRecord(Number(id))
}
