import { apiFetch, buildFormData, resolveMediaUrl } from '../api/client'

/**
 * Capa de productos. Habla con la API real (`server/`), que sirve el
 * catálogo sembrado (380 productos) desde Postgres.
 */

function toPublicProduct(product) {
  return {
    ...product,
    image: resolveMediaUrl(product.image),
    images: (product.images ?? []).map(resolveMediaUrl),
  }
}

export async function getProducts({ categoryId, search, includeInactive = false } = {}) {
  const params = new URLSearchParams()
  if (categoryId) params.set('categoryId', categoryId)
  if (search) params.set('search', search)
  if (includeInactive) params.set('includeInactive', 'true')

  const query = params.toString()
  const products = await apiFetch(`/api/products${query ? `?${query}` : ''}`)
  return products.map(toPublicProduct)
}

export async function getProductBySlug(slug) {
  try {
    const product = await apiFetch(`/api/products/${slug}`)
    return toPublicProduct(product)
  } catch (error) {
    if (error.status === 404) return null
    throw error
  }
}

export async function getFeaturedProducts(limit = 8) {
  const products = await apiFetch(`/api/products/featured?limit=${limit}`)
  return products.map(toPublicProduct)
}

export async function getProductCountByCategory(categoryId) {
  const products = await apiFetch(`/api/products?categoryId=${encodeURIComponent(categoryId)}`)
  return products.length
}

export async function getRelatedProducts(product, limit = 4) {
  const related = await apiFetch(`/api/products/${product.slug}/related?limit=${limit}`)
  return related.map(toPublicProduct)
}

/** Mapa productId -> categoryId sobre TODO el catálogo (incluye inactivos), para reportes históricos. */
export async function getProductCategoryMap() {
  const products = await apiFetch('/api/products?includeInactive=true')
  return new Map(products.map((product) => [product.id, product.categoryId]))
}

function toProductFormData({ name, categoryId, price, sku, stock, shortDescription, description, active, imageFile }) {
  return buildFormData({
    name,
    categoryId,
    price,
    sku,
    stock,
    shortDescription,
    description,
    ...(typeof active === 'boolean' && { active: String(active) }),
    ...(imageFile && { image: imageFile }),
  })
}

export async function createProduct(fields) {
  const product = await apiFetch('/api/products', {
    method: 'POST',
    isFormData: true,
    body: toProductFormData(fields),
  })
  return toPublicProduct(product)
}

export async function updateProduct(id, updates) {
  const product = await apiFetch(`/api/products/${id}`, {
    method: 'PATCH',
    isFormData: true,
    body: toProductFormData(updates),
  })
  return toPublicProduct(product)
}

export async function setProductActive(id, active) {
  return updateProduct(id, { active })
}

export async function deleteProduct(id) {
  await apiFetch(`/api/products/${id}`, { method: 'DELETE' })
}
