import { useState } from 'react'
import { updateOrderStatus } from '@/services/orders'
import { ORDER_STATUS_LABELS, ORDER_STATUS_ALL, ORDER_STATUSES } from '@/services/orders/statuses'
import { ConfirmModal } from '@/components/ui/Modal'
import { formatCurrency } from '@/utils/formatCurrency'
import { useToast } from '@/hooks/useToast'
import { STATUS_BADGE_CLASSES } from './statusBadge'

export function OrderRow({ order, onStatusChanged, onView, onDelete }) {
  const { showToast } = useToast()
  const [updating, setUpdating] = useState(false)
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0)

  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const isCancelled = order.status === ORDER_STATUSES.CANCELADO

  const applyStatus = async (status) => {
    setUpdating(true)
    try {
      await updateOrderStatus(order.id, status)
      showToast(`Pedido #${order.id} actualizado a "${ORDER_STATUS_LABELS[status]}"`)
    } catch (error) {
      showToast(error.message || 'No pudimos cambiar el estado del pedido.', 'error')
    } finally {
      setUpdating(false)
      onStatusChanged?.()
    }
  }

  const handleChange = (event) => {
    const status = event.target.value
    // Cancelar devuelve las unidades al inventario y no se puede deshacer: primero se confirma.
    if (status === ORDER_STATUSES.CANCELADO) setConfirmingCancel(true)
    else applyStatus(status)
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
          disabled={updating || isCancelled}
          className="rounded-lg border border-ivory/10 bg-ink px-2 py-1.5 text-xs text-ivory focus:border-gold focus:outline-none disabled:opacity-50"
        >
          {ORDER_STATUS_ALL.map((status) => (
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
        {isCancelled ? (
          <button
            type="button"
            onClick={() => onDelete(order)}
            className="text-sm text-ivory-dim hover:text-danger"
          >
            Eliminar
          </button>
        ) : (
          <span className="text-xs text-ivory-dim" title="Para eliminar un pedido primero hay que cancelarlo">
            —
          </span>
        )}
        <ConfirmModal
          open={confirmingCancel}
          onClose={() => setConfirmingCancel(false)}
          onConfirm={() => {
            setConfirmingCancel(false)
            applyStatus(ORDER_STATUSES.CANCELADO)
          }}
          title={`Cancelar el pedido #${order.id}`}
          message="Las unidades del pedido vuelven al inventario, deja de contar en los reportes de ventas y el pedido no se podrá reactivar. ¿Seguro?"
          confirmLabel="Cancelar pedido"
          cancelLabel="Volver"
        />
      </td>
    </tr>
  )
}
