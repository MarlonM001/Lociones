import { useEffect, useState } from 'react'
import { getOrders } from '@/services/orders'
import { ORDER_STATUS_LABELS, ORDER_STATUS_SEQUENCE } from '@/services/orders/statuses'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { OrderRow } from './OrderRow'

export function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState(null)

  const loadOrders = async () => {
    const items = await getOrders()
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    setOrders(items)
    setLoading(false)
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const filteredOrders = statusFilter ? orders.filter((order) => order.status === statusFilter) : orders

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
        {ORDER_STATUS_SEQUENCE.map((status) => (
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
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="border-b border-ivory/10 text-left text-xs uppercase tracking-wide text-ivory-dim">
                  <th className="px-4 py-3">Pedido</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Productos</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Ciudad</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Cambiar</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <OrderRow key={order.id} order={order} onStatusChanged={loadOrders} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
