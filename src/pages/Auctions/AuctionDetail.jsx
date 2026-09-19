import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getAuctionBySlug, placeBid } from '@/services/auctions'
import { formatCurrency } from '@/utils/formatCurrency'
import { Price } from '@/components/ui/Price'
import { useCountdown } from '@/hooks/useCountdown'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'

function pad(n) {
  return String(n).padStart(2, '0')
}

function CountdownBlock({ targetDate, label }) {
  const countdown = useCountdown(targetDate)
  if (countdown.isOver) return null
  return (
    <div className="rounded-xl border border-gold/20 bg-gold/5 px-4 py-3 text-center">
      <p className="text-xs uppercase tracking-widest-plus text-gold">{label}</p>
      <p className="mt-1 font-display text-2xl text-ivory">
        {countdown.days > 0 && `${countdown.days}d `}
        {pad(countdown.hours)}:{pad(countdown.minutes)}:{pad(countdown.seconds)}
      </p>
    </div>
  )
}

export function AuctionDetail() {
  const { slug } = useParams()
  const requireAuth = useRequireAuth()
  const { showToast } = useToast()

  const [auction, setAuction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    const found = await getAuctionBySlug(slug)
    setAuction(found)
    if (found) setAmount(String(found.nextMinBid))
    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  if (loading) return <Loading fullScreen label="Cargando subasta..." />

  if (!auction) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          title="Subasta no encontrada"
          message="Es posible que el enlace sea incorrecto o la subasta ya no esté disponible."
          action={<Button to="/subastas">Ver subastas</Button>}
        />
      </div>
    )
  }

  const image = auction.image || auction.items[0]?.product.image

  const handleBid = async (event) => {
    event.preventDefault()
    requireAuth(async () => {
      setSubmitting(true)
      try {
        const updated = await placeBid(auction.id, Number(amount))
        setAuction(updated)
        setAmount(String(updated.nextMinBid))
        showToast(
          updated.isUserLeading ? '¡Vas ganando la subasta!' : 'Puja registrada, pero alguien más va ganando ahora.',
        )
      } catch (error) {
        showToast(error.message, 'error')
      } finally {
        setSubmitting(false)
      }
    })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-8 text-xs text-ivory-dim">
        <Link to="/subastas" className="hover:text-ivory">Subastas</Link>
        <span className="mx-2">/</span>
        <span className="text-ivory">{auction.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="aspect-square w-full overflow-hidden rounded-2xl border border-ivory/5 bg-white p-8">
          <img src={image} alt={auction.title} className="h-full w-full object-contain object-center" />
        </div>

        <div>
          <span className="text-xs uppercase tracking-widest-plus text-gold">
            {auction.kind === 'combo' ? 'Combo exclusivo' : 'Pieza especial'}
          </span>
          <h1 className="mt-2 font-display text-3xl text-ivory sm:text-4xl">{auction.title}</h1>
          {auction.description && <p className="mt-4 leading-relaxed text-ivory-dim">{auction.description}</p>}

          {auction.items.length > 0 && (
            <div className="mt-6 flex flex-col gap-2">
              <p className="text-xs uppercase tracking-widest-plus text-ivory-dim">Incluye</p>
              {auction.items.map((item) => (
                <Link
                  key={item.productId}
                  to={`/producto/${item.product.slug}`}
                  className="group flex items-center gap-3 rounded-lg border border-ivory/5 bg-charcoal px-3 py-2 transition-colors hover:border-gold/30"
                >
                  <img src={item.product.image} alt="" className="h-12 w-12 rounded bg-white object-contain object-center p-1" />
                  <span className="flex-1 text-sm text-ivory transition-colors group-hover:text-gold">
                    {item.product.name}
                  </span>
                  {item.quantity > 1 && <span className="text-xs text-ivory-dim">x{item.quantity}</span>}
                  <span className="text-xs text-gold opacity-0 transition-opacity group-hover:opacity-100">
                    Ver producto →
                  </span>
                </Link>
              ))}
            </div>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-ivory/5 p-4 text-sm">
            <div>
              <dt className="text-ivory-dim">{auction.bidCount > 0 ? 'Puja actual' : 'Precio inicial'}</dt>
              <dd>
                <Price value={auction.currentPrice} className="text-2xl text-gold" />
              </dd>
            </div>
            <div>
              <dt className="text-ivory-dim">Pujas realizadas</dt>
              <dd className="text-ivory">{auction.bidCount}</dd>
            </div>
          </dl>

          {auction.phase === 'scheduled' && (
            <div className="mt-6 flex flex-col gap-3">
              <CountdownBlock targetDate={auction.startsAt} label="Empieza en" />
              <p className="text-sm text-ivory-dim">
                Podrás pujar cuando empiece, el {new Date(auction.startsAt).toLocaleString('es-CO')}.
              </p>
            </div>
          )}

          {auction.phase === 'active' && (
            <div className="mt-6 flex flex-col gap-4">
              <CountdownBlock targetDate={auction.endsAt} label="Cierra en" />

              {auction.isUserLeading && (
                <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
                  Vas ganando esta subasta con tu última puja.
                </p>
              )}

              <form onSubmit={handleBid} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="mb-1 block text-sm text-ivory-dim">
                    Tu oferta (mínimo {formatCurrency(auction.nextMinBid)})
                  </label>
                  <input
                    type="number"
                    min={auction.nextMinBid}
                    step={auction.minIncrement}
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory focus:border-gold focus:outline-none"
                  />
                </div>
                <Button type="submit" variant="primary" size="lg" disabled={submitting}>
                  {submitting ? 'Enviando...' : 'Pujar'}
                </Button>
              </form>
            </div>
          )}

          {auction.phase === 'closed' && (
            <div className="mt-6">
              {auction.isUserLeading ? (
                <p className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
                  ¡Ganaste esta subasta! Te contactaremos por WhatsApp para coordinar tu compra.
                </p>
              ) : (
                <p className="rounded-lg border border-ivory/10 bg-charcoal px-4 py-3 text-sm text-ivory-dim">
                  Esta subasta ya cerró.
                </p>
              )}
            </div>
          )}

          {auction.phase === 'cancelled' && (
            <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              Esta subasta fue cancelada.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
