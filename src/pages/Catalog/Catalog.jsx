import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { CATEGORIES, getCategoryBySlug } from '@/config/categories'
import { getFragranceFamily, matchesFragranceFamily } from '@/config/fragranceFamilies'
import { getProducts, getBestsellerProducts } from '@/services/products'
import { ProductCard } from '@/components/product/ProductCard'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

const PAGE_SIZE = 24
const TOP_SELLERS_LIMIT = 100

/** Los productos que todavía no tienen foto real (usan una ilustración de relleno) van al final de la lista. */
function hasRealPhoto(product) {
  return !/placeholder|\/products\/[a-z]+\.svg$/i.test(product.image ?? '')
}

function countLabel(total) {
  return `${total} ${total === 1 ? 'producto disponible' : 'productos disponibles'}`
}

/** `topSellers`: en vez del catálogo completo, muestra solo las lociones de top ventas (ruta /top-ventas). */
export function Catalog({ topSellers = false }) {
  const { categorySlug } = useParams()
  const navigate = useNavigate()
  const activeCategory = categorySlug ? getCategoryBySlug(categorySlug) : null
  const [searchParams] = useSearchParams()
  // ?familia=citricos: filtra por familia olfativa (ver config/fragranceFamilies).
  const activeFamily = topSellers ? null : getFragranceFamily(searchParams.get('familia'))

  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Al pasar de una categoría, familia o "Top ventas" a otra, el texto de búsqueda se retoma de la URL
  // (?q=...), por ejemplo cuando llega desde el buscador de la barra de navegación.
  const familyParam = searchParams.get('familia')
  const queryParam = searchParams.get('q') ?? ''
  useEffect(() => {
    setSearch(queryParam)
  }, [categorySlug, familyParam, topSellers, queryParam])

  const pageTitle = topSellers
    ? 'Top ventas'
    : activeFamily
      ? `Perfumes ${activeFamily.name.toLowerCase()}`
      : activeCategory
        ? `Lociones ${activeCategory.name}`
        : 'Catálogo de lociones'
  useDocumentMeta({
    title: pageTitle,
    description: activeCategory?.shortDescription
      ? `${activeCategory.shortDescription} Envíos a toda Colombia, pedido confirmado por WhatsApp.`
      : 'Explora todas las lociones de Essence Polar: árabes, para mujer y para caballero. Envíos a toda Colombia, pedido confirmado por WhatsApp.',
  })

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
    let products = allProducts
    if (activeFamily) products = products.filter((product) => matchesFragranceFamily(product, activeFamily))
    if (search.trim()) {
      const term = search.trim().toLowerCase()
      products = products.filter((product) => product.name.toLowerCase().includes(term))
    }
    // Orden estable: primero los que tienen foto real, después los que aún no.
    return [...products.filter(hasRealPhoto), ...products.filter((product) => !hasRealPhoto(product))]
  }, [allProducts, activeFamily, search])

  const visibleProducts = filteredProducts.slice(0, visibleCount)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <span className="text-xs uppercase tracking-widest-plus text-gold">Catálogo</span>
        <h1 className="mt-1 font-display text-3xl text-ivory sm:text-4xl">
          {topSellers
            ? 'Top ventas'
            : activeFamily
              ? `Perfumes ${activeFamily.name.toLowerCase()}`
              : activeCategory
                ? activeCategory.name
                : 'Todas las lociones'}
        </h1>
        <p className="mt-1 text-sm text-ivory-dim">
          {topSellers
            ? `Las ${filteredProducts.length} lociones favoritas de nuestros clientes`
            : countLabel(filteredProducts.length)}
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => navigate('/catalogo')}
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
            !activeCategory && !topSellers && !activeFamily
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
