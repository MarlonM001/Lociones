import { useEffect, useMemo, useState } from 'react'
import { getProducts, updateProduct } from '@/services/products'
import { getCategoryById } from '@/config/categories'
import { formatCurrency } from '@/utils/formatCurrency'
import { useToast } from '@/hooks/useToast'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { BestsellerRow } from './BestsellerRow'

function sortByRank(products) {
  return [...products].sort((a, b) => {
    const rankA = a.bestsellerRank ?? Infinity
    const rankB = b.bestsellerRank ?? Infinity
    if (rankA !== rankB) return rankA - rankB
    return a.id - b.id
  })
}

export function AdminBestsellers() {
  const { showToast } = useToast()
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    const items = await getProducts({ includeInactive: true })
    setAllProducts(items)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const bestsellers = useMemo(
    () => sortByRank(allProducts.filter((product) => product.isBestseller)),
    [allProducts],
  )

  const searchResults = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return []
    const normalizedTerm = term.replace(/-/g, ' ')
    return allProducts
      .filter((product) => !product.isBestseller)
      .filter((product) => {
        const name = product.name.toLowerCase()
        return (
          name.includes(term) ||
          name.includes(normalizedTerm) ||
          product.sku.toLowerCase().includes(term) ||
          product.slug?.toLowerCase().includes(term)
        )
      })
      .slice(0, 8)
  }, [allProducts, search])

  const persistOrder = async (orderedList) => {
    setBusy(true)
    try {
      await Promise.all(
        orderedList.map((product, index) => updateProduct(product.id, { bestsellerRank: index + 1 })),
      )
      await load()
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleMoveUp = (product) => {
    const index = bestsellers.findIndex((item) => item.id === product.id)
    if (index <= 0) return
    const reordered = [...bestsellers]
    ;[reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]]
    persistOrder(reordered)
  }

  const handleMoveDown = (product) => {
    const index = bestsellers.findIndex((item) => item.id === product.id)
    if (index === -1 || index >= bestsellers.length - 1) return
    const reordered = [...bestsellers]
    ;[reordered[index + 1], reordered[index]] = [reordered[index], reordered[index + 1]]
    persistOrder(reordered)
  }

  const handleAdd = async (product) => {
    setBusy(true)
    try {
      await updateProduct(product.id, { isBestseller: true, bestsellerRank: bestsellers.length + 1 })
      setSearch('')
      showToast(`"${product.name}" agregado a Top ventas`)
      await load()
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async (product) => {
    setBusy(true)
    try {
      await updateProduct(product.id, { isBestseller: false, bestsellerRank: '' })
      showToast(`"${product.name}" ya no aparece en Top ventas`)
      const remaining = bestsellers.filter((item) => item.id !== product.id)
      await persistOrder(remaining)
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleImageChange = async (product, file) => {
    setBusy(true)
    try {
      await updateProduct(product.id, { bestsellerImageFile: file })
      showToast('Foto especial actualizada')
      await load()
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Loading label="Cargando Top ventas..." />

  return (
    <div>
      <h1 className="font-display text-3xl text-ivory">Top ventas</h1>
      <p className="mt-1 max-w-2xl text-sm text-ivory-dim">
        Elige qué lociones aparecen en el carrusel "Top ventas" de la página principal, en qué orden, y
        opcionalmente una foto especial distinta a la del catálogo para lucir mejor ahí.
      </p>

      <div className="mt-6 max-w-xl">
        <label className="mb-1 block text-sm text-ivory-dim">Agregar producto</label>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Busca por nombre o SKU para agregarlo a Top ventas..."
          className="w-full rounded-full border border-ivory/10 bg-charcoal px-4 py-2 text-sm text-ivory placeholder:text-ivory-dim/60 focus:border-gold focus:outline-none"
        />

        {searchResults.length > 0 && (
          <div className="mt-2 overflow-hidden rounded-2xl border border-ivory/5 bg-charcoal">
            {searchResults.map((product) => {
              const category = getCategoryById(product.categoryId)
              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={busy}
                  onClick={() => handleAdd(product)}
                  className="flex w-full items-center gap-3 border-b border-ivory/5 px-4 py-3 text-left transition-colors last:border-0 hover:bg-ivory/5 disabled:opacity-50"
                >
                  <img src={product.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  <span className="flex-1">
                    <span className="block text-sm text-ivory">{product.name}</span>
                    <span className="block text-xs text-ivory-dim">
                      {category?.name} · {formatCurrency(product.price)}
                    </span>
                  </span>
                  <span className="text-xs text-gold">+ Agregar</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-8">
        {bestsellers.length === 0 ? (
          <EmptyState
            title="Aún no hay productos en Top ventas"
            message="Usa el buscador de arriba para agregar las lociones que más quieras destacar. El carrusel del home solo aparece cuando hay al menos un producto aquí."
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-ivory/5 bg-charcoal">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="border-b border-ivory/10 text-left text-xs uppercase tracking-wide text-ivory-dim">
                  <th className="px-4 py-3 text-center">#</th>
                  <th className="px-4 py-3">Foto</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Foto especial</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {bestsellers.map((product, index) => (
                  <BestsellerRow
                    key={product.id}
                    product={product}
                    position={index + 1}
                    isFirst={index === 0}
                    isLast={index === bestsellers.length - 1}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    onRemove={handleRemove}
                    onImageChange={handleImageChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
