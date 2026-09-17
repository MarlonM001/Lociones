import { io } from 'socket.io-client'
import { getToken } from '../api/client'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'
const GUEST_ID_KEY = 'essence_chat_guest_id'

export function getGuestId() {
  let id = localStorage.getItem(GUEST_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(GUEST_ID_KEY, id)
  }
  return id
}

let socket = null

/**
 * Instancia única del socket para toda la pestaña. No se desconecta al
 * desmontar componentes (React StrictMode monta/desmonta dos veces en dev) —
 * solo se agregan/quitan listeners puntuales, para que la conversación
 * persista mientras el visitante navega entre páginas.
 */
export function getChatSocket() {
  if (socket) return socket
  socket = io(API_BASE_URL, {
    autoConnect: false,
    auth: { token: getToken(), guestId: getGuestId() },
  })
  return socket
}
