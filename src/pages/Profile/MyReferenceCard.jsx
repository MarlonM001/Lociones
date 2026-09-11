import { REFERENCE_STATUS_LABELS } from '@/services/references/statuses'

const STATUS_BADGE_CLASSES = {
  pending: 'bg-gold/10 text-gold',
  approved: 'bg-emerald-500/10 text-emerald-400',
  rejected: 'bg-red-500/10 text-red-400',
}

const STATUS_HINTS = {
  pending: 'En revisión — te avisamos cuando el equipo lo apruebe.',
  approved: 'Publicado en la galería pública de referencias.',
  rejected: 'No fue aprobado para la galería pública.',
}

export function MyReferenceCard({ reference }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-ivory/5 bg-charcoal p-4">
      <video src={reference.videoUrl} className="h-20 w-28 shrink-0 rounded-lg bg-ink object-cover" muted />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-display text-base text-ivory">{reference.title}</p>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE_CLASSES[reference.status]}`}>
            {REFERENCE_STATUS_LABELS[reference.status]}
          </span>
        </div>
        {reference.city && <p className="mt-1 text-xs text-gold/80">{reference.city}</p>}
        <p className="mt-1 text-xs text-ivory-dim">{STATUS_HINTS[reference.status]}</p>
      </div>
    </div>
  )
}
