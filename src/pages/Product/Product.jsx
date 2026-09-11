import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProductBySlug, getRelatedProducts } from '@/services/products'
import { getCategoryById } from '@/config/categories'
import { generateWhatsAppProductInquiry } from '@/services/whatsapp'
import { formatCurrency } from '@/utils/formatCurrency'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/hooks/useToast'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProductCard } from '@/components/product/ProductCard'

export function Product() {
  const { slug } = useParams()
  const { addItem } = useCart()
  const { showToast } = useToast()
  const requireAuth = useRequireAuth()

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setQuantity(1)
    setActiveImage(0)

    getProductBySlug(slug).then(async (found) => {
      if (cancelled) return
      setProduct(found)
      if (found) {
        const relatedItems = await getRelatedProducts(found)
        if (!cancelled) setRelated(relatedItems)
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) return <Loading fullScreen label="Cargando producto..." />

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          title="Producto no encontrado"
          message="Es posible que el enlace sea incorrecto o el producto ya no esté disponible."
          action={<Button to="/catalogo">Volver al catálogo</Button>}
        />
      </div>
    )
  }

  const category = getCategoryById(product.categoryId)
  const inStock = product.stock > 0
  const maxQuantity = Math.max(1, product.stock)

  const handleAddToCart = () => {
    requireAuth(() => {
      addItem(product, quantity)
      showToast('Producto agregado al carrito')
    })
  }

  const handleBuyOnWhatsApp = () => {
    requireAuth(() => {
      window.open(generateWhatsAppProductInquiry(product, quantity), '_blank', 'noopener')
    })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-8 text-xs text-ivory-dim">
        <Link to="/catalogo" className="hover:text-ivory">Catálogo</Link>
        <span className="mx-2">/</span>
        <Link to={`/productos/${category?.slug}`} className="hover:text-ivory">{category?.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-ivory">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-square w-full overflow-hidden rounded-2xl border border-ivory/5 bg-charcoal">
            <img
              src={product.images[activeImage] ?? product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border transition-colors ${
                    activeImage === index ? 'border-gold' : 'border-ivory/10'
                  }`}
                >
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="text-xs uppercase tracking-widest-plus text-gold">{category?.name}</span>
          <h1 className="mt-2 font-display text-3xl text-ivory sm:text-4xl">{product.name}</h1>
          <p className="mt-4 font-display text-2xl text-gold">{formatCurrency(product.price)}</p>

          <p className="mt-6 leading-relaxed text-ivory-dim">{product.description}</p>

          <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-ivory/5 p-4 text-sm">
            <div>
              <dt className="text-ivory-dim">SKU</dt>
              <dd className="text-ivory">{product.sku}</dd>
            </div>
            <div>
              <dt className="text-ivory-dim">Disponibilidad</dt>
              <dd className={inStock ? 'text-emerald-400' : 'text-red-400'}>
                {inStock ? `${product.stock} unidades` : 'Agotado'}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex items-center gap-4">
            <label htmlFor="quantity" className="text-sm text-ivory-dim">Cantidad</label>
            <div className="flex items-center rounded-full border border-ivory/10">
              <button
                type="button"
                className="px-3 py-1.5 text-ivory disabled:opacity-30"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                −
              </button>
              <span id="quantity" className="w-8 text-center text-ivory">{quantity}</span>
              <button
                type="button"
                className="px-3 py-1.5 text-ivory disabled:opacity-30"
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                disabled={quantity >= maxQuantity}
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button variant="primary" size="lg" disabled={!inStock} onClick={handleAddToCart} fullWidth>
              Agregar al carrito
            </Button>
            <Button variant="whatsapp" size="lg" disabled={!inStock} onClick={handleBuyOnWhatsApp} fullWidth>
              Comprar por WhatsApp
            </Button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 font-display text-2xl text-ivory">También te puede interesar</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
