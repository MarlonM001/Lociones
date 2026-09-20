import { useEffect, useState } from 'react'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { getReferences } from '@/services/references'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { UploadReferenceForm } from './UploadReferenceForm'
import { ReferenceCard } from './ReferenceCard'

export function References() {
  useDocumentMeta({ title: 'Referencias de entrega', description: 'Videos y fotos reales de las entregas de Essence Polar, compartidos por nuestros clientes.' })
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
          Videos y fotos reales de nuestros envíos entregados. Si ya eres cliente, comparte el video
          o la foto de tu entrega para que otros compradores conozcan nuestro trabajo.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr] lg:items-start">
        <aside className="lg:sticky lg:top-24">
          <UploadReferenceForm onUploaded={loadReferences} />
        </aside>

        <section aria-label="Galería de referencias">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h2 className="font-display text-2xl text-ivory">Entregas de nuestros clientes</h2>
            {!loading && references.length > 0 && (
              <span className="text-sm text-ivory-dim">
                {references.length} {references.length === 1 ? 'referencia' : 'referencias'}
              </span>
            )}
          </div>

          {loading ? (
            <Loading label="Cargando referencias..." />
          ) : references.length === 0 ? (
            <EmptyState
              title="Aún no hay referencias"
              message="Sé el primero en compartir el video o la foto de tu entrega."
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {references.map((reference) => (
                <ReferenceCard key={reference.id} reference={reference} onDeleted={loadReferences} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
