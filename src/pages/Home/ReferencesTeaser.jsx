import { EXAMPLE_REFERENCES } from '@/data/exampleReferences'
import { Button } from '@/components/ui/Button'

export function ReferencesTeaser() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <span className="text-xs uppercase tracking-widest-plus text-gold">Confianza</span>
        <h2 className="mt-2 font-display text-3xl text-ivory sm:text-4xl">Referencias de entrega</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-ivory-dim">
          Muy pronto vas a poder ver aquí videos reales de nuestras entregas. Por ahora te mostramos
          un ejemplo de cómo se van a ver.
        </p>
      </div>

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

      <div className="mt-8 flex justify-center">
        <Button to="/referencias" variant="secondary">
          Ver referencias
        </Button>
      </div>
    </section>
  )
}
