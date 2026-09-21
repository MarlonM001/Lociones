import { Link } from 'react-router-dom'
import { PriceTag } from '@/components/ui/Price'
import { getCategoryById } from '@/config/categories'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'

export function ProductCard({ product, image }) {
  const { addItem } = useCart()
  const { showToast } = useToast()
  const category = getCategoryById(product.categoryId)
  const inStock = product.stock > 0

  const handleAddToCart = (event) => {
    event.preventDefault()
    addItem(product, 1)
    showToast('Producto agregado al carrito')
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-ivory/5 bg-charcoal transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:shadow-xl hover:shadow-black/40">
      <Link to={`/producto/${product.slug}`} className="block aspect-[4/5] w-full overflow-hidden bg-white p-5">
        <img
          src={image ?? product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain object-center transition-transform duration-500 group-hover:scale-110"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs uppercase tracking-widest-plus text-gold">
          {category?.name}
        </span>
        <Link to={`/producto/${product.slug}`}>
          <h3 className="line-clamp-2 min-h-[2.5rem] font-display text-lg leading-tight text-ivory transition-colors group-hover:text-gold">
            {product.name}
          </h3>
        </Link>
        <p className="line-clamp-2 text-sm text-ivory-dim">{product.shortDescription}</p>

        <div className="mt-1 flex items-center justify-between">
          <PriceTag product={product} className="text-lg text-gold" />
          <span className={`text-xs ${inStock ? 'text-success' : 'text-danger'}`}>
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
