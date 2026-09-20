function TruckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M2.5 6h11v10h-11z" strokeLinejoin="round" />
      <path d="M13.5 10h4l3 3.2V16h-7z" strokeLinejoin="round" />
      <circle cx="6.5" cy="17.5" r="1.6" />
      <circle cx="16.5" cy="17.5" r="1.6" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path
        d="M4 12a8 8 0 1 1 3.2 6.4L4 19.5l1.1-3.1A7.96 7.96 0 0 1 4 12Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 3.5 19 6v6c0 4.4-3 7.4-7 8.5-4-1.1-7-4.1-7-8.5V6Z" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </svg>
  )
}

const ITEMS = [
  { title: 'Envíos nacionales', detail: 'A toda Colombia', Icon: TruckIcon },
  { title: 'Atención directa', detail: 'Pedidos confirmados por WhatsApp', Icon: ChatIcon },
  { title: 'Calidad garantizada', detail: 'Selección curada de fragancias', Icon: ShieldIcon },
  { title: 'Pago seguro', detail: 'Confirmas antes de pagar', Icon: LockIcon },
]

export function TrustBar() {
  return (
    <section className="border-y border-gold/10 bg-ink/60">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4 lg:px-8">
        {ITEMS.map(({ title, detail, Icon }) => (
          <div key={title} className="flex flex-col items-center gap-2 text-center lg:flex-row lg:items-start lg:text-left">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/5 text-gold">
              <Icon />
            </span>
            <span>
              <p className="font-display text-base text-gold">{title}</p>
              <p className="mt-1 text-xs text-ivory-dim">{detail}</p>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
