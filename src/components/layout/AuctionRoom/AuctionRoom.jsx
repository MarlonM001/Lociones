import { useEffect, useState } from 'react'
import { getAuctions, getAuctionFeed } from '@/services/auctions'
import { getChatSocket } from '@/services/chat/socket'
import { useCountdown } from '@/hooks/useCountdown'
import { useHideNearFooter } from '@/hooks/useHideNearFooter'
import { Button } from '@/components/ui/Button'
import { Price } from '@/components/ui/Price'

/** Cada cuánto se revisa si hay (o dejó de haber) una subasta activa mientras el sitio sigue abierto. */
const AUCTION_POLL_MS = 60000

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

/**
 * Sala de la subasta en vivo (botón flotante). Solo aparece cuando hay una subasta en curso. Muestra el
 * producto que se subasta, la puja actual, cuánto falta para que cierre y las pujas de los demás
 * participantes en el momento en que ocurren. Es de solo lectura: para pujar se va a la página de la subasta.
 */
export function AuctionRoom() {
  const [open, setOpen] = useState(false)
  const [auctions, setAuctions] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [feed, setFeed] = useState([])
  const [connection, setConnection] = useState('connecting')
  const [now, setNow] = useState(() => Date.now())
  const hideLauncher = useHideNearFooter()

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
    const socket = getChatSocket()

    const loadFeed = () => {
      getAuctionFeed(activeId)
        .then((bids) => {
          if (!cancelled) setFeed(bids)
        })
        .catch(() => {})
    }

    // Al (re)conectar se pide el historial otra vez: así no se pierde lo que pasó mientras se cayó la conexión.
    const handleConnect = () => {
      setConnection('live')
      socket.emit('auction:watch')
      loadFeed()
    }
    const handleDisconnect = () => setConnection('offline')

    const handleBid = ({ auctionId, bid, currentPrice, bidCount, nextMinBid }) => {
      setAuctions((current) =>
        current.map((auction) => (auction.id === auctionId ? { ...auction, currentPrice, bidCount, nextMinBid } : auction)),
      )
      if (auctionId !== activeId) return
      setFeed((current) => (current.some((existing) => existing.id === bid.id) ? current : [bid, ...current].slice(0, 30)))
    }

    setFeed([])
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('auction:bid', handleBid)
    if (socket.connected) {
      handleConnect()
    } else {
      setConnection('connecting')
      socket.connect()
    }

    return () => {
      cancelled = true
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('auction:bid', handleBid)
      if (socket.connected) socket.emit('auction:unwatch')
    }
  }, [open, activeId])

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
        <div className="animate-fade-up fixed bottom-24 left-5 z-[150] flex h-[32rem] max-h-[calc(100dvh-8rem)] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-gold/20 bg-charcoal shadow-2xl shadow-black/50 sm:bottom-28 sm:left-6">
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
              <img src={image} alt="" className="h-16 w-16 shrink-0 rounded-lg bg-white object-contain object-center p-1" />
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

          <div className="flex items-center justify-between px-4 pb-1 pt-3 text-xs uppercase tracking-widest-plus text-ivory-dim">
            <span>Pujas</span>
            <span>{selected.bidCount}</span>
          </div>

          <ul aria-live="polite" className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 pb-3">
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
        </div>
      )}
    </>
  )
}
