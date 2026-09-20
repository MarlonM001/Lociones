import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import * as chatService from '../services/chat.service.js'
import { createCounter, getClientIp } from '../middleware/rateLimit.js'

// Frenos contra quien intente llenar la bandeja del admin: por IP (conversaciones nuevas y mensajes) y por conexión.
const INIT_LIMIT = { windowMs: 10 * 60 * 1000, max: 20 }
const MESSAGE_LIMIT_PER_IP = { windowMs: 10 * 60 * 1000, max: 80 }
const MESSAGE_BURST = { windowMs: 60 * 1000, max: 15 }
const TOO_FAST = 'Estás escribiendo muy rápido. Espera un momento.'

/**
 * Chat en vivo. Un socket es "admin" (ve todo, se une a cada conversación que
 * abre) o "cliente" (con cuenta o invitado, solo ve/escribe en su propia
 * conversación). El id de conversación del cliente se guarda en
 * `socket.data.conversationId` tras `chat:init` y nunca se confía en lo que
 * mande el cliente para identificar a qué conversación pertenece un mensaje
 * — así un cliente no puede escribir en la conversación de otro.
 */
export function attachChatSocket(httpServer) {
  const allowedOrigins = (process.env.CORS_ORIGIN ?? '').split(',').map((origin) => origin.trim()).filter(Boolean)

  const io = new Server(httpServer, {
    cors: { origin: allowedOrigins.length ? allowedOrigins : false },
    // Un mensaje de chat son unos pocos cientos de bytes: lo demás es abuso.
    maxHttpBufferSize: 20_000,
  })

  const initsByIp = createCounter({ windowMs: INIT_LIMIT.windowMs })
  const messagesByIp = createCounter({ windowMs: MESSAGE_LIMIT_PER_IP.windowMs })

  io.on('connection', (socket) => {
    const { token, guestId } = socket.handshake.auth ?? {}
    const ip = getClientIp({ headers: socket.handshake.headers, socket: { remoteAddress: socket.handshake.address } })
    const recentMessages = []

    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
        socket.data.userId = payload.sub
        socket.data.isAdmin = payload.role === 'admin'
      } catch {
        // Token inválido: sigue como invitado.
      }
    }

    if (socket.data.isAdmin) {
      socket.join('admins')
    } else {
      socket.data.guestId = chatService.isValidGuestId(guestId) ? guestId : null
    }

    socket.on('chat:init', async ({ guestId: incomingGuestId, name, phone } = {}, ack) => {
      if (socket.data.isAdmin) return
      if (initsByIp.hit(ip) > INIT_LIMIT.max) return ack?.({ ok: false, error: TOO_FAST })
      try {
        const conversation = await chatService.findOrCreateConversation({
          userId: socket.data.userId ?? null,
          guestId: socket.data.userId ? null : (incomingGuestId || socket.data.guestId),
          guestName: name,
          guestPhone: phone,
        })
        socket.data.conversationId = conversation.id
        socket.join(`conversation:${conversation.id}`)
        const messages = await chatService.listMessages(conversation.id)
        ack?.({ ok: true, conversation, messages })
        io.to('admins').emit('chat:refresh')
      } catch (error) {
        ack?.({ ok: false, error: error.message })
      }
    })

    socket.on('chat:join', async ({ conversationId } = {}, ack) => {
      if (!socket.data.isAdmin) return
      try {
        socket.join(`conversation:${conversationId}`)
        await chatService.markConversationRead(conversationId)
        const messages = await chatService.listMessages(conversationId)
        ack?.({ ok: true, messages })
        io.to('admins').emit('chat:refresh')
      } catch (error) {
        ack?.({ ok: false, error: error.message })
      }
    })

    socket.on('chat:message', async ({ conversationId, body } = {}, ack) => {
      if (!socket.data.isAdmin) {
        const now = Date.now()
        while (recentMessages.length && now - recentMessages[0] > MESSAGE_BURST.windowMs) recentMessages.shift()
        if (recentMessages.length >= MESSAGE_BURST.max || messagesByIp.hit(ip) > MESSAGE_LIMIT_PER_IP.max) {
          return ack?.({ ok: false, error: TOO_FAST })
        }
        recentMessages.push(now)
      }
      try {
        const targetId = socket.data.isAdmin ? Number(conversationId) : socket.data.conversationId
        if (!targetId) throw new Error('No hay una conversación activa.')
        if (!socket.data.isAdmin && Number(conversationId) !== targetId) {
          throw new Error('No autorizado para esta conversación.')
        }

        const message = await chatService.addMessage({
          conversationId: targetId,
          senderRole: socket.data.isAdmin ? 'admin' : 'customer',
          body,
        })
        io.to(`conversation:${targetId}`).emit('chat:message', message)
        io.to('admins').emit('chat:refresh')
        ack?.({ ok: true, message })
      } catch (error) {
        ack?.({ ok: false, error: error.message })
      }
    })
  })

  return io
}
