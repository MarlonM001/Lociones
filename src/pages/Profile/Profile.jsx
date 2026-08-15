import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getOrdersByUser } from '@/services/orders'
import { getReferencesByUser } from '@/services/references'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { OrderCard } from './OrderCard'
import { MyReferenceCard } from './MyReferenceCard'

export function Profile() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [references, setReferences] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingReferences, setLoadingReferences] = useState(true)

  useEffect(() => {
    getOrdersByUser(user.id)
      .then(setOrders)
      .finally(() => setLoadingOrders(false))
    getReferencesByUser(user.id)
      .then(setReferences)
      .finally(() => setLoadingReferences(false))
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

      {loadingOrders ? (
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

      <h2 className="mb-4 mt-10 font-display text-2xl text-ivory">Mis referencias</h2>

      {loadingReferences ? (
        <Loading label="Cargando tus videos..." />
      ) : references.length === 0 ? (
        <EmptyState
          title="Todavía no has subido videos"
          message="Comparte el video de tu entrega en la página de Referencias."
          action={<Button to="/referencias">Subir un video</Button>}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {references.map((reference) => (
            <MyReferenceCard key={reference.id} reference={reference} />
          ))}
        </div>
      )}
    </div>
  )
}
