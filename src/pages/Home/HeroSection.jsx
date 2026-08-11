import { lazy, Suspense, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { HERO_SLIDES } from './heroSlides'

// three.js solo se descarga cuando hace falta (pantallas lg+, ver más abajo),
// para no inflar el bundle inicial de todos los visitantes.
const Bottle3D = lazy(() => import('@/components/three/Bottle3D').then((m) => ({ default: m.Bottle3D })))

const AUTO_ADVANCE_MS = 6000

const SPARKLES = [
  { top: '16%', left: '8%', size: 6, delay: '0s' },
  { top: '30%', left: '44%', size: 4, delay: '1.4s' },
  { top: '70%', left: '13%', size: 5, delay: '2.6s' },
  { top: '80%', left: '55%', size: 3, delay: '0.8s' },
  { top: '12%', left: '60%', size: 4, delay: '3.4s' },
  { top: '52%', left: '5%', size: 3, delay: '2s' },
]

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

/** Silueta grande de botella detrás de todo, para anclar el tema de perfumería sin competir con el contenido. */
function HeroBackdropBottle() {
  return (
    <svg
      viewBox="0 0 320 420"
      className="pointer-events-none absolute -left-28 bottom-0 h-[95%] w-auto text-gold opacity-[0.05] sm:-left-16 lg:left-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    >
      <rect x="130" y="55" width="60" height="48" rx="6" />
      <rect x="108" y="103" width="104" height="280" rx="22" />
      <line x1="108" y1="182" x2="212" y2="182" />
    </svg>
  )
}

/** Motas doradas flotando, como la bruma de un atomizador de perfume. */
function FloatingSparkles() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden sm:block">
      {SPARKLES.map((sparkle, i) => (
        <span
          key={i}
          className="animate-sparkle absolute rounded-full bg-gold"
          style={{
            top: sparkle.top,
            left: sparkle.left,
            width: sparkle.size,
            height: sparkle.size,
            animationDelay: sparkle.delay,
          }}
        />
      ))}
    </div>
  )
}

export function HeroSection() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return undefined
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % HERO_SLIDES.length)
    }, AUTO_ADVANCE_MS)
    return () => clearInterval(id)
  }, [paused])

  const goTo = (nextIndex) => {
    setIndex((nextIndex + HERO_SLIDES.length) % HERO_SLIDES.length)
  }

  const isLargeScreen = useMediaQuery('(min-width: 1024px)')
  const activeSlide = HERO_SLIDES[index]
  const activeColors = activeSlide.bottleColors

  return (
    <section
      className="relative overflow-hidden bg-ink bg-noise"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-transparent" />
      <div
        className="pointer-events-none absolute -right-24 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full blur-3xl transition-colors duration-1000"
        style={{ backgroundColor: `${activeColors.from}26` }}
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-0 h-[280px] w-[280px] rounded-full blur-3xl transition-colors duration-1000"
        style={{ backgroundColor: `${activeColors.to}1f` }}
      />
      <HeroBackdropBottle />
      <FloatingSparkles />

      <div className="relative mx-auto grid min-h-[600px] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:min-h-[620px] lg:grid-cols-2 lg:px-8 lg:py-28">
        <div className="relative">
          {HERO_SLIDES.map((slide, slideIndex) => {
            const isActive = slideIndex === index
            return (
              <div
                key={slide.id}
                aria-hidden={!isActive}
                className={`transition-opacity duration-700 ease-out ${
                  isActive ? 'relative opacity-100 animate-fade-up' : 'pointer-events-none absolute inset-0 opacity-0'
                }`}
              >
                <span className="text-xs uppercase tracking-widest-plus text-gold">{slide.eyebrow}</span>
                <div className="mt-3 flex items-center gap-3">
                  <span className="h-px w-8 bg-gold/50" />
                  <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
                  <span className="h-px w-8 bg-gold/50" />
                </div>
                <h1 className="mt-4 font-display text-4xl leading-tight text-ivory text-balance sm:text-5xl lg:text-6xl">
                  {slide.titleBefore} <span className="text-gold">{slide.titleHighlight}</span> {slide.titleAfter}
                </h1>
                <p className="mt-6 max-w-lg text-base leading-relaxed text-ivory-dim">{slide.description}</p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Button to={slide.primaryCta.to} variant="primary" size="lg">
                    {slide.primaryCta.label}
                  </Button>
                  <Button to={slide.secondaryCta.to} variant="secondary" size="lg">
                    {slide.secondaryCta.label}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Un solo canvas 3D persistente: cambia de color según la colección activa en
            lugar de reiniciarse en cada avance del carrusel, para no perder la rotación
            que el visitante haya dejado con el mouse. */}
        <div className="relative hidden justify-center lg:flex">
          {/* Círculo grande tipo espejo de agua detrás de la botella, como si flotara sobre él. */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-md transition-colors duration-1000"
            style={{
              background: `radial-gradient(circle at 50% 42%, ${activeColors.from}3d 0%, #1b6f8c26 45%, transparent 72%)`,
            }}
          />
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/15"
            aria-hidden="true"
          />
          <div
            className="animate-ripple pointer-events-none absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/40"
            aria-hidden="true"
          />
          <div
            className="animate-ripple pointer-events-none absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/40"
            style={{ animationDelay: '2.2s' }}
            aria-hidden="true"
          />

          {isLargeScreen && (
            <Suspense fallback={<div className="h-[420px] w-[320px]" />}>
              <Bottle3D colors={activeColors} label={activeSlide.bottleLabel} />
            </Suspense>
          )}
        </div>
      </div>

      {/* Controles agrupados abajo (no a los lados) para que nunca choquen con
          el texto, sin importar cuántas líneas ocupe la descripción de cada slide. */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-4">
        <button
          type="button"
          aria-label="Diapositiva anterior"
          onClick={() => goTo(index - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ivory/15 bg-ink/50 text-ivory backdrop-blur transition-colors hover:border-gold hover:text-gold"
        >
          <ArrowIcon direction="left" />
        </button>

        <div className="flex gap-2">
          {HERO_SLIDES.map((slide, dotIndex) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Ir a la diapositiva ${dotIndex + 1}`}
              onClick={() => goTo(dotIndex)}
              className={`h-1.5 rounded-full transition-all ${
                dotIndex === index ? 'w-6 bg-gold' : 'w-1.5 bg-ivory/30 hover:bg-ivory/50'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Siguiente diapositiva"
          onClick={() => goTo(index + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ivory/15 bg-ink/50 text-ivory backdrop-blur transition-colors hover:border-gold hover:text-gold"
        >
          <ArrowIcon direction="right" />
        </button>
      </div>
    </section>
  )
}
