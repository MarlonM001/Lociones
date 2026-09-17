import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useChat } from '@/hooks/useChat'
import { useAuth } from '@/hooks/useAuth'
import { useHideNearFooter } from '@/hooks/useHideNearFooter'
import { getAuctions } from '@/services/auctions'
import { formatCurrency } from '@/utils/formatCurrency'
import { Button } from '@/components/ui/Button'

function ChatIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M4 12a8 8 0 1 1 3.2 6.4L4 19.5l1.1-3.1A7.96 7.96 0 0 1 4 12Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 5l14 14M19 5L5 19" strokeLinecap="round" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 20V4l19 8Zm2-3 11.85-5L5 7v3.5l7 1.5-7 1.5Z" />
    </svg>
  )
}

function PinnedAuction({ auction }) {
  const image = auction.image || auction.items[0]?.product.image
  return (
    <Link
      to={`/subastas/${auction.slug}`}
      className="flex items-center gap-3 border-b border-gold/20 bg-gold/5 px-4 py-3 transition-colors hover:bg-gold/10"
    >
      <img src={image} alt="" className="h-11 w-11 rounded-lg bg-white object-contain object-center p-1" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-widest-plus text-gold">Subasta en curso</p>
        <p className="truncate text-sm text-ivory">{auction.title}</p>
      </div>
      <span className="shrink-0 font-display text-sm text-gold">{formatCurrency(auction.currentPrice)}</span>
    </Link>
  )
}

function IntakeForm({ onSubmit }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!name.trim() || !phone.trim()) return
    onSubmit(name.trim(), phone.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col justify-center gap-3 p-4">
      <p className="text-sm text-ivory-dim">
        Antes de chatear, cuéntanos quién eres para poder responderte mejor.
      </p>
      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Tu nombre"
        aria-label="Tu nombre"
        required
        className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-sm text-ivory placeholder:text-ivory-dim/50 focus:border-gold focus:outline-none"
      />
      <input
        type="tel"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        placeholder="Tu número de WhatsApp"
        aria-label="Tu número de WhatsApp"
        required
        className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-sm text-ivory placeholder:text-ivory-dim/50 focus:border-gold focus:outline-none"
      />
      <Button type="submit" variant="primary" size="sm">Empezar a chatear</Button>
    </form>
  )
}

function MessageBubble({ message }) {
  const isAdmin = message.senderRole === 'admin'
  return (
    <div className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
          isAdmin ? 'bg-ink text-ivory' : 'bg-gold text-on-gold'
        }`}
      >
        {message.body}
      </div>
    </div>
  )
}

export function ChatWidget() {
  const { open, setOpen, openChat, status, messages, submitIntake, sendMessage, retry } = useChat()
  const { user } = useAuth()
  const [draft, setDraft] = useState('')
  const [activeAuction, setActiveAuction] = useState(null)
  const scrollRef = useRef(null)
  const hideLauncher = useHideNearFooter()

  useEffect(() => {
    getAuctions()
      .then((auctions) => setActiveAuction(auctions.find((auction) => auction.phase === 'active') ?? null))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, open])

  const handleSend = (event) => {
    event.preventDefault()
    if (!draft.trim()) return
    sendMessage(draft)
    setDraft('')
  }

  return (
    <>
      <button
        type="button"
        aria-label={open ? 'Cerrar chat' : 'Abrir chat'}
        aria-expanded={open}
        aria-hidden={hideLauncher && !open}
        tabIndex={hideLauncher && !open ? -1 : undefined}
        onClick={() => (open ? setOpen(false) : openChat())}
        className={`fixed bottom-4 left-4 z-[150] flex h-12 w-12 items-center justify-center rounded-full bg-gold text-on-gold shadow-xl shadow-gold-dark/30 transition-all duration-200 hover:scale-110 hover:bg-gold-light sm:bottom-6 sm:left-6 sm:h-14 sm:w-14 ${
          hideLauncher && !open ? 'pointer-events-none translate-y-4 opacity-0' : 'opacity-100'
        }`}
      >
        <ChatIcon />
      </button>

      {open && (
        <div className="animate-fade-up fixed bottom-24 left-5 z-[150] flex h-[28rem] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-gold/20 bg-charcoal shadow-2xl shadow-black/50 sm:bottom-28 sm:left-6">
          <div className="flex items-center justify-between border-b border-ivory/5 px-4 py-3">
            <div>
              <h3 className="font-display text-base text-ivory">Chat con Essence Polar</h3>
              <p className="text-[11px] text-ivory-dim">
                {status === 'ready' && 'En línea'}
                {status === 'connecting' && 'Conectando...'}
                {status === 'error' && 'Sin conexión'}
                {status === 'needsIntake' && 'En línea'}
              </p>
            </div>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ivory-dim transition-colors hover:bg-ivory/5 hover:text-ivory"
            >
              <CloseIcon />
            </button>
          </div>

          {activeAuction && <PinnedAuction auction={activeAuction} />}

          {status === 'error' ? (
            <div className="m-auto flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-sm text-ivory-dim">
                No pudimos conectar con el chat. Revisa tu conexión e intenta de nuevo.
              </p>
              <Button type="button" variant="secondary" size="sm" onClick={retry}>
                Reintentar
              </Button>
            </div>
          ) : status === 'needsIntake' ? (
            <IntakeForm onSubmit={submitIntake} />
          ) : (
            <>
              <div ref={scrollRef} className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
                {status === 'connecting' && messages.length === 0 && (
                  <p className="m-auto text-sm text-ivory-dim">Conectando...</p>
                )}
                {status === 'ready' && messages.length === 0 && (
                  <p className="m-auto text-center text-sm text-ivory-dim">
                    {user ? `Hola ${user.name.split(' ')[0]}, ¿en qué te ayudamos?` : '¿En qué te podemos ayudar?'}
                  </p>
                )}
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>

              <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-ivory/5 p-3">
                <input
                  type="text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Escribe un mensaje..."
                  aria-label="Escribe un mensaje"
                  disabled={status !== 'ready'}
                  className="flex-1 rounded-full border border-ivory/10 bg-ink px-4 py-2 text-sm text-ivory placeholder:text-ivory-dim/50 focus:border-gold focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  aria-label="Enviar mensaje"
                  disabled={status !== 'ready' || !draft.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-on-gold transition-transform hover:scale-105 disabled:opacity-40"
                >
                  <SendIcon />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  )
}
