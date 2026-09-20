import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { trackOrder } from '@/services/orders'
import { getLastOrder } from '@/utils/lastOrder'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { OrderStatusTimeline } from '@/components/orders/OrderStatusTimeline'
import { Price } from '@/components/ui/Price'
import { Button } from '@/components/ui/Button'

const INPUT_CLASSES =
  'w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory placeholder:text-ivory-dim/60 focus:border-gold focus:outline-none'

/**
 * Seguimiento de un pedido sin necesidad de cuenta: se escribe el número de pedido y el teléfono con
 * el que se hizo. Si el cliente acaba de comprar desde este navegador, los datos vienen ya escritos.
 */
export function OrderTracking() {
  useDocumentMeta({
    title: 'Seguir mi pedido',
    description: 'Consulta el estado de tu pedido con el número de pedido y tu teléfono.',
    noindex: true,
  })

  const [searchParams] = useSearchParams()
  const [orderId, setOrderId] = useState(searchParams.get('pedido') ?? '')
  const [phone, setPhone] = useState('')
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const last = getLastOrder()
    if (last && (!searchParams.get('pedido') || String(last.id) === searchParams.get('pedido'))) {
      setOrderId((current) => current || String(last.id))
      setPhone(last.phone)
    }
  }, [searchParams])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setOrder(null)
    setLoading(true)
    try {
      setOrder(await trackOrder({ orderId: orderId.replace(/\D/g, ''), phone }))
    } catch (trackingError) {
      setError(trackingError.message || 'No pudimos consultar tu pedido. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-14">
      <span className="text-xs uppercase tracking-widest-plus text-gold">Seguimiento</span>
      <h1 className="mt-2 font-display text-3xl text-ivory sm:text-4xl">Seguir mi pedido</h1>
      <p className="mt-2 text-sm text-ivory-dim">
        Escribe el número de tu pedido y el teléfono con el que lo hiciste. Si tienes cuenta, también lo ves en{' '}
        <Link to="/perfil" className="text-gold hover:underline">Mi cuenta</Link>.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4 rounded-2xl border border-ivory/5 bg-charcoal p-6">
        <div>
          <label htmlFor="tracking-order" className="mb-1 block text-sm text-ivory-dim">Número de pedido</label>
          <input
            id="tracking-order"
            type="text"
            inputMode="numeric"
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            placeholder="Ej. 37"
            className={INPUT_CLASSES}
          />
        </div>
        <div>
          <label htmlFor="tracking-phone" className="mb-1 block text-sm text-ivory-dim">Teléfono del pedido</label>
          <input
            id="tracking-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Ej. 3001234567"
            className={INPUT_CLASSES}
          />
        </div>
        {error && (
          <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" size="lg" disabled={loading} fullWidth>
          {loading ? 'Consultando...' : 'Consultar estado'}
        </Button>
      </form>

      {order && (
        <div className="mt-8 rounded-2xl border border-ivory/5 bg-charcoal p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-display text-lg text-ivory">Pedido #{order.id}</p>
              <p className="text-xs text-ivory-dim">
                {new Date(order.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                {' · '}
                {order.city}
              </p>
            </div>
            <Price value={order.total} className="text-xl text-gold" />
          </div>

          <ul className="mt-4 space-y-1 text-sm text-ivory-dim">
            {order.items.map((item) => (
              <li key={`${item.slug}-${item.name}`}>
                {item.quantity} × {item.name}
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-ivory/10 pt-6">
            <OrderStatusTimeline status={order.status} />
          </div>
        </div>
      )}
    </div>
  )
}
