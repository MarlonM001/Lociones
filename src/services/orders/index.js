import { apiFetch } from '../api/client'

/**
 * Capa de pedidos. Habla con la API real (`server/`). El backend resuelve
 * el usuario dueño del pedido a partir del JWT, no hace falta mandarlo en
 * la URL para `getOrdersByUser`.
 */

export async function createOrder(payload) {
  return apiFetch('/api/orders', { method: 'POST', body: payload })
}

export async function getOrders() {
  return apiFetch('/api/orders')
}

export async function getOrdersByUser() {
  return apiFetch('/api/orders/mine')
}

export async function getOrderById(id) {
  return apiFetch(`/api/orders/${id}`)
}

export async function updateOrderStatus(id, status) {
  return apiFetch(`/api/orders/${id}/status`, { method: 'PATCH', body: { status } })
}

export async function deleteOrder(id) {
  await apiFetch(`/api/orders/${id}`, { method: 'DELETE' })
}
