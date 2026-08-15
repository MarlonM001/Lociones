import crypto from 'node:crypto'
import { pool } from '../db/pool.js'
import { ApiError } from '../utils/ApiError.js'
import { slugify } from '../utils/slugify.js'

const PLACEHOLDER_IMAGE = '/images/products/placeholder.svg'

function toPublicProduct(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    categoryId: row.category_id,
    sku: row.sku,
    price: row.price,
    description: row.description ?? '',
    shortDescription: row.short_description ?? '',
    image: row.image,
    images: row.images ?? [],
    stock: row.stock,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getProducts({ categoryId, search, includeInactive = false } = {}) {
  const conditions = []
  const params = []

  if (!includeInactive) {
    conditions.push('active = TRUE')
  }
  if (categoryId) {
    params.push(categoryId)
    conditions.push(`category_id = $${params.length}`)
  }
  if (search) {
    params.push(`%${search.trim()}%`)
    conditions.push(`name ILIKE $${params.length}`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const { rows } = await pool.query(`SELECT * FROM products ${where} ORDER BY id DESC`, params)
  return rows.map(toPublicProduct)
}

export async function getProductBySlug(slug) {
  const { rows } = await pool.query('SELECT * FROM products WHERE slug = $1', [slug])
  return rows[0] ? toPublicProduct(rows[0]) : null
}

export async function getProductById(id) {
  const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [id])
  return rows[0] ? toPublicProduct(rows[0]) : null
}

export async function getFeaturedProducts(limit = 8) {
  const { rows } = await pool.query('SELECT * FROM products WHERE active = TRUE ORDER BY id ASC LIMIT $1', [limit])
  return rows.map(toPublicProduct)
}

export async function getProductCountByCategory(categoryId) {
  const { rows } = await pool.query(
    'SELECT COUNT(*) FROM products WHERE category_id = $1 AND active = TRUE',
    [categoryId],
  )
  return Number(rows[0].count)
}

export async function getRelatedProducts(product, limit = 4) {
  const { rows } = await pool.query(
    `SELECT * FROM products
     WHERE category_id = $1 AND id != $2 AND active = TRUE
     ORDER BY id ASC LIMIT $3`,
    [product.categoryId, product.id, limit],
  )
  return rows.map(toPublicProduct)
}

export async function createProduct({
  name,
  categoryId,
  price,
  sku,
  stock,
  shortDescription,
  description,
  imageUrl,
}) {
  const trimmedName = name?.trim()
  if (!trimmedName) throw ApiError.badRequest('El nombre es obligatorio.')
  if (!categoryId) throw ApiError.badRequest('La categoría es obligatoria.')

  const { rows: idRows } = await pool.query(
    `INSERT INTO products (name, slug, category_id, sku, price, description, short_description, image, images, stock, active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)
     RETURNING id`,
    [
      trimmedName,
      `tmp-${crypto.randomUUID()}`,
      categoryId,
      sku?.trim() || `tmp-${crypto.randomUUID()}`,
      Number(price) || 0,
      description?.trim() || '',
      shortDescription?.trim() || '',
      imageUrl ?? PLACEHOLDER_IMAGE,
      JSON.stringify(imageUrl ? [imageUrl] : [PLACEHOLDER_IMAGE]),
      Number(stock) || 0,
    ],
  )
  const id = idRows[0].id
  const slug = slugify(`${trimmedName}-${id}`)
  const finalSku = sku?.trim() || `CUST-${String(id).padStart(4, '0')}`

  const { rows } = await pool.query(
    'UPDATE products SET slug = $1, sku = $2 WHERE id = $3 RETURNING *',
    [slug, finalSku, id],
  )
  return toPublicProduct(rows[0])
}

export async function updateProduct(id, updates) {
  const existing = await getProductById(id)
  if (!existing) throw ApiError.notFound('Producto no encontrado.')

  const fields = []
  const params = []

  function set(column, value) {
    params.push(value)
    fields.push(`${column} = $${params.length}`)
  }

  if ('name' in updates) set('name', updates.name.trim())
  if ('categoryId' in updates) set('category_id', updates.categoryId)
  if ('sku' in updates) set('sku', updates.sku.trim())
  if ('price' in updates) set('price', Number(updates.price))
  if ('stock' in updates) set('stock', Number(updates.stock))
  if ('description' in updates) set('description', updates.description.trim())
  if ('shortDescription' in updates) set('short_description', updates.shortDescription.trim())
  if ('active' in updates) set('active', Boolean(updates.active))
  if ('imageUrl' in updates && updates.imageUrl) {
    set('image', updates.imageUrl)
    set('images', JSON.stringify([updates.imageUrl]))
  }

  if (fields.length === 0) return existing

  set('updated_at', new Date().toISOString())
  params.push(id)
  const { rows } = await pool.query(
    `UPDATE products SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params,
  )
  return toPublicProduct(rows[0])
}

export async function deleteProduct(id) {
  try {
    const { rowCount } = await pool.query('DELETE FROM products WHERE id = $1', [id])
    if (rowCount === 0) throw ApiError.notFound('Producto no encontrado.')
  } catch (error) {
    if (error.code === '23503' || error.code === '23001') {
      throw ApiError.conflict('No se puede eliminar: el producto tiene pedidos asociados.')
    }
    throw error
  }
}
