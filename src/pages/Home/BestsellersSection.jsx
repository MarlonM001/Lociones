import { useEffect, useState } from 'react'
import { getBestsellerProducts } from '@/services/products'
import { ProductCard } from '@/components/product/ProductCard'
import { Loading } from '@/components/ui/Loading'
import { Reveal } from '@/components/ui/Reveal'

const ITEMS_PER_SLIDE = 3
const AUTO_ADVANCE_MS = 5000

function chunk(items, size) {
  const groups = []
  for (let i = 0; i < items.length; i += size) groups.push(items.slice(i, i + size))
  return groups
}

function ArrowIcon({ direction }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d={direction === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function BestsellersSection() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    let cancelled = false
    getBestsellerProducts(12).then((items) => {
      if (!cancelled) {
        setProducts(items)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const slides = chunk(products, ITEMS_PER_SLIDE)

  useEffect(() => {
    // En celular las 3 tarjetas van apiladas (~1800px): rotarlas solas mientras
    // el cliente hace scroll cambia el contenido bajo su dedo. Ahí solo manual.
    const isMobile = window.matchMedia('(max-width: 639px)').matches
    if (paused || isMobile || slides.length <= 1) return undefined
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, AUTO_ADVANCE_MS)
    return () => clearInterval(id)
  }, [paused, slides.length])

  const goTo = (nextIndex) => {
    setIndex((nextIndex + slides.length) % slides.length)
  }

  if (!loading && products.length === 0) return null

  return (
    <section
      className="relative overflow-hidden border-t border-gold/10 bg-gradient-to-b from-ink via-charcoal/60 to-ink py-16"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-10 flex flex-col items-center gap-2 text-center">
            <span className="text-xs uppercase tracking-widest-plus text-gold">Top ventas</span>
            <h2 className="font-display text-3xl text-ivory sm:text-4xl">Las favoritas de nuestros clientes</h2>
            <p className="max-w-xl text-sm text-ivory-dim">
              Las lociones que más se repiten en cada pedido. Si buscas un acierto seguro, empieza por aquí.
            </p>
          </div>
        </Reveal>

        {loading ? (
          <Loading label="Cargando top ventas..." />
        ) : (
          <Reveal delay={100}>
            <div className="grid">
              {slides.map((group, slideIndex) => (
                <div
                  key={slideIndex}
                  aria-hidden={slideIndex !== index}
                  inert={slideIndex !== index}
                  className={`col-start-1 row-start-1 grid grid-cols-1 content-start gap-6 transition-opacity duration-700 ease-out sm:grid-cols-2 lg:grid-cols-3 ${
                    slideIndex === index ? 'opacity-100' : 'pointer-events-none opacity-0'
                  }`}
                >
                  {group.map((product) => (
                    <ProductCard key={product.id} product={product} image={product.bestsellerImage || product.image} />
                  ))}
                </div>
              ))}
            </div>

            {slides.length > 1 && (
              <div className="mt-10 flex items-center justify-center gap-4">
                <button
                  type="button"
                  aria-label="Lociones anteriores"
                  onClick={() => goTo(index - 1)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-ivory/15 text-ivory backdrop-blur transition-colors hover:border-gold hover:text-gold"
                >
                  <ArrowIcon direction="left" />
                </button>

                <div className="flex gap-2">
                  {slides.map((_, dotIndex) => (
                    <button
                      key={dotIndex}
                      type="button"
                      aria-label={`Ir al grupo ${dotIndex + 1}`}
                      onClick={() => goTo(dotIndex)}
                      className={`h-1.5 rounded-full transition-all ${
                        dotIndex === index ? 'w-6 bg-gold' : 'w-1.5 bg-ivory/30 hover:bg-ivory/50'
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  aria-label="Siguientes lociones"
                  onClick={() => goTo(index + 1)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-ivory/15 text-ivory backdrop-blur transition-colors hover:border-gold hover:text-gold"
                >
                  <ArrowIcon direction="right" />
                </button>
              </div>
            )}
          </Reveal>
        )}
      </div>
    </section>
  )
}
