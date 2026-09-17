import { useEffect, useRef, useState } from 'react'
import { getChatConversationsAdmin, getChatSocket } from '@/services/chat'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  return new Date(isoString).toLocaleDateString('es-CO')
}

function ConversationRow({ conversation, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full flex-col gap-0.5 border-b border-ivory/5 px-4 py-3 text-left transition-colors ${
        active ? 'bg-gold/10' : 'hover:bg-ivory/5'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm text-ivory">{conversation.displayName}</span>
        {conversation.unreadCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-semibold text-on-gold">
            {conversation.unreadCount}
          </span>
        )}
      </div>
      <span className="truncate text-xs text-ivory-dim">{conversation.lastMessage || 'Sin mensajes'}</span>
      <span className="text-[10px] text-ivory-dim/70">{timeAgo(conversation.lastMessageAt)}</span>
    </button>
  )
}

function MessageBubble({ message }) {
  const isAdmin = message.senderRole === 'admin'
  return (
    <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${isAdmin ? 'bg-gold text-on-gold' : 'bg-ink text-ivory'}`}>
        {message.body}
      </div>
    </div>
  )
}

export function AdminChat() {
  const socketRef = useRef(null)
  if (!socketRef.current) socketRef.current = getChatSocket()
  const socket = socketRef.current

  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const scrollRef = useRef(null)
  const selectedIdRef = useRef(null)
  selectedIdRef.current = selectedId

  const loadConversations = () => {
    getChatConversationsAdmin().then((items) => {
      setConversations(items)
      setLoading(false)
    })
  }

  useEffect(() => {
    if (!socket.connected) socket.connect()
    loadConversations()

    function handleRefresh() {
      loadConversations()
    }
    function handleMessage(message) {
      if (message.conversationId === selectedIdRef.current) {
        setMessages((current) => {
          if (current.some((existing) => existing.id === message.id)) return current
          return [...current, message]
        })
      }
    }

    socket.on('chat:refresh', handleRefresh)
    socket.on('chat:message', handleMessage)
    return () => {
      socket.off('chat:refresh', handleRefresh)
      socket.off('chat:message', handleMessage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const handleSelect = (conversation) => {
    setSelectedId(conversation.id)
    setMessages([])
    socket.emit('chat:join', { conversationId: conversation.id }, (response) => {
      if (response?.ok) setMessages(response.messages)
    })
  }

  const handleSend = (event) => {
    event.preventDefault()
    if (!draft.trim() || !selectedId) return
    socket.emit('chat:message', { conversationId: selectedId, body: draft }, () => {})
    setDraft('')
  }

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedId)

  if (loading) return <Loading label="Cargando conversaciones..." />

  return (
    <div>
      <h1 className="font-display text-3xl text-ivory">Chat</h1>
      <p className="mt-1 text-sm text-ivory-dim">
        Conversaciones en vivo con clientes y visitantes de la tienda.
      </p>

      <div className="mt-6 flex h-[70vh] overflow-hidden rounded-2xl border border-ivory/5 bg-charcoal">
        <div className="w-72 shrink-0 overflow-y-auto border-r border-ivory/5">
          {conversations.length === 0 ? (
            <div className="p-4">
              <EmptyState title="Sin conversaciones" message="Aún nadie ha escrito por el chat de la tienda." />
            </div>
          ) : (
            conversations.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                active={conversation.id === selectedId}
                onClick={() => handleSelect(conversation)}
              />
            ))
          )}
        </div>

        <div className="flex flex-1 flex-col">
          {!selectedConversation ? (
            <div className="m-auto text-sm text-ivory-dim">Selecciona una conversación para ver los mensajes.</div>
          ) : (
            <>
              <div className="border-b border-ivory/5 px-4 py-3">
                <p className="text-sm text-ivory">{selectedConversation.displayName}</p>
                {selectedConversation.guestPhone && (
                  <p className="text-xs text-ivory-dim">{selectedConversation.guestPhone}</p>
                )}
              </div>

              <div ref={scrollRef} className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>

              <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-ivory/5 p-3">
                <input
                  type="text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Escribe una respuesta..."
                  aria-label="Escribe una respuesta"
                  className="flex-1 rounded-full border border-ivory/10 bg-ink px-4 py-2 text-sm text-ivory placeholder:text-ivory-dim/50 focus:border-gold focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-on-gold transition-transform hover:scale-105 disabled:opacity-40"
                >
                  Enviar
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
