import { io } from 'socket.io-client'
import { getToken } from '../api/client'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

let socket = null

/**
 * Instancia única del socket para toda la pestaña (la sala de subasta y el panel de admin). No se
 * desconecta al desmontar componentes: solo se agregan/quitan listeners puntuales.
 */
export function getRealtimeSocket() {
  if (socket) return socket
  socket = io(API_BASE_URL, {
    autoConnect: false,
    auth: { token: getToken() },
  })
  return socket
}
