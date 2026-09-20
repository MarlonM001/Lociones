import { useEffect, useState } from 'react'
import { getOrders, deleteOrder } from '@/services/orders'
import { ORDER_STATUS_LABELS, ORDER_STATUS_ALL } from '@/services/orders/statuses'
import { useToast } from '@/hooks/useToast'
import { usePendingOrders } from '@/hooks/usePendingOrders'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmModal } from '@/components/ui/Modal'
import { OrderRow } from './OrderRow'
import { OrderDetailModal } from './OrderDetailModal'

export function AdminOrders() {
  const { showToast } = useToast()
  const { refresh: refreshPending } = usePendingOrders()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState(null)
  const [deletingOrder, setDeletingOrder] = useState(null)
  const [viewingOrderId, setViewingOrderId] = useState(null)

  const loadOrders = async () => {
    const items = await getOrders()
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    setOrders(items)
    setLoading(false)
    // La insignia del menú debe bajar al instante cuando el admin despacha o elimina un pedido.
    refreshPending()
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const viewingOrder = orders.find((order) => order.id === viewingOrderId) ?? null
  const filteredOrders = statusFilter ? orders.filter((order) => order.status === statusFilter) : orders

  const handleDelete = async () => {
    const order = deletingOrder
    setDeletingOrder(null)
    try {
      await deleteOrder(order.id)
      showToast(`Pedido #${order.id} eliminado`)
    } catch (error) {
      showToast(error.message || 'No pudimos eliminar el pedido.', 'error')
    }
    loadOrders()
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ivory">Pedidos</h1>
      <p className="mt-1 text-sm text-ivory-dim">Consulta y actualiza el estado de cada pedido.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter(null)}
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
            !statusFilter ? 'border-gold bg-gold/10 text-gold' : 'border-ivory/10 text-ivory-dim hover:text-ivory'
          }`}
        >
          Todos
        </button>
        {ORDER_STATUS_ALL.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              statusFilter === status ? 'border-gold bg-gold/10 text-gold' : 'border-ivory/10 text-ivory-dim hover:text-ivory'
            }`}
          >
            {ORDER_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <Loading label="Cargando pedidos..." />
        ) : filteredOrders.length === 0 ? (
          <EmptyState title="No hay pedidos" message="Todavía no hay pedidos en esta categoría." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-ivory/5 bg-charcoal">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr className="border-b border-ivory/10 text-left text-xs uppercase tracking-wide text-ivory-dim">
                  <th className="px-4 py-3">Pedido</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Productos</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Entrega</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Cambiar</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    onStatusChanged={loadOrders}
                    onView={(selected) => setViewingOrderId(selected.id)}
                    onDelete={setDeletingOrder}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <OrderDetailModal order={viewingOrder} onClose={() => setViewingOrderId(null)} />

      <ConfirmModal
        open={Boolean(deletingOrder)}
        onClose={() => setDeletingOrder(null)}
        onConfirm={handleDelete}
        title="Eliminar pedido"
        message={`¿Seguro que quieres eliminar el pedido #${deletingOrder?.id}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
      />
    </div>
  )
}
