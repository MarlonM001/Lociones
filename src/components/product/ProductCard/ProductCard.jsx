import { Link } from 'react-router-dom'
import { formatCurrency } from '@/utils/formatCurrency'
import { getCategoryById } from '@/config/categories'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/hooks/useToast'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { Button } from '@/components/ui/Button'

export function ProductCard({ product }) {
  const { addItem } = useCart()
  const { showToast } = useToast()
  const requireAuth = useRequireAuth()
  const category = getCategoryById(product.categoryId)
  const inStock = product.stock > 0

  const handleAddToCart = (event) => {
    event.preventDefault()
    requireAuth(() => {
      addItem(product, 1)
      showToast('Producto agregado al carrito')
    })
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-ivory/5 bg-charcoal transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:shadow-xl hover:shadow-black/40">
      <Link to={`/producto/${product.slug}`} className="block aspect-[4/5] w-full overflow-hidden bg-ink">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-[11px] uppercase tracking-widest-plus text-gold/80">
          {category?.name}
        </span>
        <Link to={`/producto/${product.slug}`}>
          <h3 className="font-display text-lg leading-tight text-ivory transition-colors group-hover:text-gold">
            {product.name}
          </h3>
        </Link>
        <p className="line-clamp-2 text-sm text-ivory-dim">{product.shortDescription}</p>

        <div className="mt-1 flex items-center justify-between">
          <span className="font-display text-lg text-ivory">{formatCurrency(product.price)}</span>
          <span className={`text-xs ${inStock ? 'text-emerald-400' : 'text-red-400'}`}>
            {inStock ? 'Disponible' : 'Agotado'}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <Button to={`/producto/${product.slug}`} variant="secondary" size="sm">
            Ver producto
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!inStock}
            onClick={handleAddToCart}
          >
            Agregar al carrito
          </Button>
        </div>
      </div>
    </div>
  )
}
