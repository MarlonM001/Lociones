const ITEMS = [
  { title: 'Envíos rápidos', detail: 'Bogotá y Yopal, Casanare' },
  { title: 'Atención directa', detail: 'Pedidos confirmados por WhatsApp' },
  { title: 'Calidad garantizada', detail: 'Selección curada de fragancias' },
  { title: 'Pago seguro', detail: 'Confirmas antes de pagar' },
]

export function TrustBar() {
  return (
    <section className="border-y border-gold/10 bg-ink/60">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4 lg:px-8">
        {ITEMS.map((item) => (
          <div key={item.title} className="text-center lg:text-left">
            <p className="font-display text-base text-gold">{item.title}</p>
            <p className="mt-1 text-xs text-ivory-dim">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
