import { pool, withTransaction } from '../db/pool.js'
import { ApiError } from '../utils/ApiError.js'
import { ORDER_STATUSES, ORDER_STATUS_VALUES } from '../utils/orderStatuses.js'
import { SALE_ACTIVE_SQL } from './products.service.js'

function toPublicOrder(row, items) {
  return {
    id: row.id,
    userId: row.user_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    marketingOptIn: row.marketing_opt_in,
    items: items.map((item) => ({
      productId: item.product_id,
      name: item.name,
      slug: item.slug,
      sku: item.sku,
      image: item.image,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    })),
    subtotal: row.subtotal,
    shipping: row.shipping,
    total: row.total,
    city: row.city,
    neighborhood: row.neighborhood,
    address: row.address,
    status: row.status,
    // Solo lo trae la consulta del panel admin (JOIN con users); para el resto queda en null.
    account: row.account_email
      ? { id: row.user_id, name: row.account_name, email: row.account_email, phone: row.account_phone }
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// Pedidos con los datos de la cuenta del cliente (si compró con sesión iniciada). Solo para el admin.
const ORDERS_WITH_ACCOUNT_SQL = `
  SELECT o.*, u.name AS account_name, u.email AS account_email, u.phone AS account_phone
  FROM orders o
  LEFT JOIN users u ON u.id = o.user_id`

async function attachItems(orderRows, db = pool) {
  if (orderRows.length === 0) return []
  const ids = orderRows.map((row) => row.id)
  const { rows: itemRows } = await db.query(
    `SELECT oi.*, p.name AS name, p.slug AS slug, p.sku AS sku, p.image AS image
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ANY($1)`,
    [ids],
  )
  const itemsByOrder = new Map()
  for (const item of itemRows) {
    if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, [])
    itemsByOrder.get(item.order_id).push(item)
  }
  return orderRows.map((row) => toPublicOrder(row, itemsByOrder.get(row.id) ?? []))
}

const MAX_LINES = 50
const MAX_QUANTITY_PER_LINE = 50
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const FIELD_LIMITS = { name: 120, phone: 20, email: 254, city: 100, neighborhood: 120, address: 300 }

function readText(value, label, { required = true, max } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw ApiError.badRequest(`${label} es obligatorio.`)
    return null
  }
  if (typeof value !== 'string') throw ApiError.badRequest(`${label} no es válido.`)
  const text = value.trim()
  if (!text) {
    if (required) throw ApiError.badRequest(`${label} es obligatorio.`)
    return null
  }
  if (text.length > max) throw ApiError.badRequest(`${label} es demasiado largo.`)
  return text
}

/**
 * Normaliza las líneas que manda el cliente: solo se toma de ellas el id del
 * producto y la cantidad (el precio y el nombre se ignoran a propósito, se
 * leen de la base de datos). Las líneas repetidas del mismo producto se suman.
 */
function normalizeRequestedLines(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw ApiError.badRequest('El pedido debe tener al menos un producto.')
  }
  if (rawItems.length > MAX_LINES) {
    throw ApiError.badRequest('El pedido tiene demasiados productos.')
  }

  const quantities = new Map()
  for (const raw of rawItems) {
    const productId = Number(raw?.productId)
    const quantity = Number(raw?.quantity)
    if (!Number.isInteger(productId) || productId <= 0) {
      throw ApiError.badRequest('Hay un producto inválido en el pedido.')
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw ApiError.badRequest('La cantidad de cada producto debe ser un número entero mayor que cero.')
    }
    quantities.set(productId, (quantities.get(productId) ?? 0) + quantity)
  }
  return [...quantities].map(([productId, quantity]) => ({ productId, quantity }))
}

/**
 * Arma las líneas del pedido con los precios reales del catálogo y verifica
 * que cada producto exista, esté activo y tenga stock suficiente.
 */
async function priceLinesFromCatalog(lines, db) {
  // FOR UPDATE: bloquea las filas hasta terminar la transacción, así dos pedidos a la vez
  // no pueden llevarse la misma última unidad. Ordenado por id para no crear bloqueos cruzados.
  const { rows } = await db.query(
    `SELECT id, name, price, sale_price, stock, active, ${SALE_ACTIVE_SQL} AS sale_active
     FROM products WHERE id = ANY($1) ORDER BY id FOR UPDATE`,
    [lines.map((line) => line.productId)],
  )
  const products = new Map(rows.map((row) => [row.id, row]))

  return lines.map(({ productId, quantity }) => {
    const product = products.get(productId)
    if (!product || !product.active) {
      throw ApiError.badRequest('Uno de los productos ya no está disponible. Actualiza tu carrito e intenta de nuevo.')
    }
    if (quantity > MAX_QUANTITY_PER_LINE) {
      throw ApiError.badRequest(`Máximo ${MAX_QUANTITY_PER_LINE} unidades por producto. Escríbenos por WhatsApp para pedidos al por mayor.`)
    }
    if (product.stock < quantity) {
      const message = product.stock > 0
        ? `Solo quedan ${product.stock} unidad(es) de ${product.name}.`
        : `${product.name} está agotado.`
      throw ApiError.badRequest(message)
    }
    // Se cobra el precio vigente del servidor (con oferta si hay una activa), nunca el que mande el cliente.
    const price = Number(product.sale_active ? product.sale_price : product.price)
    return { productId, quantity, price, subtotal: price * quantity }
  })
}

export async function createOrder(payload) {
  if (!payload || typeof payload !== 'object') {
    throw ApiError.badRequest('Pedido inválido.')
  }
  const lines = normalizeRequestedLines(payload.items)
  const customerName = readText(payload.customerName, 'El nombre', { max: FIELD_LIMITS.name })
  const customerPhone = readText(payload.customerPhone, 'El teléfono', { max: FIELD_LIMITS.phone })
  const city = readText(payload.city, 'La ciudad', { max: FIELD_LIMITS.city })
  const address = readText(payload.address, 'La dirección', { max: FIELD_LIMITS.address })
  const customerEmail = readText(payload.customerEmail, 'El correo', { max: FIELD_LIMITS.email })
  if (!EMAIL_PATTERN.test(customerEmail)) throw ApiError.badRequest('El correo no es válido.')
  const neighborhood = readText(payload.neighborhood, 'El barrio', { required: false, max: FIELD_LIMITS.neighborhood })

  return withTransaction(async (client) => {
    const items = await priceLinesFromCatalog(lines, client)
    for (const item of items) {
      const { rowCount } = await client.query(
        'UPDATE products SET stock = stock - $2, updated_at = NOW() WHERE id = $1 AND stock >= $2',
        [item.productId, item.quantity],
      )
      if (rowCount !== 1) {
        throw ApiError.badRequest('Uno de los productos se agotó mientras hacías el pedido. Actualiza tu carrito.')
      }
    }
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
    // El envío se acuerda por WhatsApp con cada cliente; el cliente no lo define.
    const shipping = 0
    const total = subtotal + shipping

    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (user_id, customer_name, customer_phone, customer_email, marketing_opt_in, subtotal, shipping, total, city, neighborhood, address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        payload.userId ?? null,
        customerName,
        customerPhone,
        customerEmail,
        Boolean(payload.marketingOptIn),
        subtotal,
        shipping,
        total,
        city,
        neighborhood,
        address,
        ORDER_STATUSES.PEDIDO_RECIBIDO,
      ],
    )
    const order = orderRows[0]

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.productId, item.quantity, item.price, item.subtotal],
      )
    }

    const [publicOrder] = await attachItems([order], client)
    return publicOrder
  })
}

export async function getOrders() {
  const { rows } = await pool.query(`${ORDERS_WITH_ACCOUNT_SQL} ORDER BY o.created_at DESC`)
  return attachItems(rows)
}

/**
 * Resumen liviano para el aviso del panel (se consulta cada minuto): cuántos
 * pedidos siguen sin atender y cuál es el más reciente. Usa el id y no el
 * conteo para detectar pedidos nuevos, porque el conteo también baja cuando
 * el admin despacha uno.
 */
export async function getPendingOrdersSummary() {
  const { rows } = await pool.query(
    `SELECT
       (SELECT COUNT(*)::int FROM orders WHERE status = $1) AS pending,
       latest.id AS latest_id, latest.customer_name, latest.total
     FROM (SELECT 1) AS one
     LEFT JOIN LATERAL (
       SELECT id, customer_name, total FROM orders ORDER BY id DESC LIMIT 1
     ) AS latest ON TRUE`,
    [ORDER_STATUSES.PEDIDO_RECIBIDO],
  )
  const row = rows[0]
  return {
    pending: row.pending,
    latest: row.latest_id ? { id: row.latest_id, customerName: row.customer_name, total: row.total } : null,
  }
}

export async function getOrdersByUser(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
    [userId],
  )
  return attachItems(rows)
}

export async function getOrderById(id) {
  const { rows } = await pool.query(`${ORDERS_WITH_ACCOUNT_SQL} WHERE o.id = $1`, [id])
  if (!rows[0]) return null
  const [order] = await attachItems(rows)
  return order
}

export async function updateOrderStatus(id, status) {
  if (!ORDER_STATUS_VALUES.includes(status)) {
    throw ApiError.badRequest('Estado de pedido inválido.')
  }

  return withTransaction(async (client) => {
    const { rows: current } = await client.query('SELECT status FROM orders WHERE id = $1 FOR UPDATE', [id])
    if (!current[0]) throw ApiError.notFound('Pedido no encontrado.')
    const previous = current[0].status

    if (previous === ORDER_STATUSES.CANCELADO && status !== ORDER_STATUSES.CANCELADO) {
      throw ApiError.conflict('Un pedido cancelado no se puede reactivar. Crea un pedido nuevo.')
    }
    if (previous !== ORDER_STATUSES.CANCELADO && status === ORDER_STATUSES.CANCELADO) {
      // Al cancelar, las unidades vuelven al inventario.
      await client.query(
        `UPDATE products p SET stock = p.stock + oi.quantity, updated_at = NOW()
         FROM order_items oi WHERE oi.order_id = $1 AND oi.product_id = p.id`,
        [id],
      )
    }

    const { rows } = await client.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id],
    )
    const [order] = await attachItems(rows, client)
    return order
  })
}

const TRACKING_NOT_FOUND = 'No encontramos un pedido con esos datos. Revisa el número y el teléfono.'

/**
 * Seguimiento para quien compró sin cuenta: número de pedido + el teléfono con el que lo hizo.
 * Devuelve solo lo necesario para ver el estado (nada de dirección, correo ni nombre).
 */
export async function getOrderTracking({ orderId, phone }) {
  const id = Number(orderId)
  const digits = String(phone ?? '').replace(/\D/g, '')
  if (!Number.isInteger(id) || id < 1 || digits.length < 7) {
    throw ApiError.badRequest('Escribe el número de pedido y el teléfono con el que lo hiciste.')
  }

  const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id])
  const orderDigits = String(rows[0]?.customer_phone ?? '').replace(/\D/g, '')
  // Se comparan los últimos 10 dígitos para que valga con o sin el indicativo del país.
  if (!rows[0] || orderDigits.length < 7 || orderDigits.slice(-10) !== digits.slice(-10)) {
    throw ApiError.notFound(TRACKING_NOT_FOUND)
  }

  const [order] = await attachItems(rows)
  return {
    id: order.id,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    total: order.total,
    city: order.city,
    items: order.items.map((item) => ({ name: item.name, quantity: item.quantity, image: item.image, slug: item.slug })),
  }
}

export async function deleteOrder(id) {
  const { rows } = await pool.query('SELECT status FROM orders WHERE id = $1', [id])
  if (!rows[0]) throw ApiError.notFound('Pedido no encontrado.')
  // Borrar un pedido vigente alteraría los reportes de ventas y dejaría el stock sin devolver:
  // primero se cancela, y solo los cancelados se pueden eliminar.
  if (rows[0].status !== ORDER_STATUSES.CANCELADO) {
    throw ApiError.conflict('Solo se pueden eliminar pedidos cancelados. Cancela el pedido primero.')
  }
  await pool.query('DELETE FROM orders WHERE id = $1', [id])
}
