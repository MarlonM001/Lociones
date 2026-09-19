import { useState } from 'react'
import { deleteReference } from '@/services/references'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { ConfirmModal } from '@/components/ui/Modal'
import { ReferenceMedia } from '@/components/references/ReferenceMedia'

export function ReferenceCard({ reference, onDeleted }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const isOwner = user && reference.createdBy === user.id

  const handleDelete = async () => {
    await deleteReference(reference.id)
    setConfirmOpen(false)
    showToast(reference.mediaType === 'image' ? 'Foto eliminada' : 'Video eliminado')
    onDeleted?.()
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ivory/5 bg-charcoal">
      <ReferenceMedia reference={reference} />

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
        title={reference.mediaType === 'image' ? 'Eliminar foto' : 'Eliminar video'}
        message="¿Seguro que quieres eliminar esta referencia? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
      />
    </div>
  )
}
