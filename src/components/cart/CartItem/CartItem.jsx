import { Link } from 'react-router-dom'
import { formatCurrency } from '@/utils/formatCurrency'
import { useCart } from '@/hooks/useCart'

export function CartItem({ item }) {
  const { updateQuantity, removeItem } = useCart()

  return (
    <div className="flex items-center gap-4 border-b border-ivory/5 py-4 last:border-0">
      <Link to={`/producto/${item.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-charcoal">
        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
      </Link>

      <div className="min-w-0 flex-1">
        <Link to={`/producto/${item.slug}`} className="line-clamp-1 font-display text-base text-ivory hover:text-gold">
          {item.name}
        </Link>
        <p className="mt-1 text-sm text-ivory-dim">{formatCurrency(item.price)}</p>

        <div className="mt-2 flex items-center gap-3">
          <div className="flex items-center rounded-full border border-ivory/10">
            <button
              type="button"
              className="px-2.5 py-1 text-ivory disabled:opacity-30"
              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              −
            </button>
            <span className="w-6 text-center text-sm text-ivory">{item.quantity}</span>
            <button
              type="button"
              className="px-2.5 py-1 text-ivory disabled:opacity-30"
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              disabled={item.quantity >= (item.stock || 99)}
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => removeItem(item.productId)}
            className="text-xs text-ivory-dim underline-offset-2 hover:text-red-400 hover:underline"
          >
            Eliminar
          </button>
        </div>
      </div>

      <p className="font-display text-base text-ivory">{formatCurrency(item.price * item.quantity)}</p>
    </div>
  )
}
