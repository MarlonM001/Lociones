import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getChatSocket, getGuestId } from '@/services/chat/socket'

export const ChatContext = createContext(null)

const INIT_TIMEOUT_MS = 8000

/**
 * `status`:
 * - 'idle': el visitante no ha abierto el chat todavía (el socket ni se conecta).
 * - 'connecting': se mandó chat:init y se espera respuesta.
 * - 'needsIntake': es un invitado nuevo — hay que pedirle nombre y WhatsApp
 *   antes de dejarlo escribir, para poder darle seguimiento después.
 * - 'ready': puede chatear (con cuenta, o invitado que ya dio sus datos antes).
 * - 'error': el servidor no respondió a tiempo (o el socket no pudo conectar) —
 *   antes esto dejaba el widget en "Conectando..." para siempre sin forma de
 *   reintentar.
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
  const lastIntakeRef = useRef(undefined)
  const timeoutRef = useRef(null)

  useEffect(() => {
    function handleMessage(message) {
      setMessages((current) => {
        if (current.some((existing) => existing.id === message.id)) return current
        return [...current, message]
      })
    }
    function handleConnectError() {
      setStatus((current) => (current === 'connecting' ? 'error' : current))
    }
    socket.on('chat:message', handleMessage)
    socket.on('connect_error', handleConnectError)
    return () => {
      socket.off('chat:message', handleMessage)
      socket.off('connect_error', handleConnectError)
    }
  }, [socket])

  const init = useCallback(
    (intake) => {
      lastIntakeRef.current = intake
      setStatus('connecting')
      if (!socket.connected) socket.connect()

      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setStatus((current) => (current === 'connecting' ? 'error' : current))
      }, INIT_TIMEOUT_MS)

      socket.emit(
        'chat:init',
        { guestId: getGuestId(), name: intake?.name, phone: intake?.phone },
        (response) => {
          clearTimeout(timeoutRef.current)
          if (!response?.ok) {
            setStatus('error')
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

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const openChat = useCallback(() => {
    setOpen(true)
    if (!initializedRef.current) {
      initializedRef.current = true
      init()
    }
  }, [init])

  const retry = useCallback(() => {
    init(lastIntakeRef.current)
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
    retry,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
