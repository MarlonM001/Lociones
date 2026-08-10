import { REFERENCE_STATUS_LABELS, REFERENCE_STATUSES } from '@/services/references/statuses'
import { Button } from '@/components/ui/Button'

const STATUS_BADGE_CLASSES = {
  pending: 'bg-gold/10 text-gold',
  approved: 'bg-emerald-500/10 text-emerald-400',
  rejected: 'bg-red-500/10 text-red-400',
}

export function AdminReferenceCard({ reference, uploaderName, onApprove, onReject }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ivory/5 bg-charcoal">
      <video controls preload="metadata" className="aspect-video w-full bg-ink">
        <source src={reference.videoUrl} />
        Tu navegador no soporta la reproducción de este video.
      </video>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg text-ivory">{reference.title}</h3>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE_CLASSES[reference.status]}`}>
            {REFERENCE_STATUS_LABELS[reference.status]}
          </span>
        </div>
        {reference.city && (
          <p className="mt-1 text-xs uppercase tracking-widest-plus text-gold/80">{reference.city}</p>
        )}
        {reference.description && <p className="mt-2 text-sm text-ivory-dim">{reference.description}</p>}
        <p className="mt-2 text-xs text-ivory-dim">
          Subido por {uploaderName ?? `usuario #${reference.createdBy}`} ·{' '}
          {new Date(reference.createdAt).toLocaleDateString('es-CO')}
        </p>

        <div className="mt-4 flex gap-2">
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
        </div>
      </div>
    </div>
  )
}
