import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getAuctions, getAuctionFeed, getAuctionComments, postAuctionComment } from '@/services/auctions'
import { useAuth } from '@/hooks/useAuth'
import { useCountdown } from '@/hooks/useCountdown'
import { useHideNearFooter } from '@/hooks/useHideNearFooter'
import { Button } from '@/components/ui/Button'
import { Price } from '@/components/ui/Price'

/** Cada cuánto se revisa si hay (o dejó de haber) una subasta activa mientras el sitio sigue abierto. */
const AUCTION_POLL_MS = 60000
/** Con la sala abierta se refresca más seguido: pujas, comentarios y precio casi al instante. */
const ROOM_POLL_MS = 4000
const MAX_COMMENT_LENGTH = 300
const KEEP_BIDS = 30
const KEEP_COMMENTS = 50

function GavelIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m14 13-8.381 8.38a1 1 0 0 1-3.001-3L11 9.999" />
      <path d="M15.973 4.027A13 13 0 0 0 5.902 2.373c-1.398.342-1.092 2.158.277 2.601a19.9 19.9 0 0 1 5.822 3.024" />
      <path d="M16.001 11.999a19.9 19.9 0 0 1 3.024 5.824c.444 1.369 2.26 1.676 2.603.278A13 13 0 0 0 20 8.069" />
      <path d="M18.352 3.352a1.205 1.205 0 0 0-1.704 0l-5.296 5.296a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l5.296-5.296a1.205 1.205 0 0 0 0-1.704z" />
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

function pad(n) {
  return String(n).padStart(2, '0')
}

function Countdown({ endsAt }) {
  const { days, hours, minutes, seconds, isOver } = useCountdown(endsAt)
  if (isOver) return <span className="text-ivory-dim">Cerrando...</span>
  return (
    <span className="tabular-nums text-ivory">
      {days > 0 && `${days}d `}
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  )
}

function timeAgo(isoDate, now) {
  const seconds = Math.max(0, Math.floor((now - new Date(isoDate).getTime()) / 1000))
  if (seconds < 45) return 'ahora'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  return new Date(isoDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

function BidRow({ bid, isTop, now }) {
  return (
    <li
      className={`animate-fade-up flex items-center gap-3 rounded-xl px-3 py-2 ${
        isTop ? 'border border-gold/30 bg-gold/10' : 'bg-ink'
      }`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-charcoal text-xs font-medium uppercase text-gold">
        {bid.bidder[0]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ivory">{bid.bidder}</p>
        <p className="text-xs text-ivory-dim">
          {isTop ? 'Va ganando · ' : ''}
          {timeAgo(bid.createdAt, now)}
        </p>
      </div>
      <Price value={bid.amount} className={`text-sm ${isTop ? 'text-gold' : 'text-ivory'}`} />
    </li>
  )
}

function CommentRow({ comment, now }) {
  return (
    <li
      className={`animate-fade-up rounded-xl px-3 py-2 ${
        comment.isAdmin ? 'border border-gold/30 bg-gold/10' : 'bg-ink'
      }`}
    >
      <p className="flex items-center gap-2 text-xs">
        <span className={`font-medium ${comment.isAdmin ? 'text-gold' : 'text-ivory'}`}>{comment.author}</span>
        <span className="text-ivory-dim">{timeAgo(comment.createdAt, now)}</span>
      </p>
      <p className="mt-0.5 break-words text-sm text-ivory">{comment.body}</p>
    </li>
  )
}

function TabButton({ active, onClick, children, dot }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex-1 border-b-2 px-3 py-2 text-xs uppercase tracking-widest-plus transition-colors ${
        active ? 'border-gold text-gold' : 'border-transparent text-ivory-dim hover:text-ivory'
      }`}
    >
      {children}
      {dot && <span className="absolute right-4 top-2 h-2 w-2 rounded-full bg-emerald-500" />}
    </button>
  )
}

/**
 * Sala de la subasta en vivo (botón flotante). Solo aparece cuando hay una subasta en curso. Muestra el
 * producto que se subasta, la puja actual, cuánto falta para que cierre, las pujas de los demás
 * participantes y los comentarios, todo en el momento en que ocurre. Para pujar se va a la página de la
 * subasta; para comentar hace falta tener sesión iniciada.
 */
export function AuctionRoom() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [auctions, setAuctions] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [tab, setTab] = useState('bids')
  const [feed, setFeed] = useState([])
  const [comments, setComments] = useState([])
  const [unreadComments, setUnreadComments] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [commentError, setCommentError] = useState(null)
  const [connection, setConnection] = useState('connecting')
  const [now, setNow] = useState(() => Date.now())
  const hideLauncher = useHideNearFooter()
  const commentsEndRef = useRef(null)
  const tabRef = useRef(tab)
  tabRef.current = tab

  useEffect(() => {
    let cancelled = false
    const refresh = () => {
      getAuctions()
        .then((all) => {
          if (!cancelled) setAuctions(all.filter((auction) => auction.phase === 'active'))
        })
        .catch(() => {})
    }
    refresh()
    const interval = setInterval(refresh, AUCTION_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const selected = auctions.find((auction) => auction.id === selectedId) ?? auctions[0]
  const activeId = selected?.id

  useEffect(() => {
    if (!open) return undefined
    const interval = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(interval)
  }, [open])

  useEffect(() => {
    if (!open || !activeId) return undefined
    let cancelled = false

    const loadFeed = () => {
      getAuctionFeed(activeId)
        .then((bids) => {
          if (!cancelled) setFeed(bids.slice(0, KEEP_BIDS))
        })
        .catch(() => {})
    }
    const loadComments = () => {
      getAuctionComments(activeId)
        .then((items) => {
          if (cancelled) return
          const sorted = items.slice().reverse().slice(-KEEP_COMMENTS)
          setComments((current) => {
            if (sorted.length > current.length && tabRef.current !== 'comments') setUnreadComments(true)
            return sorted
          })
        })
        .catch(() => {})
    }
    // El precio/conteo de la subasta activa se refresca junto con la sala, más seguido que el poll de fondo.
    const loadAuctions = () => {
      getAuctions()
        .then((all) => {
          if (!cancelled) setAuctions(all.filter((auction) => auction.phase === 'active'))
        })
        .catch(() => {})
    }

    setFeed([])
    setComments([])
    setConnection('connecting')
    loadFeed()
    loadComments()
    setConnection('live')

    const interval = setInterval(() => {
      loadFeed()
      loadComments()
      loadAuctions()
    }, ROOM_POLL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [open, activeId])

  useEffect(() => {
    if (open && tab === 'comments') commentsEndRef.current?.scrollIntoView({ block: 'end' })
  }, [open, tab, comments])

  const showTab = (next) => {
    setTab(next)
    if (next === 'comments') setUnreadComments(false)
  }

  const handleSendComment = async (event) => {
    event.preventDefault()
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    setCommentError(null)
    try {
      const comment = await postAuctionComment(activeId, body)
      setDraft('')
      setComments((current) =>
        current.some((existing) => existing.id === comment.id) ? current : [...current, comment].slice(-KEEP_COMMENTS),
      )
    } catch (error) {
      setCommentError(error.message)
    } finally {
      setSending(false)
    }
  }

  // Sin una subasta en curso no se muestra. El contacto general va por el botón de WhatsApp (siempre visible).
  if (!selected) return null

  const image = selected.image || selected.items[0]?.product.image

  return (
    <>
      <button
        type="button"
        aria-label={open ? 'Cerrar la sala de subasta' : 'Abrir la sala de subasta en vivo'}
        aria-expanded={open}
        aria-hidden={hideLauncher && !open}
        tabIndex={hideLauncher && !open ? -1 : undefined}
        onClick={() => setOpen((current) => !current)}
        className={`fixed bottom-4 left-4 z-[150] flex h-12 w-12 items-center justify-center rounded-full bg-gold text-on-gold shadow-xl shadow-gold-dark/30 transition-all duration-200 hover:scale-110 hover:bg-gold-hover sm:bottom-6 sm:left-6 sm:h-14 sm:w-14 ${
          hideLauncher && !open ? 'pointer-events-none translate-y-4 opacity-0' : 'opacity-100'
        }`}
      >
        <GavelIcon />
        {!open && (
          <span className="absolute right-0 top-0 h-3 w-3 animate-pulse rounded-full border-2 border-charcoal bg-emerald-500" />
        )}
      </button>

      {open && (
        <div className="animate-fade-up fixed bottom-24 left-5 z-[150] flex h-[34rem] max-h-[calc(100dvh-8rem)] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-gold/20 bg-charcoal shadow-2xl shadow-black/50 sm:bottom-28 sm:left-6">
          <div className="flex items-center justify-between border-b border-ivory/5 px-4 py-3">
            <div>
              <h3 className="font-display text-base text-ivory">Subasta en vivo</h3>
              <p className="flex items-center gap-1.5 text-xs text-ivory-dim">
                <span
                  className={`h-2 w-2 rounded-full ${
                    connection === 'live' ? 'bg-emerald-500' : connection === 'offline' ? 'bg-red-500' : 'animate-pulse bg-gold'
                  }`}
                />
                {connection === 'live' && 'En vivo'}
                {connection === 'connecting' && 'Conectando...'}
                {connection === 'offline' && 'Reconectando...'}
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

          {auctions.length > 1 && (
            <div className="flex gap-2 overflow-x-auto border-b border-ivory/5 px-4 py-2">
              {auctions.map((auction) => (
                <button
                  key={auction.id}
                  type="button"
                  onClick={() => setSelectedId(auction.id)}
                  className={`max-w-[10rem] shrink-0 truncate rounded-full border px-3 py-1 text-xs transition-colors ${
                    auction.id === activeId ? 'border-gold bg-gold/10 text-gold' : 'border-ivory/10 text-ivory-dim hover:text-ivory'
                  }`}
                >
                  {auction.title}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 border-b border-ivory/5 px-4 py-3">
            {image && (
              <img src={image} alt="" loading="lazy" decoding="async" className="h-16 w-16 shrink-0 rounded-lg bg-white object-contain object-center p-1" />
            )}
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm text-ivory">{selected.title}</p>
              <p className="mt-1 text-xs text-ivory-dim">{selected.bidCount > 0 ? 'Puja actual' : 'Precio inicial'}</p>
              <Price value={selected.currentPrice} className="text-xl text-gold" />
            </div>
            <div className="shrink-0 text-right text-xs text-ivory-dim">
              <p>Cierra en</p>
              <Countdown endsAt={selected.endsAt} />
            </div>
          </div>

          <div className="flex border-b border-ivory/5">
            <TabButton active={tab === 'bids'} onClick={() => showTab('bids')}>
              Pujas
            </TabButton>
            <TabButton active={tab === 'comments'} onClick={() => showTab('comments')} dot={unreadComments}>
              Comentarios
            </TabButton>
          </div>

          {tab === 'bids' ? (
            <>
              <ul aria-live="polite" className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
                {feed.length === 0 ? (
                  <li className="m-auto text-center text-sm text-ivory-dim">
                    {selected.bidCount > 0 ? 'Cargando pujas...' : 'Aún no hay pujas. ¡Sé el primero en pujar!'}
                  </li>
                ) : (
                  feed.map((bid, index) => <BidRow key={bid.id} bid={bid} isTop={index === 0} now={now} />)
                )}
              </ul>

              <div className="border-t border-ivory/5 p-3">
                <Button to={`/subastas/${selected.slug}`} variant="primary" size="sm" fullWidth onClick={() => setOpen(false)}>
                  Pujar en esta subasta
                </Button>
              </div>
            </>
          ) : (
            <>
              <ul aria-live="polite" className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
                {comments.length === 0 ? (
                  <li className="m-auto text-center text-sm text-ivory-dim">Aún no hay comentarios. ¡Escribe el primero!</li>
                ) : (
                  comments.map((comment) => <CommentRow key={comment.id} comment={comment} now={now} />)
                )}
                <li ref={commentsEndRef} aria-hidden="true" />
              </ul>

              {isAuthenticated ? (
                <form onSubmit={handleSendComment} className="border-t border-ivory/5 p-3">
                  {commentError && <p className="mb-2 text-xs text-danger">{commentError}</p>}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={draft}
                      maxLength={MAX_COMMENT_LENGTH}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Escribe un comentario..."
                      aria-label="Escribe un comentario"
                      className="min-w-0 flex-1 rounded-full border border-ivory/10 bg-ink px-4 py-2 text-sm text-ivory placeholder:text-ivory-dim/50 focus:border-gold focus:outline-none"
                    />
                    <button
                      type="submit"
                      aria-label="Enviar comentario"
                      disabled={sending || !draft.trim()}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-on-gold transition-transform hover:scale-105 disabled:opacity-40"
                    >
                      <SendIcon />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="border-t border-ivory/5 p-3">
                  <Button
                    to="/login"
                    state={{ from: location.pathname }}
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => setOpen(false)}
                  >
                    Inicia sesión para comentar
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}
