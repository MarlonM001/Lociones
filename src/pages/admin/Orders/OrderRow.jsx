import { useState } from 'react'
import { updateOrderStatus } from '@/services/orders'
import { ORDER_STATUS_LABELS, ORDER_STATUS_SEQUENCE } from '@/services/orders/statuses'
import { formatCurrency } from '@/utils/formatCurrency'
import { useToast } from '@/hooks/useToast'
import { STATUS_BADGE_CLASSES } from './statusBadge'

export function OrderRow({ order, onStatusChanged, onView, onDelete }) {
  const { showToast } = useToast()
  const [updating, setUpdating] = useState(false)
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0)

  const handleChange = async (event) => {
    const status = event.target.value
    setUpdating(true)
    try {
      await updateOrderStatus(order.id, status)
      showToast(`Pedido #${order.id} actualizado a "${ORDER_STATUS_LABELS[status]}"`)
      onStatusChanged?.()
    } finally {
      setUpdating(false)
    }
  }

  return (
    <tr className="border-b border-ivory/5 last:border-0">
      <td className="whitespace-nowrap px-4 py-3 text-sm text-ivory">#{order.id}</td>
      <td className="px-4 py-3 text-sm text-ivory">
        <div>{order.customerName}</div>
        <div className="text-xs text-ivory-dim">{order.customerPhone}</div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-ivory-dim">
        {new Date(order.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
      </td>
      <td className="px-4 py-3 text-sm text-ivory-dim">
        <div>
          {order.items.length} {order.items.length === 1 ? 'referencia' : 'referencias'}
        </div>
        <div className="text-xs">
          {units} {units === 1 ? 'unidad' : 'unidades'}
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-ivory">{formatCurrency(order.total)}</td>
      <td className="px-4 py-3 text-sm text-ivory-dim">
        <div className="text-ivory">{order.city}</div>
        {order.neighborhood && <div className="text-xs">Barrio {order.neighborhood}</div>}
        <div className="text-xs">{order.address}</div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE_CLASSES[order.status]}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </td>
      <td className="px-4 py-3">
        <select
          value={order.status}
          onChange={handleChange}
          disabled={updating}
          className="rounded-lg border border-ivory/10 bg-ink px-2 py-1.5 text-xs text-ivory focus:border-gold focus:outline-none disabled:opacity-50"
        >
          {ORDER_STATUS_SEQUENCE.map((status) => (
            <option key={status} value={status}>
              {ORDER_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right">
        <button
          type="button"
          onClick={() => onView(order)}
          className="mr-4 text-sm text-gold hover:underline"
        >
          Ver
        </button>
        <button
          type="button"
          onClick={() => onDelete(order)}
          className="text-sm text-ivory-dim hover:text-red-400"
        >
          Eliminar
        </button>
      </td>
    </tr>
  )
}
