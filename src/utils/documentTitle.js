const DEFAULT_TITLE = 'Essence Polar — Perfumería de Lujo'
const ALERT_TITLE = '🔔 ¡Nuevo pedido!'

let baseTitle = typeof document === 'undefined' ? DEFAULT_TITLE : document.title || DEFAULT_TITLE
let badge = { pending: 0, alert: false }
let flashVisible = false
let flashTimer = null

function render() {
  const counted = badge.pending > 0 ? `(${badge.pending}) ${baseTitle}` : baseTitle
  document.title = badge.alert && flashVisible ? ALERT_TITLE : counted
}

/**
 * El título de la pestaña lo comparten dos cosas: cada página (que pone su nombre) y el aviso de pedidos
 * nuevos del admin (que le antepone el número "(3)" o parpadea con una campana). Pasar por aquí evita que
 * se pisen: cuando la página cambia el título, el número de pedidos pendientes se conserva.
 */
export function setBaseTitle(title) {
  baseTitle = title || DEFAULT_TITLE
  render()
}

export function resetBaseTitle() {
  setBaseTitle(DEFAULT_TITLE)
}

/** `pending`: pedidos sin atender (0 = sin número). `alert`: parpadear avisando de un pedido nuevo. */
export function setTitleBadge({ pending = 0, alert = false } = {}) {
  badge = { pending, alert }
  clearInterval(flashTimer)
  flashTimer = null
  flashVisible = alert
  if (alert) {
    flashTimer = setInterval(() => {
      flashVisible = !flashVisible
      render()
    }, 1000)
  }
  render()
}

export { DEFAULT_TITLE }
