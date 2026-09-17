import { Link } from 'react-router-dom'
import { formatCurrency } from '@/utils/formatCurrency'
import { useCountdown } from '@/hooks/useCountdown'

const PHASE_LABELS = {
  scheduled: { label: 'Próximamente', className: 'bg-sky-500/10 text-sky-400' },
  active: { label: 'En curso', className: 'bg-emerald-500/10 text-emerald-400' },
  closed: { label: 'Cerrada', className: 'bg-ivory/10 text-ivory-dim' },
}

function pad(n) {
  return String(n).padStart(2, '0')
}

export function AuctionCard({ auction }) {
  const countdown = useCountdown(auction.phase === 'scheduled' ? auction.startsAt : auction.endsAt)
  const phaseInfo = PHASE_LABELS[auction.phase] ?? PHASE_LABELS.closed
  const image = auction.image || auction.items[0]?.product.image

  return (
    <Link
      to={`/subastas/${auction.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ivory/5 bg-charcoal transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:shadow-xl hover:shadow-black/40"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-white p-5">
        <img
          src={image}
          alt={auction.title}
          loading="lazy"
          className="h-full w-full object-contain object-center transition-transform duration-500 group-hover:scale-110"
        />
        <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-wide ${phaseInfo.className}`}>
          {phaseInfo.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-lg leading-tight text-ivory transition-colors group-hover:text-gold">
          {auction.title}
        </h3>
        <p className="text-xs text-ivory-dim">
          {auction.kind === 'combo'
            ? `Combo: ${auction.items.map((item) => item.product.name).join(', ')}`
            : auction.items[0]?.product.name}
        </p>

        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-ivory-dim">
            {auction.bidCount > 0 ? 'Puja actual' : 'Precio inicial'}
          </span>
          <span className="font-display text-lg text-ivory">{formatCurrency(auction.currentPrice)}</span>
        </div>

        {!countdown.isOver && (
          <p className="text-xs text-gold">
            {auction.phase === 'scheduled' ? 'Empieza en ' : 'Cierra en '}
            {countdown.days > 0 && `${countdown.days}d `}
            {pad(countdown.hours)}:{pad(countdown.minutes)}:{pad(countdown.seconds)}
          </p>
        )}
      </div>
    </Link>
  )
}
