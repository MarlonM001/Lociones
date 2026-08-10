import { Button } from '@/components/ui/Button'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-ink bg-noise">
      <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-transparent" />
      <div className="pointer-events-none absolute -right-24 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
        <div className="animate-fade-up">
          <span className="text-xs uppercase tracking-widest-plus text-gold">
            Perfumería de lujo
          </span>
          <h1 className="mt-4 font-display text-4xl leading-tight text-ivory text-balance sm:text-5xl lg:text-6xl">
            El aroma que <span className="text-gold">precede</span> tu presencia
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-ivory-dim">
            Descubre nuestra selección de lociones ARABA, para mujer y para caballero.
            Fragancias de alta fijación, curadas para quienes entienden que los detalles
            son los que se recuerdan.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button to="/catalogo" variant="primary" size="lg">
              Comprar ahora
            </Button>
            <Button to="/catalogo" variant="secondary" size="lg">
              Ver catálogo
            </Button>
          </div>
        </div>

        <div className="relative hidden justify-center lg:flex">
          <svg width="320" height="420" viewBox="0 0 320 420" className="drop-shadow-2xl">
            <defs>
              <linearGradient id="heroGlass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e4c988" />
                <stop offset="100%" stopColor="#9c7c3d" />
              </linearGradient>
              <radialGradient id="heroGlow" cx="50%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#c8a45c" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#c8a45c" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="160" cy="180" r="180" fill="url(#heroGlow)" />
            <rect x="130" y="60" width="60" height="45" rx="6" fill="#c8a45c" />
            <rect x="110" y="105" width="100" height="270" rx="20" fill="url(#heroGlass)" opacity="0.92" />
            <rect x="110" y="180" width="100" height="150" fill="#0d0c0b" opacity="0.15" />
            <text x="160" y="260" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="22" fill="#0d0c0b" opacity="0.6">
              Essence
            </text>
          </svg>
        </div>
      </div>
    </section>
  )
}
