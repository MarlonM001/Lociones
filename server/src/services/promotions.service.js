import { pool, withTransaction } from '../db/pool.js'
import { ApiError } from '../utils/ApiError.js'

/**
 * Precio con descuento: el precio normal menos el porcentaje, redondeado a los 100 pesos más cercanos
 * (168.800 y no 168.799,8). Es la misma cuenta que muestra el panel en la vista previa.
 */
export function discountedPrice(regularPrice, percent) {
  return Math.round((regularPrice * (100 - percent)) / 100 / 100) * 100
}

function toPublicBanner(row) {
  return {
    enabled: row.enabled,
    message: row.message,
    linkLabel: row.link_label,
    linkTo: row.link_to,
    expiresAt: row.expires_at ? row.expires_at.toISOString().slice(0, 10) : '',
    // Producto en promoción y porcentaje (null si la franja es solo un mensaje).
    productId: row.product_id ?? null,
    discountPercent: row.discount_percent ?? null,
    product: row.product_id
      ? { id: row.product_id, name: row.product_name, slug: row.product_slug, image: row.product_image, regularPrice: row.product_price }
      : null,
  }
}

async function ensureBannerRow(db = pool) {
  await db.query('INSERT INTO promo_banner (id) VALUES (1) ON CONFLICT (id) DO NOTHING')
}

const SELECT_BANNER = `
  SELECT b.*, p.name AS product_name, p.slug AS product_slug, p.image AS product_image, p.price AS product_price
  FROM promo_banner b LEFT JOIN products p ON p.id = b.product_id
  WHERE b.id = 1`

export async function getPromoBanner(db = pool) {
  await ensureBannerRow(db)
  const { rows } = await db.query(SELECT_BANNER)
  return toPublicBanner(rows[0])
}

function parseOptionalInteger(value) {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) return null
  return Number(value)
}

/**
 * Guarda la franja y la deja sincronizada con el producto en promoción:
 *  - Si hay producto y porcentaje y la franja está encendida, ese producto pasa a costar el precio con
 *    descuento hasta la fecha "válido hasta" (o hasta que se quite).
 *  - Si se cambia de producto, se apaga la franja o se quita el descuento, el producto anterior vuelve a su
 *    precio normal (solo si la oferta la había puesto la franja: una oferta puesta a mano no se toca).
 * `client` permite ejecutarlo dentro de una transacción ajena (las pruebas lo usan para no dejar rastro).
 */
export async function savePromoBanner(input, { client } = {}) {
  const { enabled, message, linkLabel, linkTo, expiresAt } = input ?? {}
  const productId = parseOptionalInteger(input?.productId)
  const percent = parseOptionalInteger(input?.discountPercent)

  if (productId !== null && (!Number.isInteger(productId) || productId < 1)) {
    throw ApiError.badRequest('El producto elegido no es válido.')
  }
  if (percent !== null && (!Number.isInteger(percent) || percent < 1 || percent > 90)) {
    throw ApiError.badRequest('El descuento debe ser un número entero entre 1 y 90.')
  }
  if (productId !== null && percent === null) throw ApiError.badRequest('Escribe el porcentaje de descuento del producto.')
  if (percent !== null && productId === null) throw ApiError.badRequest('Elige el producto al que se aplica el descuento.')
  if (expiresAt && !/^\d{4}-\d{2}-\d{2}$/.test(String(expiresAt))) {
    throw ApiError.badRequest('La fecha de vencimiento no es válida.')
  }

  const run = async (db) => {
    await ensureBannerRow(db)
    const { rows: previous } = await db.query('SELECT product_id FROM promo_banner WHERE id = 1 FOR UPDATE')
    const previousProductId = previous[0]?.product_id ?? null
    const applies = Boolean(enabled) && productId !== null

    // 1) El producto anterior deja de estar en promoción (si la oferta la puso la franja).
    if (previousProductId !== null && (!applies || previousProductId !== productId)) {
      await db.query(
        `UPDATE products SET sale_price = NULL, sale_ends_at = NULL, sale_from_banner = FALSE, updated_at = NOW()
         WHERE id = $1 AND sale_from_banner = TRUE`,
        [previousProductId],
      )
    }

    // 2) El producto elegido recibe el descuento y la franja apunta a su página.
    let finalLink = linkTo?.trim() || ''
    if (productId !== null) {
      const { rows: products } = await db.query('SELECT id, slug, price FROM products WHERE id = $1 FOR UPDATE', [productId])
      if (!products[0]) throw ApiError.notFound('El producto elegido no existe.')
      finalLink = `/producto/${products[0].slug}`
      if (applies) {
        const salePrice = discountedPrice(products[0].price, percent)
        if (salePrice < 1 || salePrice >= products[0].price) {
          throw ApiError.badRequest('Ese descuento no cambia el precio del producto. Prueba con otro porcentaje.')
        }
        await db.query(
          `UPDATE products SET sale_price = $2, sale_ends_at = $3, sale_from_banner = TRUE, updated_at = NOW() WHERE id = $1`,
          [productId, salePrice, expiresAt || null],
        )
      }
    }

    await db.query(
      `UPDATE promo_banner
       SET enabled = $1, message = $2, link_label = $3, link_to = $4, expires_at = $5,
           product_id = $6, discount_percent = $7, updated_at = NOW()
       WHERE id = 1`,
      [Boolean(enabled), message?.trim() || '', linkLabel?.trim() || '', finalLink, expiresAt || null, productId, percent],
    )
    return getPromoBanner(db)
  }

  return client ? run(client) : withTransaction(run)
}
