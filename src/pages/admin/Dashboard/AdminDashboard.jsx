import { useEffect, useState } from 'react'
import { getOrders } from '@/services/orders'
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '@/services/orders/statuses'
import { getAllReferencesAdmin } from '@/services/references'
import { REFERENCE_STATUSES } from '@/services/references/statuses'
import { getMonthlySummary } from '@/services/reports'
import { formatCurrency } from '@/utils/formatCurrency'
import { Loading } from '@/components/ui/Loading'
import { Button } from '@/components/ui/Button'
import { StatCard } from './StatCard'

export function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [pendingReferences, setPendingReferences] = useState(0)
  const [monthSummary, setMonthSummary] = useState(null)

  useEffect(() => {
    async function load() {
      const now = new Date()
      const [orderList, references, summary] = await Promise.all([
        getOrders(),
        getAllReferencesAdmin(),
        getMonthlySummary(now.getFullYear(), now.getMonth() + 1),
      ])
      setOrders(orderList)
      setPendingReferences(references.filter((ref) => ref.status === REFERENCE_STATUSES.PENDING).length)
      setMonthSummary(summary)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <Loading fullScreen label="Cargando dashboard..." />

  const countByStatus = (status) => orders.filter((order) => order.status === status).length

  return (
    <div>
      <h1 className="font-display text-3xl text-ivory">Dashboard</h1>
      <p className="mt-1 text-sm text-ivory-dim">Resumen general de la tienda.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total pedidos" value={orders.length} />
        <StatCard label="Ventas del mes" value={formatCurrency(monthSummary?.totalSales ?? 0)} />
        <StatCard label="Unidades vendidas (mes)" value={monthSummary?.totalUnits ?? 0} />
        <StatCard
          label="Referencias pendientes"
          value={pendingReferences}
          hint={pendingReferences > 0 ? 'Requieren tu revisión' : 'Al día'}
        />
      </div>

      <h2 className="mt-10 font-display text-xl text-ivory">Pedidos por estado</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Object.values(ORDER_STATUSES).map((status) => (
          <StatCard key={status} label={ORDER_STATUS_LABELS[status]} value={countByStatus(status)} />
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button to="/admin/productos" variant="secondary">Gestionar productos</Button>
        <Button to="/admin/pedidos" variant="secondary">Gestionar pedidos</Button>
        <Button to="/admin/referencias" variant="secondary">Revisar referencias</Button>
        <Button to="/admin/reportes" variant="secondary">Ver reportes</Button>
      </div>
    </div>
  )
}
