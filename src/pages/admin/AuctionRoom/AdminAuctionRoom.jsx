import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getAuctions,
  getAuctionBidsAdmin,
  getAuctionCommentsAdmin,
  postAuctionComment,
  deleteAuctionComment,
} from '@/services/auctions'
import { getRealtimeSocket } from '@/services/realtime/socket'
import { formatCurrency } from '@/utils/formatCurrency'
import { useToast } from '@/hooks/useToast'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmModal } from '@/components/ui/Modal'

const PHASE_LABELS = {
  scheduled: { label: 'Programada', className: 'bg-sky-500/10 text-sky-400' },
  active: { label: 'En curso', className: 'bg-emerald-500/10 text-success' },
  closed: { label: 'Cerrada', className: 'bg-ivory/10 text-ivory-dim' },
}

const MAX_COMMENT_LENGTH = 300

function formatTime(isoDate) {
  return new Date(isoDate).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function whatsappLink(phone) {
  const digits = (phone ?? '').replace(/[^0-9]/g, '')
  return digits ? `https://wa.me/${digits}` : null
}

function ContactLine({ person }) {
  const link = whatsappLink(person.phone)
  return (
    <span className="text-xs text-ivory-dim">
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
          {person.phone}
        </a>
      ) : (
        'Sin teléfono'
      )}
      {person.email && <span> · {person.email}</span>}
    </span>
  )
}

/**
 * Sala de la subasta vista por el admin: quién ha pujado y quién ha comentado (con nombre y contacto
 * reales), y un cuadro para publicar un comentario general que ven todos los participantes. Se actualiza
 * sola cuando entra una puja o un comentario.
 */
export function AdminAuctionRoom() {
  const { showToast } = useToast()
  const [auctions, setAuctions] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [bids, setBids] = useState([])
  const [comments, setComments] = useState([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [deletingComment, setDeletingComment] = useState(null)
  const commentsEndRef = useRef(null)

  const loadAuctions = useCallback(async () => {
    const all = (await getAuctions()).filter((auction) => auction.phase !== 'cancelled')
    setAuctions(all)
    setSelectedId((current) => current ?? (all.find((auction) => auction.phase === 'active') ?? all[0])?.id ?? null)
  }, [])

  useEffect(() => {
    loadAuctions().catch((error) => showToast(error.message, 'error'))
  }, [loadAuctions, showToast])

  const selected = auctions?.find((auction) => auction.id === selectedId)

  useEffect(() => {
    if (!selectedId) return undefined
    let cancelled = false
    const socket = getRealtimeSocket()

    const loadBids = () =>
      getAuctionBidsAdmin(selectedId)
        .then((items) => !cancelled && setBids(items))
        .catch(() => {})
    const loadComments = () =>
      getAuctionCommentsAdmin(selectedId)
        .then((items) => !cancelled && setComments(items.slice().reverse()))
        .catch(() => {})

    const handleConnect = () => {
      socket.emit('auction:watch')
      loadBids()
      loadComments()
    }
    const handleBid = ({ auctionId }) => {
      if (auctionId !== selectedId) return
      loadBids()
      loadAuctions().catch(() => {})
    }
    const handleCommentChange = ({ auctionId }) => {
      if (auctionId === selectedId) loadComments()
    }

    setBids([])
    setComments([])
    socket.on('connect', handleConnect)
    socket.on('auction:bid', handleBid)
    socket.on('auction:comment', handleCommentChange)
    socket.on('auction:comment-deleted', handleCommentChange)
    if (socket.connected) handleConnect()
    else {
      loadBids()
      loadComments()
      socket.connect()
    }

    return () => {
      cancelled = true
      socket.off('connect', handleConnect)
      socket.off('auction:bid', handleBid)
      socket.off('auction:comment', handleCommentChange)
      socket.off('auction:comment-deleted', handleCommentChange)
      if (socket.connected) socket.emit('auction:unwatch')
    }
  }, [selectedId, loadAuctions])

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ block: 'end' })
  }, [comments])

  const handlePublish = async (event) => {
    event.preventDefault()
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    try {
      await postAuctionComment(selectedId, body)
      setDraft('')
      showToast('Comentario publicado en la sala')
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setSending(false)
    }
  }

  const handleConfirmDelete = async () => {
    const comment = deletingComment
    setDeletingComment(null)
    try {
      await deleteAuctionComment(selectedId, comment.id)
      showToast('Comentario eliminado')
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  if (!auctions) return <Loading label="Cargando subastas..." />

  return (
    <div>
      <h1 className="font-display text-3xl text-ivory">Sala de subasta</h1>
      <p className="mt-1 text-sm text-ivory-dim">
        Mira quién puja y quién comenta en cada subasta, y escribe un comentario general para todos los participantes.
      </p>

      {auctions.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Sin subastas" message="Crea una subasta en la sección Subastas y aquí verás su sala." />
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-ivory/5 bg-charcoal p-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <label htmlFor="room-auction" className="mb-1 block text-xs uppercase tracking-widest-plus text-ivory-dim">
                Subasta
              </label>
              <select
                id="room-auction"
                value={selectedId ?? ''}
                onChange={(event) => setSelectedId(Number(event.target.value))}
                className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-sm text-ivory focus:border-gold focus:outline-none"
              >
                {auctions.map((auction) => (
                  <option key={auction.id} value={auction.id}>
                    {auction.title} · {PHASE_LABELS[auction.phase]?.label ?? 'Cerrada'}
                  </option>
                ))}
              </select>
            </div>
            {selected && (
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-ivory-dim">{selected.bidCount > 0 ? 'Puja actual' : 'Precio inicial'}</p>
                  <p className="font-display text-xl text-gold">{formatCurrency(selected.currentPrice)}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${(PHASE_LABELS[selected.phase] ?? PHASE_LABELS.closed).className}`}
                >
                  {(PHASE_LABELS[selected.phase] ?? PHASE_LABELS.closed).label}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="flex h-[32rem] flex-col overflow-hidden rounded-2xl border border-ivory/5 bg-charcoal">
              <h2 className="border-b border-ivory/5 px-4 py-3 text-sm font-medium text-ivory">
                Pujas <span className="text-ivory-dim">({bids.length})</span>
              </h2>
              <ul className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
                {bids.length === 0 ? (
                  <li className="m-auto text-sm text-ivory-dim">Nadie ha pujado todavía.</li>
                ) : (
                  bids.map((bid, index) => (
                    <li
                      key={bid.id}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                        index === 0 ? 'border border-gold/30 bg-gold/10' : 'bg-ink'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ivory">
                          {bid.bidder.name}
                          {index === 0 && <span className="ml-2 text-xs text-gold">Va ganando</span>}
                        </p>
                        <ContactLine person={bid.bidder} />
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-ivory">{formatCurrency(bid.amount)}</p>
                        <p className="text-xs text-ivory-dim">{formatTime(bid.createdAt)}</p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section className="flex h-[32rem] flex-col overflow-hidden rounded-2xl border border-ivory/5 bg-charcoal">
              <h2 className="border-b border-ivory/5 px-4 py-3 text-sm font-medium text-ivory">
                Comentarios <span className="text-ivory-dim">({comments.length})</span>
              </h2>
              <ul className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
                {comments.length === 0 ? (
                  <li className="m-auto text-sm text-ivory-dim">Aún no hay comentarios.</li>
                ) : (
                  comments.map((comment) => (
                    <li
                      key={comment.id}
                      className={`rounded-xl px-3 py-2 ${comment.isAdmin ? 'border border-gold/30 bg-gold/10' : 'bg-ink'}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-ivory">
                            {comment.isAdmin ? 'Tú (Essence Polar)' : comment.author.name}
                            <span className="ml-2 text-xs text-ivory-dim">{formatTime(comment.createdAt)}</span>
                          </p>
                          {!comment.isAdmin && <ContactLine person={comment.author} />}
                        </div>
                        <button
                          type="button"
                          onClick={() => setDeletingComment(comment)}
                          className="shrink-0 rounded-full px-3 py-1 text-xs text-ivory-dim transition-colors hover:bg-red-500/10 hover:text-danger"
                        >
                          Quitar
                        </button>
                      </div>
                      <p className="mt-1 break-words text-sm text-ivory">{comment.body}</p>
                    </li>
                  ))
                )}
                <li ref={commentsEndRef} aria-hidden="true" />
              </ul>

              <form onSubmit={handlePublish} className="flex items-center gap-2 border-t border-ivory/5 p-3">
                <input
                  type="text"
                  value={draft}
                  maxLength={MAX_COMMENT_LENGTH}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Comentario general para todos los participantes..."
                  aria-label="Comentario general"
                  className="min-w-0 flex-1 rounded-full border border-ivory/10 bg-ink px-4 py-2 text-sm text-ivory placeholder:text-ivory-dim/50 focus:border-gold focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-on-gold transition-transform hover:scale-105 disabled:opacity-40"
                >
                  Publicar
                </button>
              </form>
            </section>
          </div>
        </>
      )}

      <ConfirmModal
        open={Boolean(deletingComment)}
        onClose={() => setDeletingComment(null)}
        onConfirm={handleConfirmDelete}
        title="Quitar comentario"
        message={
          deletingComment
            ? `Se quitará para todos el comentario: "${deletingComment.body}". Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Quitar"
      />
    </div>
  )
}
