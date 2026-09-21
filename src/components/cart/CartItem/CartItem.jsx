import { Link } from 'react-router-dom'
import { Price } from '@/components/ui/Price'
import { useCart } from '@/hooks/useCart'

export function CartItem({ item }) {
  const { updateQuantity, removeItem } = useCart()

  return (
    <div className="flex items-center gap-3 border-b border-ivory/5 py-4 last:border-0 sm:gap-4">
      <Link to={`/producto/${item.slug}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white p-2 sm:h-20 sm:w-20">
        <img src={item.image} alt={item.name} loading="lazy" decoding="async" className="h-full w-full object-contain object-center" />
      </Link>

      <div className="min-w-0 flex-1">
        <Link to={`/producto/${item.slug}`} className="line-clamp-1 font-display text-base text-ivory hover:text-gold">
          {item.name}
        </Link>
        <p className="mt-1 text-sm text-ivory-dim">
          <Price value={item.price} className="font-semibold" />
          {item.regularPrice > item.price && (
            <span className="ml-2 text-xs line-through decoration-ivory-dim/60">
              <Price value={item.regularPrice} />
            </span>
          )}
          {item.quantity > 1 && (
            <span className="sm:hidden">
              {' '}× {item.quantity} = <Price value={item.price * item.quantity} className="font-semibold text-gold" />
            </span>
          )}
        </p>

        <div className="mt-2 flex items-center gap-3">
          <div className="flex items-center rounded-full border border-ivory/10">
            <button
              type="button"
              aria-label="Disminuir cantidad"
              className="flex h-11 w-11 items-center justify-center text-ivory disabled:opacity-30"
              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              −
            </button>
            <span className="w-6 text-center text-sm text-ivory">{item.quantity}</span>
            <button
              type="button"
              aria-label="Aumentar cantidad"
              className="flex h-11 w-11 items-center justify-center text-ivory disabled:opacity-30"
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              disabled={item.quantity >= (item.stock || 99)}
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => removeItem(item.productId)}
            className="text-xs text-ivory-dim underline-offset-2 hover:text-danger hover:underline"
          >
            Eliminar
          </button>
        </div>
      </div>

      <Price value={item.price * item.quantity} className="hidden text-lg text-gold sm:block" />
    </div>
  )
}
