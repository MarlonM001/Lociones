import { useEffect, useState } from 'react'
import {
  getAuctionConfig,
  setAuctionConfig,
  getAuctions,
  cancelAuction,
  deleteAuction,
} from '@/services/auctions'
import { formatCurrency } from '@/utils/formatCurrency'
import { useToast } from '@/hooks/useToast'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/Modal'
import { AuctionFormModal } from './AuctionFormModal'
import { AuctionBidsModal } from './AuctionBidsModal'

const PHASE_LABELS = {
  scheduled: { label: 'Programada', className: 'bg-sky-500/10 text-sky-400' },
  active: { label: 'En curso', className: 'bg-emerald-500/10 text-emerald-400' },
  closed: { label: 'Cerrada', className: 'bg-ivory/10 text-ivory-dim' },
  cancelled: { label: 'Cancelada', className: 'bg-red-500/10 text-red-400' },
}

function PhaseBadge({ phase }) {
  const info = PHASE_LABELS[phase] ?? PHASE_LABELS.closed
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${info.className}`}>
      {info.label}
    </span>
  )
}

export function AdminAuctions() {
  const { showToast } = useToast()
  const [config, setConfig] = useState(null)
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingAuction, setEditingAuction] = useState(null)
  const [bidsAuction, setBidsAuction] = useState(null)
  const [cancellingAuction, setCancellingAuction] = useState(null)
  const [deletingAuction, setDeletingAuction] = useState(null)

  const load = async () => {
    const [configData, auctionsData] = await Promise.all([
      getAuctionConfig(),
      getAuctions({ includeCancelled: true }),
    ])
    setConfig(configData)
    setAuctions(auctionsData)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleToggleConfig = async () => {
    const next = !config.enabled
    setConfig({ enabled: next })
    try {
      await setAuctionConfig(next)
      showToast(next ? 'Módulo de subastas activado en la tienda' : 'Módulo de subastas desactivado')
    } catch (error) {
      setConfig({ enabled: !next })
      showToast(error.message, 'error')
    }
  }

  const openCreate = () => {
    setEditingAuction(null)
    setFormOpen(true)
  }

  const openEdit = (auction) => {
    setEditingAuction(auction)
    setFormOpen(true)
  }

  const handleCancel = async () => {
    await cancelAuction(cancellingAuction.id)
    showToast('Subasta cancelada')
    setCancellingAuction(null)
    load()
  }

  const handleDelete = async () => {
    try {
      await deleteAuction(deletingAuction.id)
      showToast('Subasta eliminada')
      setDeletingAuction(null)
      load()
    } catch (error) {
      showToast(error.message, 'error')
      setDeletingAuction(null)
    }
  }

  if (loading) return <Loading label="Cargando subastas..." />

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ivory">Subastas</h1>
          <p className="mt-1 max-w-2xl text-sm text-ivory-dim">
            Crea subastas de lociones caras o combos para que tus clientes con cuenta pujen entre sí. Cierran
            solas en la fecha que definas; cuando cierra, ves aquí quién ganó para contactarlo por WhatsApp.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ Nueva subasta</Button>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-ivory/5 bg-charcoal p-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={handleToggleConfig}
            className="h-5 w-5 rounded border-ivory/20 accent-gold"
          />
          <span className="text-ivory">Activar el módulo "Subastas" en la tienda</span>
        </label>
        <span className={`ml-auto text-xs ${config.enabled ? 'text-emerald-400' : 'text-ivory-dim'}`}>
          {config.enabled
            ? '● El enlace "Subastas" es visible para los clientes'
            : '○ El enlace "Subastas" está oculto — las subastas existentes siguen aquí, solo no se ven en la tienda'}
        </span>
      </div>

      <div className="mt-6">
        {auctions.length === 0 ? (
          <EmptyState
            title="Aún no has creado ninguna subasta"
            message='Usa "+ Nueva subasta" para poner en juego una loción especial o un combo.'
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-ivory/5 bg-charcoal">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr className="border-b border-ivory/10 text-left text-xs uppercase tracking-wide text-ivory-dim">
                  <th className="px-4 py-3">Foto</th>
                  <th className="px-4 py-3">Subasta</th>
                  <th className="px-4 py-3">Precio actual</th>
                  <th className="px-4 py-3">Pujas</th>
                  <th className="px-4 py-3">Cierra</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {auctions.map((auction) => (
                  <tr key={auction.id} className="border-b border-ivory/5 last:border-0">
                    <td className="px-4 py-3">
                      <img
                        src={auction.image || auction.items[0]?.product.image}
                        alt={auction.title}
                        className="h-12 w-12 rounded-lg bg-white object-contain p-1"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-ivory">
                      <div>{auction.title}</div>
                      <div className="text-xs text-ivory-dim">
                        {auction.kind === 'combo' ? `Combo · ${auction.items.length} productos` : 'Producto único'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-ivory">{formatCurrency(auction.currentPrice)}</td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        type="button"
                        onClick={() => setBidsAuction(auction)}
                        className="text-gold hover:underline"
                      >
                        {auction.bidCount}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-ivory-dim">
                      {new Date(auction.endsAt).toLocaleString('es-CO')}
                    </td>
                    <td className="px-4 py-3"><PhaseBadge phase={auction.phase} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <button type="button" onClick={() => openEdit(auction)} className="text-gold hover:underline">
                        Editar
                      </button>
                      {auction.phase !== 'cancelled' && auction.phase !== 'closed' && (
                        <button
                          type="button"
                          onClick={() => setCancellingAuction(auction)}
                          className="ml-3 text-ivory-dim hover:text-red-400"
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeletingAuction(auction)}
                        className="ml-3 text-ivory-dim hover:text-red-400"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AuctionFormModal
        open={formOpen}
        auction={editingAuction}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />

      <AuctionBidsModal open={Boolean(bidsAuction)} auction={bidsAuction} onClose={() => setBidsAuction(null)} />

      <ConfirmModal
        open={Boolean(cancellingAuction)}
        onClose={() => setCancellingAuction(null)}
        onConfirm={handleCancel}
        title="Cancelar subasta"
        message={`¿Seguro que quieres cancelar "${cancellingAuction?.title}"? Ya no se podrá pujar en ella.`}
        confirmLabel="Cancelar subasta"
      />

      <ConfirmModal
        open={Boolean(deletingAuction)}
        onClose={() => setDeletingAuction(null)}
        onConfirm={handleDelete}
        title="Eliminar subasta"
        message={
          deletingAuction?.bidCount > 0
            ? `"${deletingAuction?.title}" tiene ${deletingAuction.bidCount} puja(s) registrada(s). Al eliminarla se borran también esas pujas. Esta acción no se puede deshacer.`
            : `¿Seguro que quieres eliminar "${deletingAuction?.title}"? Esta acción no se puede deshacer.`
        }
        confirmLabel="Eliminar"
      />
    </div>
  )
}
