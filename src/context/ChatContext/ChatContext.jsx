import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getChatSocket, getGuestId } from '@/services/chat/socket'

export const ChatContext = createContext(null)

/**
 * `status`:
 * - 'idle': el visitante no ha abierto el chat todavía (el socket ni se conecta).
 * - 'connecting': se mandó chat:init y se espera respuesta.
 * - 'needsIntake': es un invitado nuevo — hay que pedirle nombre y WhatsApp
 *   antes de dejarlo escribir, para poder darle seguimiento después.
 * - 'ready': puede chatear (con cuenta, o invitado que ya dio sus datos antes).
 */
export function ChatProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const socketRef = useRef(null)
  if (!socketRef.current) socketRef.current = getChatSocket()
  const socket = socketRef.current

  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('idle')
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const initializedRef = useRef(false)

  useEffect(() => {
    function handleMessage(message) {
      setMessages((current) => {
        if (current.some((existing) => existing.id === message.id)) return current
        return [...current, message]
      })
    }
    socket.on('chat:message', handleMessage)
    return () => socket.off('chat:message', handleMessage)
  }, [socket])

  const init = useCallback(
    (intake) => {
      setStatus('connecting')
      if (!socket.connected) socket.connect()
      socket.emit(
        'chat:init',
        { guestId: getGuestId(), name: intake?.name, phone: intake?.phone },
        (response) => {
          if (!response?.ok) {
            setStatus('idle')
            return
          }
          setConversation(response.conversation)
          setMessages(response.messages)
          const hasContact = isAuthenticated || Boolean(response.conversation.guestName)
          setStatus(hasContact ? 'ready' : 'needsIntake')
        },
      )
    },
    [socket, isAuthenticated],
  )

  const openChat = useCallback(() => {
    setOpen(true)
    if (!initializedRef.current) {
      initializedRef.current = true
      init()
    }
  }, [init])

  const submitIntake = useCallback(
    (name, phone) => {
      init({ name, phone })
    },
    [init],
  )

  const sendMessage = useCallback(
    (body) => {
      if (!conversation || !body.trim()) return
      socket.emit('chat:message', { conversationId: conversation.id, body }, () => {})
    },
    [socket, conversation],
  )

  const value = {
    open,
    setOpen,
    openChat,
    status,
    conversation,
    messages,
    submitIntake,
    sendMessage,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
