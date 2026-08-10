import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getOrdersByUser } from '@/services/orders'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { OrderCard } from './OrderCard'

export function Profile() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOrdersByUser(user.id).then((items) => {
      setOrders(items)
      setLoading(false)
    })
  }, [user.id])

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl text-ivory">Mi cuenta</h1>

      <div className="mt-6 grid gap-4 rounded-2xl border border-ivory/5 bg-charcoal p-6 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-widest-plus text-gold/80">Nombre</p>
          <p className="mt-1 text-ivory">{user.name}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest-plus text-gold/80">Email</p>
          <p className="mt-1 text-ivory">{user.email}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest-plus text-gold/80">Teléfono</p>
          <p className="mt-1 text-ivory">{user.phone}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest-plus text-gold/80">Ciudad</p>
          <p className="mt-1 text-ivory">{user.city || '—'}</p>
        </div>
      </div>

      <h2 className="mb-4 mt-10 font-display text-2xl text-ivory">Mis pedidos</h2>

      {loading ? (
        <Loading label="Cargando tus pedidos..." />
      ) : orders.length === 0 ? (
        <EmptyState
          title="Todavía no tienes pedidos"
          message="Cuando confirmes una compra por WhatsApp, aparecerá aquí con su estado."
          action={<Button to="/catalogo">Ver catálogo</Button>}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
