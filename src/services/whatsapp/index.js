import { WHATSAPP_BASE_URL } from '@/config/whatsapp'
import { formatCurrency } from '@/utils/formatCurrency'

function formatOrderItemsBlock(items) {
  return items
    .map(
      (item) =>
        `- ${item.name}\n  Cantidad: ${item.quantity}\n  Precio: ${formatCurrency(item.price)}`,
    )
    .join('\n\n')
}

/**
 * Construye el texto del mensaje de WhatsApp a partir de un pedido ya creado
 * (misma forma que devuelve services/orders#createOrder).
 */
export function buildWhatsAppMessage(order) {
  return [
    'Hola, quiero realizar el siguiente pedido:',
    '',
    'Cliente:',
    order.customerName,
    '',
    'Productos:',
    '',
    formatOrderItemsBlock(order.items),
    '',
    `Total: ${formatCurrency(order.total)}`,
    '',
    'Ciudad de entrega:',
    order.city,
    '',
    'Dirección:',
    order.address,
    '',
    `Pedido No. ${order.id}`,
    '',
    'Gracias.',
  ].join('\n')
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
