import { useEffect, useState } from 'react'
import { ORDER_STATUS_LABELS, ORDER_STATUS_SEQUENCE, ORDER_STATUSES } from '@/services/orders/statuses'
import { TruckIcon } from './TruckIcon'

export function OrderStatusTimeline({ status }) {
  const currentIndex = Math.max(0, ORDER_STATUS_SEQUENCE.indexOf(status))
  const lastIndex = ORDER_STATUS_SEQUENCE.length - 1
  const targetPercent = (currentIndex / lastIndex) * 100
  const isDelivered = status === ORDER_STATUSES.ENTREGADO
  const isEnRoute = status === ORDER_STATUSES.EN_CAMINO

  // Anima desde 0% al montar, para que el camión "recorra" la ruta en vez de
  // aparecer ya en su posición final.
  const [percent, setPercent] = useState(0)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setPercent(targetPercent))
    return () => cancelAnimationFrame(frame)
  }, [targetPercent])

  return (
    <div className="pt-6">
      <div className="relative mx-2 mb-3 h-8">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-ivory/10" />
        <div
          className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-gold-dark to-gold transition-[width] duration-[1200ms] ease-out"
          style={{ width: `${percent}%` }}
        />
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-gold transition-[left] duration-[1200ms] ease-out"
          style={{ left: `${percent}%` }}
        >
          <div className={isEnRoute ? 'animate-truck-drive' : ''}>
            <TruckIcon className={isDelivered ? 'text-gold' : 'text-gold'} />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        {ORDER_STATUS_SEQUENCE.map((step, index) => {
          const done = index <= currentIndex
          return (
            <div key={step} className="flex flex-1 flex-col items-center text-center first:items-start first:text-left last:items-end last:text-right">
              <span
                className={`mb-1.5 h-2 w-2 rounded-full ${done ? 'bg-gold' : 'bg-ivory/20'}`}
              />
              <span className={`max-w-[5.5rem] text-[11px] leading-tight sm:text-xs ${
                index === currentIndex ? 'text-gold' : done ? 'text-ivory' : 'text-ivory-dim'
              }`}>
                {ORDER_STATUS_LABELS[step]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
