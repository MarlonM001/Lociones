import { useEffect, useState } from 'react'
import { getAllReferencesAdmin, updateReferenceStatus } from '@/services/references'
import { REFERENCE_STATUSES } from '@/services/references/statuses'
import { getAllUsers } from '@/services/auth'
import { useToast } from '@/hooks/useToast'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
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
    showToast('Video aprobado y publicado en la galería pública.')
    load()
  }

  const handleReject = async (id) => {
    await updateReferenceStatus(id, REFERENCE_STATUSES.REJECTED)
    showToast('Video rechazado.', 'info')
    load()
  }

  const filtered = filter ? references.filter((reference) => reference.status === filter) : references

  return (
    <div>
      <h1 className="font-display text-3xl text-ivory">Referencias</h1>
      <p className="mt-1 text-sm text-ivory-dim">
        Revisa los videos subidos por clientes antes de que aparezcan en la galería pública.
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
          <EmptyState title="No hay videos en esta categoría" />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((reference) => (
              <AdminReferenceCard
                key={reference.id}
                reference={reference}
                uploaderName={usersById[reference.createdBy]}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
