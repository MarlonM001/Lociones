import { useEffect, useState } from 'react'
import { getReferences } from '@/services/references'
import { EXAMPLE_REFERENCES } from '@/data/exampleReferences'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { ReferenceMedia } from '@/components/references/ReferenceMedia'

const REFERENCES_LIMIT = 3

/** Solo suena un video de ejemplo a la vez: al darle play a uno se pausan los demás. */
function pauseOtherExamples(event) {
  document.querySelectorAll('video[data-example-video]').forEach((video) => {
    if (video !== event.currentTarget) video.pause()
  })
}

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
            ? 'Fotos reales de clientes que ya recibieron su pedido.'
            : 'Muy pronto vas a poder ver aquí fotos reales de nuestras entregas. Por ahora te mostramos un ejemplo de cómo se van a ver.'}
        </p>
      </div>

      {hasRealReferences ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {references.map((reference, index) => (
            <Reveal key={reference.id} delay={index * 100}>
              <div className="overflow-hidden rounded-2xl border border-ivory/5 bg-charcoal">
                <ReferenceMedia reference={reference} />
                <div className="p-4">
                  <p className="font-display text-base text-ivory">{reference.title}</p>
                  {reference.city && (
                    <p className="mt-1 text-xs uppercase tracking-widest-plus text-gold">{reference.city}</p>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {EXAMPLE_REFERENCES.map((reference, index) => (
            <Reveal key={reference.id} delay={index * 100}>
              <div className="overflow-hidden rounded-2xl border border-ivory/5 bg-charcoal">
                <div className="relative aspect-video w-full overflow-hidden bg-ink">
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    poster={reference.poster}
                    data-example-video
                    aria-label={`Video de ejemplo: ${reference.title}`}
                    onPlay={pauseOtherExamples}
                    className="h-full w-full object-cover"
                  >
                    <source src={reference.video} type="video/mp4" />
                  </video>
                  <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-[10px] uppercase tracking-widest-plus text-gold">
                    Ejemplo
                  </span>
                </div>
                <div className="p-4">
                  <p className="font-display text-base text-ivory">{reference.title}</p>
                  <p className="mt-1 text-sm text-ivory-dim">{reference.caption}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      {!hasRealReferences && (
        <p className="mt-6 text-center text-xs text-ivory-dim">
          Videos de ejemplo de{' '}
          <a href="https://mixkit.co" target="_blank" rel="noopener noreferrer" className="underline hover:text-ivory">
            Mixkit
          </a>
          .
        </p>
      )}

      <div className="mt-8 flex justify-center">
        <Button to="/referencias" variant="secondary">
          Ver todas las referencias
        </Button>
      </div>
    </section>
  )
}
