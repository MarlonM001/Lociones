import { useEffect, useState } from 'react'
import { getReferences } from '@/services/references'
import { EXAMPLE_REFERENCES } from '@/data/exampleReferences'
import { Button } from '@/components/ui/Button'

const REFERENCES_LIMIT = 3

export function ReferencesTeaser() {
  const [references, setReferences] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getReferences()
      .then((items) => setReferences(items.slice(0, REFERENCES_LIMIT)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null

  const hasRealReferences = references.length > 0

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <span className="text-xs uppercase tracking-widest-plus text-gold">Confianza</span>
        <h2 className="mt-2 font-display text-3xl text-ivory sm:text-4xl">Referencias de entrega</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-ivory-dim">
          {hasRealReferences
            ? 'Videos reales de clientes que ya recibieron su pedido.'
            : 'Muy pronto vas a poder ver aquí videos reales de nuestras entregas. Por ahora te mostramos un ejemplo de cómo se van a ver.'}
        </p>
      </div>

      {hasRealReferences ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {references.map((reference) => (
            <div key={reference.id} className="overflow-hidden rounded-2xl border border-ivory/5 bg-charcoal">
              <video controls preload="metadata" className="aspect-video w-full bg-ink">
                <source src={reference.videoUrl} />
              </video>
              <div className="p-4">
                <p className="font-display text-base text-ivory">{reference.title}</p>
                {reference.city && (
                  <p className="mt-1 text-xs uppercase tracking-widest-plus text-gold/80">{reference.city}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {EXAMPLE_REFERENCES.map((reference) => (
            <div key={reference.id} className="overflow-hidden rounded-2xl border border-ivory/5 bg-charcoal">
              <div className="relative aspect-video w-full overflow-hidden bg-ink">
                <img src={reference.image} alt="Ejemplo de referencia de entrega" className="h-full w-full object-cover" />
                <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-[10px] uppercase tracking-widest-plus text-gold">
                  Ejemplo
                </span>
              </div>
              <p className="p-4 text-sm text-ivory-dim">{reference.caption}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <Button to="/referencias" variant="secondary">
          Ver todas las referencias
        </Button>
      </div>
    </section>
  )
}
