import { ORDER_STATUSES } from './statuses'

/**
 * Capa de pedidos. Hoy persiste en localStorage con la misma forma que las
 * tablas `orders` + `order_items` (ver docs/DATABASE_SCHEMA.sql), para que
 * conectar un backend real después sea reemplazar el storage por fetch().
 */
const STORAGE_KEY = 'essence_orders'
const SIMULATED_LATENCY_MS = 200

function delay(ms = SIMULATED_LATENCY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeOrders(orders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
}

function nextOrderId(orders) {
  return orders.reduce((max, order) => Math.max(max, order.id), 0) + 1
}

/**
 * @param {object} payload
 * @param {{ productId: number, name: string, quantity: number, price: number }[]} payload.items
 * @param {string} payload.customerName
 * @param {string} payload.customerPhone
 * @param {string} payload.city
 * @param {string} payload.address
 */
export async function createOrder(payload) {
  await delay()

  const items = payload.items.map((item) => ({
    productId: item.productId,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.price * item.quantity,
  }))

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const shipping = payload.shipping ?? 0
  const total = subtotal + shipping

  const orders = readOrders()
  const now = new Date().toISOString()

  const order = {
    id: nextOrderId(orders),
    userId: payload.userId ?? null,
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    items,
    subtotal,
    shipping,
    total,
    city: payload.city,
    address: payload.address,
    status: ORDER_STATUSES.PEDIDO_RECIBIDO,
    createdAt: now,
    updatedAt: now,
  }

  writeOrders([...orders, order])
  return order
}

export async function getOrders() {
  await delay()
  return readOrders()
}

export async function getOrdersByUser(userId) {
  await delay()
  return readOrders()
    .filter((order) => order.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function getOrderById(id) {
  await delay()
  return readOrders().find((order) => order.id === Number(id)) ?? null
}

export async function updateOrderStatus(id, status) {
  await delay()
  const orders = readOrders()
  const updated = orders.map((order) =>
    order.id === Number(id) ? { ...order, status, updatedAt: new Date().toISOString() } : order,
  )
  writeOrders(updated)
  return updated.find((order) => order.id === Number(id)) ?? null
}

export async function deleteOrder(id) {
  await delay()
  writeOrders(readOrders().filter((order) => order.id !== Number(id)))
}
