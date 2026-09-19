import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CATEGORIES, getCategoryBySlug } from '@/config/categories'
import { getProducts, getBestsellerProducts } from '@/services/products'
import { ProductCard } from '@/components/product/ProductCard'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'

const PAGE_SIZE = 24
const TOP_SELLERS_LIMIT = 100

/** `topSellers`: en vez del catálogo completo, muestra solo las lociones de top ventas (ruta /top-ventas). */
export function Catalog({ topSellers = false }) {
  const { categorySlug } = useParams()
  const navigate = useNavigate()
  const activeCategory = categorySlug ? getCategoryBySlug(categorySlug) : null

  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const request = topSellers
      ? getBestsellerProducts(TOP_SELLERS_LIMIT)
      : getProducts({ categoryId: activeCategory?.id, onlyInStock: true })
    request.then((products) => {
      if (!cancelled) {
        setAllProducts(products)
        setVisibleCount(PAGE_SIZE)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [activeCategory?.id, topSellers])

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return allProducts
    const term = search.trim().toLowerCase()
    return allProducts.filter((product) => product.name.toLowerCase().includes(term))
  }, [allProducts, search])

  const visibleProducts = filteredProducts.slice(0, visibleCount)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs uppercase tracking-widest-plus text-gold">Catálogo</span>
          <h1 className="mt-1 font-display text-3xl text-ivory sm:text-4xl">
            {topSellers ? 'Top ventas' : activeCategory ? activeCategory.name : 'Todas las lociones'}
          </h1>
          <p className="mt-1 text-sm text-ivory-dim">
            {topSellers
              ? `Las ${filteredProducts.length} lociones favoritas de nuestros clientes`
              : `${filteredProducts.length} productos disponibles`}
          </p>
        </div>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar loción..."
          aria-label="Buscar loción"
          className="w-full rounded-full border border-ivory/10 bg-charcoal px-4 py-2 text-sm text-ivory placeholder:text-ivory-dim/60 focus:border-gold focus:outline-none sm:w-64"
        />
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => navigate('/catalogo')}
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
            !activeCategory && !topSellers
              ? 'border-gold bg-gold/10 text-gold'
              : 'border-ivory/10 text-ivory-dim hover:text-ivory'
          }`}
        >
          Todas
        </button>
        <button
          type="button"
          onClick={() => navigate('/top-ventas')}
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
            topSellers ? 'border-gold bg-gold/10 text-gold' : 'border-ivory/10 text-ivory-dim hover:text-ivory'
          }`}
        >
          Top ventas
        </button>
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => navigate(`/productos/${category.slug}`)}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              !topSellers && activeCategory?.id === category.id
                ? 'border-gold bg-gold/10 text-gold'
                : 'border-ivory/10 text-ivory-dim hover:text-ivory'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading label="Cargando lociones..." />
      ) : visibleProducts.length === 0 ? (
        <EmptyState
          title="No hay productos disponibles"
          message="Prueba con otra categoría o cambia tu búsqueda."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {visibleCount < filteredProducts.length && (
            <div className="mt-10 flex justify-center">
              <Button variant="secondary" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                Cargar más
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
