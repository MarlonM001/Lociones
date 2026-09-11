import { useEffect, useMemo, useState } from 'react'
import { getProducts, setProductActive, deleteProduct } from '@/services/products'
import { CATEGORIES } from '@/config/categories'
import { useToast } from '@/hooks/useToast'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/Modal'
import { ProductRow } from './ProductRow'
import { ProductFormModal } from './ProductFormModal'

const PAGE_SIZE = 20

export function AdminProducts() {
  const { showToast } = useToast()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deletingProduct, setDeletingProduct] = useState(null)

  const load = async () => {
    const items = await getProducts({ includeInactive: true })
    setProducts(items)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    let results = products
    if (categoryFilter) results = results.filter((p) => p.categoryId === categoryFilter)
    if (statusFilter === 'active') results = results.filter((p) => p.active)
    if (statusFilter === 'inactive') results = results.filter((p) => !p.active)
    if (search.trim()) {
      const term = search.trim().toLowerCase()
      results = results.filter((p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term))
    }
    return results
  }, [products, categoryFilter, statusFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetToFirstPage = () => setPage(1)

  const handleToggleActive = async (product) => {
    await setProductActive(product.id, !product.active)
    showToast(product.active ? 'Producto desactivado' : 'Producto activado')
    load()
  }

  const handleDelete = async () => {
    await deleteProduct(deletingProduct.id)
    showToast('Producto eliminado')
    setDeletingProduct(null)
    load()
  }

  const openCreate = () => {
    setEditingProduct(null)
    setFormOpen(true)
  }

  const openEdit = (product) => {
    setEditingProduct(product)
    setFormOpen(true)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ivory">Productos</h1>
          <p className="mt-1 text-sm text-ivory-dim">{filtered.length} productos encontrados</p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ Nuevo producto</Button>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={search}
          onChange={(event) => { setSearch(event.target.value); resetToFirstPage() }}
          placeholder="Buscar por nombre o SKU..."
          className="w-full rounded-full border border-ivory/10 bg-charcoal px-4 py-2 text-sm text-ivory placeholder:text-ivory-dim/60 focus:border-gold focus:outline-none sm:w-72"
        />

        <div className="flex flex-wrap gap-2">
          {['all', 'active', 'inactive'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => { setStatusFilter(status); resetToFirstPage() }}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                statusFilter === status ? 'border-gold bg-gold/10 text-gold' : 'border-ivory/10 text-ivory-dim hover:text-ivory'
              }`}
            >
              {status === 'all' ? 'Todos' : status === 'active' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setCategoryFilter(null); resetToFirstPage() }}
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
            !categoryFilter ? 'border-gold bg-gold/10 text-gold' : 'border-ivory/10 text-ivory-dim hover:text-ivory'
          }`}
        >
          Todas las categorías
        </button>
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => { setCategoryFilter(category.id); resetToFirstPage() }}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              categoryFilter === category.id ? 'border-gold bg-gold/10 text-gold' : 'border-ivory/10 text-ivory-dim hover:text-ivory'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <Loading label="Cargando productos..." />
        ) : pageItems.length === 0 ? (
          <EmptyState title="No hay productos" message="Prueba con otro filtro o crea un producto nuevo." />
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-ivory/5 bg-charcoal">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr className="border-b border-ivory/10 text-left text-xs uppercase tracking-wide text-ivory-dim">
                    <th className="px-4 py-3">Foto</th>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3">Precio</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      onEdit={openEdit}
                      onToggleActive={handleToggleActive}
                      onDelete={setDeletingProduct}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-4 text-sm text-ivory-dim">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="disabled:opacity-30"
                >
                  ← Anterior
                </button>
                <span>Página {page} de {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="disabled:opacity-30"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <ProductFormModal
        open={formOpen}
        product={editingProduct}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />

      <ConfirmModal
        open={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDelete}
        title="Eliminar producto"
        message={`¿Seguro que quieres eliminar "${deletingProduct?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
      />
    </div>
  )
}
