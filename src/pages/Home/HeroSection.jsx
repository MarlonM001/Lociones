import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { HERO_SLIDES } from './heroSlides'

const AUTO_ADVANCE_MS = 6000

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

function HeroBottle({ colors, label }) {
  return (
    <svg width="320" height="420" viewBox="0 0 320 420" className="drop-shadow-2xl">
      <defs>
        <linearGradient id={`heroGlass-${label}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.from} />
          <stop offset="100%" stopColor={colors.to} />
        </linearGradient>
        <radialGradient id={`heroGlow-${label}`} cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#c8a45c" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#c8a45c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="180" r="180" fill={`url(#heroGlow-${label})`} />
      <rect x="130" y="60" width="60" height="45" rx="6" fill="#c8a45c" />
      <rect x="110" y="105" width="100" height="270" rx="20" fill={`url(#heroGlass-${label})`} opacity="0.92" />
      <rect x="110" y="180" width="100" height="150" fill="#0d0c0b" opacity="0.15" />
      <text
        x="160"
        y="260"
        textAnchor="middle"
        fontFamily="Cormorant Garamond, serif"
        fontSize="20"
        fill="#0d0c0b"
        opacity="0.6"
      >
        {label}
      </text>
    </svg>
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

  return (
    <section
      className="relative overflow-hidden bg-ink bg-noise"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-transparent" />
      <div className="pointer-events-none absolute -right-24 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative mx-auto min-h-[600px] max-w-7xl px-4 py-20 sm:px-6 lg:min-h-[620px] lg:px-8 lg:py-28">
        {HERO_SLIDES.map((slide, slideIndex) => {
          const isActive = slideIndex === index
          return (
            <div
              key={slide.id}
              aria-hidden={!isActive}
              className={`grid items-center gap-12 transition-opacity duration-700 ease-out lg:grid-cols-2 ${
                isActive ? 'relative opacity-100' : 'pointer-events-none absolute inset-0 opacity-0'
              }`}
            >
              <div className={isActive ? 'animate-fade-up' : ''}>
                <span className="text-xs uppercase tracking-widest-plus text-gold">{slide.eyebrow}</span>
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

              <div className="relative hidden justify-center lg:flex">
                <HeroBottle colors={slide.bottleColors} label={slide.bottleLabel} />
              </div>
            </div>
          )
        })}
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
