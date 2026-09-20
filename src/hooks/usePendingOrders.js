import { useContext } from 'react'
import { PendingOrdersContext } from '@/context/PendingOrdersContext'

export function usePendingOrders() {
  const context = useContext(PendingOrdersContext)
  if (!context) {
    throw new Error('usePendingOrders debe usarse dentro de un PendingOrdersProvider')
  }
  return context
}
