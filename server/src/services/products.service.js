import crypto from 'node:crypto'
import { pool } from '../db/pool.js'
import { ApiError } from '../utils/ApiError.js'
import { slugify } from '../utils/slugify.js'

const PLACEHOLDER_IMAGE = '/images/products/placeholder.svg'

const MAX_MONEY = 100_000_000
const MAX_STOCK = 100_000
const MAX_TEXT = { name: 150, sku: 40, shortDescription: 300, description: 4000 }

/**
 * ¿Hay una oferta vigente? Hay precio en oferta y no venció (la fecha es el último día
 * inclusive, en hora de Colombia). Es SQL para que el pedido y el catálogo usen la misma regla.
 */
export const SALE_ACTIVE_SQL = `(sale_price IS NOT NULL AND (sale_ends_at IS NULL OR sale_ends_at >= (NOW() AT TIME ZONE 'America/Bogota')::date))`

const PRODUCT_COLUMNS = `*, ${SALE_ACTIVE_SQL} AS sale_active, to_char(sale_ends_at, 'YYYY-MM-DD') AS sale_ends_on`

/**
 * `price` es siempre el precio que se cobra hoy (el de oferta si hay una vigente), así que todo
 * lo que ya leía `price` sigue funcionando. `regularPrice` es el normal y `onSale` avisa si hay oferta.
 */
function toPublicProduct(row) {
  const onSale = Boolean(row.sale_active)
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    categoryId: row.category_id,
    sku: row.sku,
    price: onSale ? row.sale_price : row.price,
    regularPrice: row.price,
    salePrice: row.sale_price ?? null,
    saleEndsOn: row.sale_ends_on ?? null,
    onSale,
    // true si la oferta la puso la franja de Promociones (y se quita sola al cambiar de promoción).
    saleFromBanner: Boolean(row.sale_from_banner),
    description: row.description ?? '',
    shortDescription: row.short_description ?? '',
    image: row.image,
    images: row.images ?? [],
    stock: row.stock,
    active: row.active,
    isBestseller: row.is_bestseller,
    bestsellerRank: row.bestseller_rank,
    bestsellerImage: row.bestseller_image,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toInteger(value, label, { min = 0, max = MAX_MONEY } = {}) {
  const isBlank = value === undefined || value === null || (typeof value === 'string' && value.trim() === '')
  const number = isBlank ? Number.NaN : Number(value)
  if (!Number.isInteger(number) || number < min || number > max) {
    throw ApiError.badRequest(`${label} no es válido.`)
  }
  return number
}

function toText(value, label, max) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (text.length > max) throw ApiError.badRequest(`${label} es demasiado largo (máximo ${max} caracteres).`)
  return text
}

function isBlank(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '')
}

function toSaleEndDate(value) {
  const text = String(value).trim()
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(Date.parse(`${text}T00:00:00Z`))
  if (!valid) throw ApiError.badRequest('La fecha de la oferta no es válida.')
  return text
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
  const { rows } = await pool.query(`SELECT ${PRODUCT_COLUMNS} FROM products ${where} ORDER BY id DESC`, params)
  return rows.map(toPublicProduct)
}

export async function getProductBySlug(slug, { includeInactive = false } = {}) {
  const { rows } = await pool.query(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE slug = $1`, [slug])
  if (!rows[0] || (!rows[0].active && !includeInactive)) return null
  return toPublicProduct(rows[0])
}

export async function getProductById(id) {
  const { rows } = await pool.query(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = $1`, [id])
  return rows[0] ? toPublicProduct(rows[0]) : null
}

/** Precio vigente, stock y estado de varios productos a la vez (para refrescar el carrito). */
export async function getProductPrices(ids) {
  const cleanIds = [...new Set(ids)].filter((id) => Number.isInteger(id) && id > 0).slice(0, 50)
  if (cleanIds.length === 0) return []
  const { rows } = await pool.query(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = ANY($1)`, [cleanIds])
  return rows.map(toPublicProduct).map((product) => ({
    id: product.id,
    price: product.price,
    regularPrice: product.regularPrice,
    onSale: product.onSale,
    stock: product.stock,
    active: product.active,
  }))
}

export async function getFeaturedProducts(limit = 8) {
  const { rows } = await pool.query(
    `SELECT ${PRODUCT_COLUMNS} FROM products WHERE active = TRUE ORDER BY id ASC LIMIT $1`,
    [limit],
  )
  return rows.map(toPublicProduct)
}

export async function getBestsellerProducts(limit = 8) {
  const { rows } = await pool.query(
    `SELECT ${PRODUCT_COLUMNS} FROM products
     WHERE active = TRUE AND is_bestseller = TRUE
     ORDER BY bestseller_rank ASC NULLS LAST, id ASC
     LIMIT $1`,
    [limit],
  )
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
    `SELECT ${PRODUCT_COLUMNS} FROM products
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
  isBestseller,
  bestsellerRank,
  bestsellerImageUrl,
}) {
  const trimmedName = toText(name, 'El nombre', MAX_TEXT.name)
  if (!trimmedName) throw ApiError.badRequest('El nombre es obligatorio.')
  if (!categoryId) throw ApiError.badRequest('La categoría es obligatoria.')
  const finalPrice = toInteger(price, 'El precio', { min: 1 })
  const finalStock = isBlank(stock) ? 0 : toInteger(stock, 'El stock', { max: MAX_STOCK })
  const trimmedSku = toText(sku, 'El SKU', MAX_TEXT.sku)

  const { rows: idRows } = await pool.query(
    `INSERT INTO products (name, slug, category_id, sku, price, description, short_description, image, images, stock, active, is_bestseller, bestseller_rank, bestseller_image)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, $11, $12, $13)
     RETURNING id`,
    [
      trimmedName,
      `tmp-${crypto.randomUUID()}`,
      categoryId,
      trimmedSku || `tmp-${crypto.randomUUID()}`,
      finalPrice,
      toText(description, 'La descripción', MAX_TEXT.description),
      toText(shortDescription, 'La descripción corta', MAX_TEXT.shortDescription),
      imageUrl ?? PLACEHOLDER_IMAGE,
      JSON.stringify(imageUrl ? [imageUrl] : [PLACEHOLDER_IMAGE]),
      finalStock,
      Boolean(isBestseller),
      bestsellerRank ? toInteger(bestsellerRank, 'La posición en top ventas', { min: 1, max: 1000 }) : null,
      bestsellerImageUrl ?? null,
    ],
  )
  const id = idRows[0].id
  const slug = slugify(`${trimmedName}-${id}`)
  const finalSku = trimmedSku || `CUST-${String(id).padStart(4, '0')}`

  const { rows } = await pool.query(
    `UPDATE products SET slug = $1, sku = $2 WHERE id = $3 RETURNING ${PRODUCT_COLUMNS}`,
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

  if ('name' in updates) {
    const name = toText(updates.name, 'El nombre', MAX_TEXT.name)
    if (!name) throw ApiError.badRequest('El nombre es obligatorio.')
    set('name', name)
  }
  if ('categoryId' in updates) set('category_id', updates.categoryId)
  if ('sku' in updates) set('sku', toText(updates.sku, 'El SKU', MAX_TEXT.sku))
  if ('stock' in updates) set('stock', toInteger(updates.stock, 'El stock', { max: MAX_STOCK }))
  if ('description' in updates) set('description', toText(updates.description, 'La descripción', MAX_TEXT.description))
  if ('shortDescription' in updates) {
    set('short_description', toText(updates.shortDescription, 'La descripción corta', MAX_TEXT.shortDescription))
  }
  if ('active' in updates) set('active', Boolean(updates.active))

  // Precio normal y oferta se validan juntos: la oferta siempre debe quedar por debajo del precio normal.
  const regularPrice = 'price' in updates ? toInteger(updates.price, 'El precio', { min: 1 }) : existing.regularPrice
  if ('price' in updates) set('price', regularPrice)

  let salePrice = existing.salePrice
  let saleEndsOn = existing.saleEndsOn
  if ('salePrice' in updates) {
    if (isBlank(updates.salePrice)) {
      salePrice = null
      saleEndsOn = null
    } else {
      salePrice = toInteger(updates.salePrice, 'El precio en oferta', { min: 1 })
    }
  }
  if (salePrice !== null && 'saleEndsOn' in updates) {
    saleEndsOn = isBlank(updates.saleEndsOn) ? null : toSaleEndDate(updates.saleEndsOn)
  }
  if (salePrice !== null && salePrice >= regularPrice) {
    throw ApiError.badRequest('El precio en oferta debe ser menor al precio normal. Quita la oferta o ajusta los precios.')
  }
  if ('price' in updates || 'salePrice' in updates || 'saleEndsOn' in updates) {
    set('sale_price', salePrice)
    set('sale_ends_at', saleEndsOn)
    // Si el admin cambia la oferta a mano, deja de ser "de la franja" y esta ya no la quita sola.
    // (El formulario manda siempre estos campos, así que solo cuenta si de verdad cambiaron.)
    if (salePrice !== existing.salePrice || saleEndsOn !== existing.saleEndsOn) set('sale_from_banner', false)
  }

  if ('imageUrl' in updates && updates.imageUrl) {
    set('image', updates.imageUrl)
    // Preserva un segundo ángulo real existente (ver server/scripts/fix-product-image-galleries.js)
    // en vez de perderlo cada vez que se actualiza solo la foto principal.
    const existingSecondImage = existing.images?.[1]
    set('images', JSON.stringify(existingSecondImage ? [updates.imageUrl, existingSecondImage] : [updates.imageUrl]))
  }
  if ('isBestseller' in updates) set('is_bestseller', Boolean(updates.isBestseller))
  if ('bestsellerRank' in updates) {
    set(
      'bestseller_rank',
      isBlank(updates.bestsellerRank)
        ? null
        : toInteger(updates.bestsellerRank, 'La posición en top ventas', { min: 1, max: 1000 }),
    )
  }
  if ('bestsellerImageUrl' in updates && updates.bestsellerImageUrl) {
    set('bestseller_image', updates.bestsellerImageUrl)
  }

  if (fields.length === 0) return existing

  set('updated_at', new Date().toISOString())
  params.push(id)
  const { rows } = await pool.query(
    `UPDATE products SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING ${PRODUCT_COLUMNS}`,
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
