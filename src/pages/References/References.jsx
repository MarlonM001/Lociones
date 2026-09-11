import { useEffect, useState } from 'react'
import { getReferences } from '@/services/references'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { UploadReferenceForm } from './UploadReferenceForm'
import { ReferenceCard } from './ReferenceCard'

export function References() {
  const [references, setReferences] = useState([])
  const [loading, setLoading] = useState(true)

  const loadReferences = async () => {
    const items = await getReferences()
    setReferences(items)
    setLoading(false)
  }

  useEffect(() => {
    loadReferences()
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 max-w-2xl">
        <span className="text-xs uppercase tracking-widest-plus text-gold">Confianza</span>
        <h1 className="mt-2 font-display text-3xl text-ivory sm:text-4xl">Referencias de entrega</h1>
        <p className="mt-3 text-ivory-dim">
          Videos reales de nuestros envíos entregados. Si ya eres cliente, comparte el video de tu
          entrega para que otros compradores conozcan nuestro trabajo.
        </p>
      </div>

      <UploadReferenceForm onUploaded={loadReferences} />

      <div className="mt-10">
        {loading ? (
          <Loading label="Cargando referencias..." />
        ) : references.length === 0 ? (
          <EmptyState
            title="Aún no hay videos de referencia"
            message="Sé el primero en compartir el video de tu entrega."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {references.map((reference) => (
              <ReferenceCard key={reference.id} reference={reference} onDeleted={loadReferences} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
