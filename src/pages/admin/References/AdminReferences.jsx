import { useEffect, useState } from 'react'
import { deleteReference, getAllReferencesAdmin, updateReferenceStatus } from '@/services/references'
import { REFERENCE_STATUSES } from '@/services/references/statuses'
import { getAllUsers } from '@/services/auth'
import { useToast } from '@/hooks/useToast'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmModal } from '@/components/ui/Modal'
import { AdminReferenceCard } from './AdminReferenceCard'

const FILTERS = [
  { label: 'Pendientes', value: REFERENCE_STATUSES.PENDING },
  { label: 'Aprobadas', value: REFERENCE_STATUSES.APPROVED },
  { label: 'Rechazadas', value: REFERENCE_STATUSES.REJECTED },
  { label: 'Todas', value: null },
]

export function AdminReferences() {
  const { showToast } = useToast()
  const [references, setReferences] = useState([])
  const [usersById, setUsersById] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(REFERENCE_STATUSES.PENDING)
  const [deletingReference, setDeletingReference] = useState(null)

  const load = async () => {
    const [items, users] = await Promise.all([getAllReferencesAdmin(), getAllUsers()])
    setReferences(items)
    setUsersById(Object.fromEntries(users.map((user) => [user.id, user.name])))
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleApprove = async (id) => {
    await updateReferenceStatus(id, REFERENCE_STATUSES.APPROVED)
    showToast('Referencia aprobada y publicada en la galería pública.')
    load()
  }

  const handleReject = async (id) => {
    await updateReferenceStatus(id, REFERENCE_STATUSES.REJECTED)
    showToast('Referencia rechazada.', 'info')
    load()
  }

  const handleDelete = async () => {
    const reference = deletingReference
    setDeletingReference(null)
    try {
      await deleteReference(reference.id)
      showToast('Referencia eliminada.')
    } catch (error) {
      showToast(error.message || 'No pudimos eliminar la referencia, intenta de nuevo.', 'error')
    }
    load()
  }

  const filtered = filter ? references.filter((reference) => reference.status === filter) : references

  return (
    <div>
      <h1 className="font-display text-3xl text-ivory">Referencias</h1>
      <p className="mt-1 text-sm text-ivory-dim">
        Revisa las fotos subidas por clientes antes de que aparezcan en la galería pública.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => setFilter(option.value)}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              filter === option.value ? 'border-gold bg-gold/10 text-gold' : 'border-ivory/10 text-ivory-dim hover:text-ivory'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <Loading label="Cargando referencias..." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No hay referencias en esta categoría" />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((reference) => (
              <AdminReferenceCard
                key={reference.id}
                reference={reference}
                uploaderName={usersById[reference.createdBy]}
                onApprove={handleApprove}
                onReject={handleReject}
                onDelete={setDeletingReference}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(deletingReference)}
        onClose={() => setDeletingReference(null)}
        onConfirm={handleDelete}
        title="Eliminar referencia"
        message={`¿Seguro que quieres eliminar "${deletingReference?.title}"? Se borra también ${
          deletingReference?.mediaType === 'image' ? 'la foto' : 'el video'
        } y esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
      />
    </div>
  )
}
