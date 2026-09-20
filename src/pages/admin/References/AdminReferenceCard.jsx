import { REFERENCE_STATUS_LABELS, REFERENCE_STATUSES } from '@/services/references/statuses'
import { Button } from '@/components/ui/Button'
import { ReferenceMedia } from '@/components/references/ReferenceMedia'

const STATUS_BADGE_CLASSES = {
  pending: 'bg-gold/10 text-gold',
  approved: 'bg-emerald-500/10 text-success',
  rejected: 'bg-red-500/10 text-danger',
}

export function AdminReferenceCard({ reference, uploaderName, onApprove, onReject, onDelete }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ivory/5 bg-charcoal">
      <ReferenceMedia reference={reference} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg text-ivory">{reference.title}</h3>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE_CLASSES[reference.status]}`}>
            {REFERENCE_STATUS_LABELS[reference.status]}
          </span>
        </div>
        {reference.city && (
          <p className="mt-1 text-xs uppercase tracking-widest-plus text-gold">{reference.city}</p>
        )}
        {reference.description && <p className="mt-2 text-sm text-ivory-dim">{reference.description}</p>}
        <p className="mt-2 text-xs text-ivory-dim">
          Subido por {uploaderName ?? `usuario #${reference.createdBy}`} ·{' '}
          {new Date(reference.createdAt).toLocaleDateString('es-CO')}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            disabled={reference.status === REFERENCE_STATUSES.APPROVED}
            onClick={() => onApprove(reference.id)}
          >
            Aprobar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={reference.status === REFERENCE_STATUSES.REJECTED}
            onClick={() => onReject(reference.id)}
          >
            Rechazar
          </Button>
          <button
            type="button"
            onClick={() => onDelete(reference)}
            className="ml-auto rounded-full border border-red-500/40 px-4 py-1.5 text-sm text-danger transition-colors hover:bg-red-500/10"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
