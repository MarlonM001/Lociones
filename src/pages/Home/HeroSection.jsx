import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { HERO_SLIDES } from './heroSlides'

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

/** Botella con apariencia 3D: gradientes que simulan el cilindro de vidrio,
 * tapón con relieve metálico, reflejo de luz y sombra de contacto en el piso. */
function HeroBottle({ colors, label }) {
  const glassId = `heroGlass-${label}`
  const shadeId = `heroShade-${label}`
  const capId = `heroCap-${label}`
  const shineId = `heroShine-${label}`
  const groundId = `heroGround-${label}`

  return (
    <div className="[perspective:1200px]">
      <svg
        width="320"
        height="440"
        viewBox="0 0 320 440"
        className="drop-shadow-2xl"
        style={{ transform: 'rotateY(-10deg) rotateX(2deg)', transformStyle: 'preserve-3d' }}
      >
        <defs>
          {/* Sombreado horizontal: borde-oscuro > luz > borde-oscuro, simula el cilindro del vidrio. */}
          <linearGradient id={glassId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={colors.to} />
            <stop offset="20%" stopColor={colors.from} />
            <stop offset="52%" stopColor={colors.from} />
            <stop offset="84%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
          {/* Caída de luz vertical: brillo arriba, sombra abajo, da sensación de volumen. */}
          <linearGradient id={shadeId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="28%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id={capId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7d5f22" />
            <stop offset="25%" stopColor="#e4c988" />
            <stop offset="50%" stopColor="#c8a45c" />
            <stop offset="75%" stopColor="#e4c988" />
            <stop offset="100%" stopColor="#7d5f22" />
          </linearGradient>
          <linearGradient id={shineId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`heroGlow-${label}`} cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#c8a45c" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#c8a45c" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={groundId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="160" cy="180" r="180" fill={`url(#heroGlow-${label})`} />

        {/* Sombra de contacto: ancla la botella al piso en vez de flotar. */}
        <ellipse cx="160" cy="400" rx="80" ry="16" fill={`url(#${groundId})`} />

        {/* Tapón: cuerpo + aro superior con relieve metálico. */}
        <rect x="128" y="52" width="64" height="50" rx="8" fill={`url(#${capId})`} />
        <ellipse cx="160" cy="52" rx="32" ry="7" fill="#e4c988" />
        <ellipse cx="160" cy="52" rx="32" ry="7" fill="none" stroke="#0d0c0b" strokeOpacity="0.12" />
        <rect x="144" y="96" width="32" height="16" fill={colors.to} />

        {/* Cuerpo de vidrio: gradiente cilíndrico + caída de luz superpuesta. */}
        <rect x="108" y="108" width="104" height="278" rx="22" fill={`url(#${glassId})`} />
        <rect x="108" y="108" width="104" height="278" rx="22" fill={`url(#${shadeId})`} />

        {/* Reflejo de luz: franja vertical que simula el brillo del vidrio curvo. */}
        <rect x="124" y="122" width="13" height="246" rx="6.5" fill={`url(#${shineId})`} opacity="0.55" />

        <text
          x="160"
          y="270"
          textAnchor="middle"
          fontFamily="Cormorant Garamond, serif"
          fontSize="20"
          fill="#0d0c0b"
          opacity="0.6"
        >
          {label}
        </text>
      </svg>
    </div>
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

  const activeColors = HERO_SLIDES[index].bottleColors

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
