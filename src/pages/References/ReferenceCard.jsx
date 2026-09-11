import { useState } from 'react'
import { deleteReference } from '@/services/references'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { ConfirmModal } from '@/components/ui/Modal'

export function ReferenceCard({ reference, onDeleted }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const isOwner = user && reference.createdBy === user.id

  const handleDelete = async () => {
    await deleteReference(reference.id)
    setConfirmOpen(false)
    showToast('Video eliminado')
    onDeleted?.()
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ivory/5 bg-charcoal">
      <video controls preload="metadata" className="aspect-video w-full bg-ink">
        <source src={reference.videoUrl} />
        Tu navegador no soporta la reproducción de este video.
      </video>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg text-ivory">{reference.title}</h3>
          {isOwner && (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="shrink-0 text-xs text-ivory-dim hover:text-red-400"
            >
              Eliminar
            </button>
          )}
        </div>
        {reference.city && (
          <p className="mt-1 text-xs uppercase tracking-widest-plus text-gold/80">{reference.city}</p>
        )}
        {reference.description && (
          <p className="mt-2 text-sm text-ivory-dim">{reference.description}</p>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar video"
        message="¿Seguro que quieres eliminar este video de referencia? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
      />
    </div>
  )
}
