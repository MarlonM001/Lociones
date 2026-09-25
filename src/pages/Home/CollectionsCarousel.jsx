import { useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES } from '@/config/categories'
import { FRAGRANCE_FAMILIES } from '@/config/fragranceFamilies'
import { Reveal } from '@/components/ui/Reveal'

const AUTO_ADVANCE_MS = 3500
// Tras tocar, arrastrar o usar las flechas, el carrusel espera antes de volver a avanzar solo.
const RESUME_AFTER_INTERACTION_MS = 7000

// Primero las categorías de la tienda, luego las familias olfativas. Las fotos
// son de ambiente (no de los frascos) y viven en /public/images/families.
const CATEGORY_CARDS = {
  arabia: { name: 'Árabes', image: 'arabia' },
  mujeres: { name: 'Mujeres', image: 'mujeres' },
  caballero: { name: 'Caballero', image: 'caballero' },
}

const COLLECTIONS = [
  ...CATEGORIES.map((category) => ({
    id: category.id,
    name: CATEGORY_CARDS[category.id]?.name ?? category.name,
    image: CATEGORY_CARDS[category.id]?.image ?? category.id,
    to: `/productos/${category.slug}`,
  })),
  ...FRAGRANCE_FAMILIES.map((family) => ({
    id: family.id,
    name: family.name,
    image: family.id,
    to: `/catalogo?familia=${family.id}`,
  })),
]

function ArrowIcon({ direction = 'right', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d={direction === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CollectionCard({ collection }) {
  return (
    <Link
      to={collection.to}
      className="group relative block aspect-[4/3] w-[78%] flex-none snap-start overflow-hidden rounded-2xl bg-charcoal sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-3rem)/4)]"
    >
      <img
        src={`/images/families/${collection.image}.webp`}
        alt=""
        width="900"
        height="675"
        loading="lazy"
        draggable="false"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

      <span className="absolute inset-x-0 bottom-0 p-4">
        <span className="block min-w-0">
          <span className="block text-sm font-medium text-white/90">Perfumes</span>
          <span className="block truncate font-display text-2xl uppercase tracking-wide text-white sm:text-3xl">
            {collection.name}
          </span>
        </span>
      </span>
    </Link>
  )
}

export function CollectionsCarousel() {
  const trackRef = useRef(null)
  const hoveringRef = useRef(false)
  const visibleRef = useRef(true)
  const lastInteractionRef = useRef(0)

  const markInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now()
  }, [])

  const scrollByCard = useCallback((direction) => {
    const track = trackRef.current
    const card = track?.firstElementChild
    if (!track || !card) return
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0
    const step = card.getBoundingClientRect().width + gap
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4
    const atStart = track.scrollLeft <= 4

    if (direction > 0 && atEnd) track.scrollTo({ left: 0, behavior: 'smooth' })
    else if (direction < 0 && atStart) track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' })
    else track.scrollBy({ left: direction * step, behavior: 'smooth' })
  }, [])

  // Avance automático: se detiene con el mouse encima, mientras el cliente
  // interactúa, con la pestaña oculta, fuera de pantalla o si el sistema pide
  // menos movimiento.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const track = trackRef.current
    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting
    })
    if (track) observer.observe(track)

    const id = setInterval(() => {
      if (hoveringRef.current || !visibleRef.current || document.hidden) return
      if (Date.now() - lastInteractionRef.current < RESUME_AFTER_INTERACTION_MS) return
      scrollByCard(1)
    }, AUTO_ADVANCE_MS)

    return () => {
      clearInterval(id)
      observer.disconnect()
    }
  }, [scrollByCard])

  const handleArrow = (direction) => {
    markInteraction()
    scrollByCard(direction)
  }

  const arrowClass =
    'absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ivory/20 bg-ink/85 text-ivory shadow-lg backdrop-blur transition-colors hover:border-gold hover:text-gold sm:flex'

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Reveal>
        <div className="mb-10 text-center">
          <span className="text-xs uppercase tracking-widest-plus text-gold">Colecciones</span>
          <h2 className="mt-2 font-display text-3xl text-ivory sm:text-4xl">Encuentra tu fragancia</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ivory-dim">
            Explora por categoría o por el aroma que más te gusta.
          </p>
        </div>
      </Reveal>

      <div
        className="relative"
        onMouseEnter={() => {
          hoveringRef.current = true
        }}
        onMouseLeave={() => {
          hoveringRef.current = false
        }}
      >
        <div
          ref={trackRef}
          onPointerDown={markInteraction}
          onWheel={markInteraction}
          onFocus={markInteraction}
          onTouchMove={markInteraction}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {COLLECTIONS.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>

        <button type="button" aria-label="Colecciones anteriores" onClick={() => handleArrow(-1)} className={`${arrowClass} -left-3 lg:-left-5`}>
          <ArrowIcon direction="left" />
        </button>
        <button type="button" aria-label="Siguientes colecciones" onClick={() => handleArrow(1)} className={`${arrowClass} -right-3 lg:-right-5`}>
          <ArrowIcon direction="right" />
        </button>
      </div>
    </section>
  )
}
