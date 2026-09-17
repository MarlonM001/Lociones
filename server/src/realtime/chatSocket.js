import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import * as chatService from '../services/chat.service.js'

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
  })

  io.on('connection', (socket) => {
    const { token, guestId } = socket.handshake.auth ?? {}

    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        socket.data.userId = payload.sub
        socket.data.isAdmin = payload.role === 'admin'
      } catch {
        // Token inválido: sigue como invitado.
      }
    }

    if (socket.data.isAdmin) {
      socket.join('admins')
    } else {
      socket.data.guestId = guestId ?? null
    }

    socket.on('chat:init', async ({ guestId: incomingGuestId, name, phone } = {}, ack) => {
      if (socket.data.isAdmin) return
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
