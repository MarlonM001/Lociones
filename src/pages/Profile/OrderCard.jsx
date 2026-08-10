import { OrderStatusTimeline } from '@/components/orders/OrderStatusTimeline'
import { formatCurrency } from '@/utils/formatCurrency'

export function OrderCard({ order }) {
  return (
    <div className="rounded-2xl border border-ivory/5 bg-charcoal p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-display text-lg text-ivory">Pedido #{order.id}</p>
          <p className="text-xs text-ivory-dim">
            {new Date(order.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
            {' · '}{order.city}
          </p>
        </div>
        <p className="font-display text-lg text-gold">{formatCurrency(order.total)}</p>
      </div>

      <ul className="mt-4 space-y-1 text-sm text-ivory-dim">
        {order.items.map((item) => (
          <li key={item.productId}>
            {item.quantity} × {item.name}
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t border-ivory/10 pt-6">
        <OrderStatusTimeline status={order.status} />
      </div>
    </div>
  )
}
