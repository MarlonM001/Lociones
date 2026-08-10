import { useEffect, useState } from 'react'
import { getFeaturedProducts } from '@/services/products'
import { ProductCard } from '@/components/product/ProductCard'
import { Loading } from '@/components/ui/Loading'
import { Button } from '@/components/ui/Button'

export function FeaturedSection() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFeaturedProducts(8).then((items) => {
      setProducts(items)
      setLoading(false)
    })
  }, [])

  return (
    <section className="border-t border-gold/10 bg-charcoal/40 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col items-center gap-2 text-center">
          <span className="text-xs uppercase tracking-widest-plus text-gold">Selección</span>
          <h2 className="font-display text-3xl text-ivory sm:text-4xl">Lo más destacado</h2>
        </div>

        {loading ? (
          <Loading label="Cargando destacados..." />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Button to="/catalogo" variant="secondary">
            Ver todo el catálogo
          </Button>
        </div>
      </div>
    </section>
  )
}
