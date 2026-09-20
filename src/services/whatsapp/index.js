import { WHATSAPP_BASE_URL } from '@/config/whatsapp'
import { STORE_CONFIG } from '@/config/store'
import { formatCurrency } from '@/utils/formatCurrency'

function formatOrderItemsBlock(items) {
  return items
    .map((item) => `- ${item.name} x${item.quantity}: ${formatCurrency(item.price * item.quantity)}`)
    .join('\n')
}

/**
 * Construye el texto del mensaje de WhatsApp a partir de un pedido ya creado
 * (misma forma que devuelve services/orders#createOrder). Está escrito desde
 * el cliente y pensado para cerrar la venta: resume el pedido (cliente,
 * productos, total y datos de entrega) y avisa que queda atento a concretarlo.
 */
export function buildWhatsAppMessage(order) {
  return [
    'Hola, quiero realizar el siguiente pedido:',
    '',
    `*Cliente:* ${order.customerName}`,
    `*Teléfono:* ${order.customerPhone}`,
    '',
    '*Productos:*',
    formatOrderItemsBlock(order.items),
    '',
    `*Total:* ${formatCurrency(order.total)}`,
    '',
    '*Entrega:*',
    order.city,
    order.neighborhood ? `Barrio: ${order.neighborhood}` : null,
    `Dirección: ${order.address}`,
    '',
    'Quedo atento(a) para cerrar la compra. ¡Gracias!',
  ]
    .filter((line) => line !== null)
    .join('\n')
}

export function buildWhatsAppLink(message) {
  return `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`
}

/**
 * Punto de entrada único: recibe un pedido y devuelve el enlace de WhatsApp
 * listo para abrir (window.open / <a href>).
 */
export function generateWhatsAppOrder(order) {
  const message = buildWhatsAppMessage(order)
  return buildWhatsAppLink(message)
}

/**
 * Enlace para los botones de contacto general (botón flotante y footer): abre
 * WhatsApp con un saludo ya escrito para que el cliente solo tenga que enviarlo.
 */
export function generateWhatsAppGeneralInquiry() {
  return buildWhatsAppLink('Hola, me gustaría recibir información sobre sus lociones.')
}

/**
 * Para el botón "Comprar por WhatsApp" en la página de producto, sin pasar
 * por el carrito/checkout completo.
 */
export function generateWhatsAppProductInquiry(product, quantity = 1) {
  const message = [
    'Hola, quiero comprar:',
    '',
    `- ${product.name}`,
    `  Cantidad: ${quantity}`,
    `  Precio: ${formatCurrency(product.price)}`,
    '',
    `Subtotal: ${formatCurrency(product.price * quantity)}`,
    '',
    '¿Me ayudas a confirmar disponibilidad y envío?',
  ].join('\n')

  return buildWhatsAppLink(message)
}

/**
 * Para que el admin escriba al cliente de un pedido. Los teléfonos se guardan
 * como los escribió el cliente (10 dígitos en Colombia), así que se les
 * antepone el indicativo 57 si hace falta. Devuelve null si no hay número usable.
 */
export function generateWhatsAppToCustomer(order) {
  const digits = String(order.customerPhone ?? '').replace(/\D/g, '')
  if (digits.length < 7) return null
  const international = digits.length === 10 ? `57${digits}` : digits
  const message = `Hola ${order.customerName}, te escribimos de ${STORE_CONFIG.name} sobre tu pedido #${order.id}.`
  return `https://wa.me/${international}?text=${encodeURIComponent(message)}`
}
