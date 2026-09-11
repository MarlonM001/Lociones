import { pool, withTransaction } from '../db/pool.js'
import { ApiError } from '../utils/ApiError.js'
import { ORDER_STATUSES, ORDER_STATUS_VALUES } from '../utils/orderStatuses.js'

function toPublicOrder(row, items) {
  return {
    id: row.id,
    userId: row.user_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    items: items.map((item) => ({
      productId: item.product_id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    })),
    subtotal: row.subtotal,
    shipping: row.shipping,
    total: row.total,
    city: row.city,
    address: row.address,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function attachItems(orderRows, db = pool) {
  if (orderRows.length === 0) return []
  const ids = orderRows.map((row) => row.id)
  const { rows: itemRows } = await db.query(
    `SELECT oi.*, p.name AS name
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

export async function createOrder(payload) {
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw ApiError.badRequest('El pedido debe tener al menos un producto.')
  }
  if (!payload.customerName?.trim() || !payload.customerPhone?.trim()) {
    throw ApiError.badRequest('Nombre y teléfono del cliente son obligatorios.')
  }
  if (!payload.city?.trim() || !payload.address?.trim()) {
    throw ApiError.badRequest('Ciudad y dirección son obligatorias.')
  }

  const items = payload.items.map((item) => ({
    productId: Number(item.productId),
    quantity: Number(item.quantity),
    price: Number(item.price),
    subtotal: Number(item.price) * Number(item.quantity),
  }))
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const shipping = Number(payload.shipping ?? 0)
  const total = subtotal + shipping

  return withTransaction(async (client) => {
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (user_id, customer_name, customer_phone, subtotal, shipping, total, city, address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        payload.userId ?? null,
        payload.customerName.trim(),
        payload.customerPhone.trim(),
        subtotal,
        shipping,
        total,
        payload.city.trim(),
        payload.address.trim(),
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
  const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC')
  return attachItems(rows)
}

export async function getOrdersByUser(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
    [userId],
  )
  return attachItems(rows)
}

export async function getOrderById(id) {
  const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id])
  if (!rows[0]) return null
  const [order] = await attachItems(rows)
  return order
}

export async function updateOrderStatus(id, status) {
  if (!ORDER_STATUS_VALUES.includes(status)) {
    throw ApiError.badRequest('Estado de pedido inválido.')
  }
  const { rows } = await pool.query(
    `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id],
  )
  if (!rows[0]) throw ApiError.notFound('Pedido no encontrado.')
  const [order] = await attachItems(rows)
  return order
}

export async function deleteOrder(id) {
  const { rowCount } = await pool.query('DELETE FROM orders WHERE id = $1', [id])
  if (rowCount === 0) throw ApiError.notFound('Pedido no encontrado.')
}
