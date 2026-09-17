import { useEffect, useState } from 'react'
import { getAuctionConfig, getAuctions } from '@/services/auctions'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { ComingSoon } from '@/pages/ComingSoon'
import { AuctionCard } from './AuctionCard'

const PHASE_ORDER = { active: 0, scheduled: 1, closed: 2, cancelled: 3 }

export function Auctions() {
  const [enabled, setEnabled] = useState(null)
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAuctionConfig(), getAuctions()]).then(([config, items]) => {
      setEnabled(config.enabled)
      setAuctions([...items].sort((a, b) => PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase]))
      setLoading(false)
    })
  }, [])

  if (loading) return <Loading fullScreen label="Cargando subastas..." />

  if (!enabled) {
    return (
      <ComingSoon
        title="Subastas"
        message="Todavía no hay subastas activas. Vuelve pronto — aquí aparecerán lociones especiales y combos para pujar."
      />
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <span className="text-xs uppercase tracking-widest-plus text-gold">Edición limitada</span>
        <h1 className="mt-1 font-display text-3xl text-ivory sm:text-4xl">Subastas</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-ivory-dim">
          Puja por lociones especiales y combos exclusivos. Gana la oferta más alta cuando cierra el tiempo.
        </p>
      </div>

      {auctions.length === 0 ? (
        <EmptyState
          title="No hay subastas por ahora"
          message="Vuelve pronto — aquí aparecerán las próximas subastas."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  )
}
