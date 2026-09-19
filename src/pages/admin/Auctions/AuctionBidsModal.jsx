import { useEffect, useState } from 'react'
import { getAuctionBidsAdmin } from '@/services/auctions'
import { formatCurrency } from '@/utils/formatCurrency'
import { Modal } from '@/components/ui/Modal'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'

function buildWinnerWhatsAppLink(auction, bid) {
  const message = [
    `Hola ${bid.bidder.name}, ¡felicitaciones!`,
    '',
    `Ganaste la subasta "${auction.title}" con tu oferta de ${formatCurrency(bid.amount)}.`,
    '',
    'Para confirmar tu compra y coordinar el envío, cuéntame:',
    '- Ciudad y dirección de entrega',
    '- Forma de pago que prefieres',
  ].join('\n')
  const phone = bid.bidder.phone?.replace(/[^0-9]/g, '')
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

function buildBidWhatsAppLink(auction, bid) {
  const message = `Hola ${bid.bidder.name}, te escribo por tu puja de ${formatCurrency(bid.amount)} en la subasta "${auction.title}".`
  const phone = bid.bidder.phone?.replace(/[^0-9]/g, '')
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export function AuctionBidsModal({ open, auction, onClose }) {
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open || !auction) return
    setLoading(true)
    getAuctionBidsAdmin(auction.id).then((items) => {
      setBids(items)
      setLoading(false)
    })
  }, [open, auction])

  if (!auction) return null

  const topBid = bids[0]
  const isClosed = auction.phase === 'closed'

  return (
    <Modal open={open} onClose={onClose} title={`Pujas — ${auction.title}`}>
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
        {loading ? (
          <Loading label="Cargando pujas..." />
        ) : bids.length === 0 ? (
          <EmptyState title="Sin pujas todavía" message="Nadie ha ofertado en esta subasta por ahora." />
        ) : (
          <>
            {isClosed && topBid && (
              <div className="rounded-xl border border-gold/30 bg-gold/10 p-4">
                <p className="text-xs uppercase tracking-widest-plus text-gold">Ganador</p>
                <p className="mt-1 font-display text-lg text-ivory">{topBid.bidder.name}</p>
                <p className="text-sm text-ivory-dim">
                  {formatCurrency(topBid.amount)} · {topBid.bidder.phone} · {topBid.bidder.email}
                </p>
                <Button
                  href={buildWinnerWhatsAppLink(auction, topBid)}
                  target="_blank"
                  rel="noopener"
                  variant="whatsapp"
                  size="sm"
                  className="mt-3"
                >
                  Contactar por WhatsApp
                </Button>
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-ivory/5">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-ivory/10 text-left text-xs uppercase tracking-wide text-ivory-dim">
                    <th className="px-3 py-2">Monto</th>
                    <th className="px-3 py-2">Cliente</th>
                    <th className="px-3 py-2">Contacto</th>
                    <th className="px-3 py-2">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map((bid, index) => (
                    <tr key={bid.id} className="border-b border-ivory/5 last:border-0">
                      <td className="px-3 py-2 text-ivory">
                        {formatCurrency(bid.amount)} {index === 0 && <span className="text-gold">(mayor)</span>}
                      </td>
                      <td className="px-3 py-2 text-ivory">{bid.bidder.name}</td>
                      <td className="px-3 py-2 text-ivory-dim">
                        {bid.bidder.phone ? (
                          <a
                            href={buildBidWhatsAppLink(auction, bid)}
                            target="_blank"
                            rel="noopener"
                            className="text-emerald-400 hover:underline"
                          >
                            {bid.bidder.phone}
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-2 text-ivory-dim">
                        {new Date(bid.createdAt).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
