import { useState } from 'react'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'
import { createOrder } from '@/services/orders'
import { generateWhatsAppOrder } from '@/services/whatsapp'
import { isCityAvailable } from '@/config/shipping'
import { formatCurrency } from '@/utils/formatCurrency'
import { CartItem } from '@/components/cart/CartItem'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { CheckoutForm } from './CheckoutForm'

export function CartPage() {
  const { items, subtotal, clearCart } = useCart()
  const { showToast } = useToast()
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [completedOrder, setCompletedOrder] = useState(null)
  const [whatsappLink, setWhatsappLink] = useState(null)

  const defaultCheckoutValues = {
    customerName: user?.name ?? '',
    customerPhone: user?.phone ?? '',
    city: isCityAvailable(user?.city) ? user.city : '',
    address: user?.address ?? '',
  }

  const handleCheckout = async (deliveryData) => {
    setSubmitting(true)
    try {
      const order = await createOrder({
        ...deliveryData,
        userId: user.id,
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      })

      const link = generateWhatsAppOrder(order)
      setCompletedOrder(order)
      setWhatsappLink(link)
      clearCart()
      showToast('Pedido creado. Continúa la confirmación en WhatsApp.')
      window.open(link, '_blank', 'noopener')
    } catch {
      showToast('No pudimos crear el pedido, intenta de nuevo.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (completedOrder) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <span className="text-xs uppercase tracking-widest-plus text-gold">Pedido registrado</span>
        <h1 className="mt-2 font-display text-3xl text-ivory">
          ¡Gracias, {completedOrder.customerName}!
        </h1>
        <p className="mt-4 text-ivory-dim">
          Tu pedido No. {completedOrder.id} por {formatCurrency(completedOrder.total)} fue registrado.
          Se abrió una ventana de WhatsApp para confirmar los detalles con nosotros.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button href={whatsappLink} variant="whatsapp" target="_blank" rel="noreferrer">
            Abrir WhatsApp de nuevo
          </Button>
          <Button to="/catalogo" variant="secondary">
            Seguir comprando
          </Button>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <EmptyState
          title="Tu carrito está vacío"
          message="Explora el catálogo y encuentra tu próxima fragancia favorita."
          action={<Button to="/catalogo">Ver catálogo</Button>}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-display text-3xl text-ivory">Tu carrito</h1>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-ivory/5 bg-charcoal p-4 sm:p-6">
            {items.map((item) => (
              <CartItem key={item.productId} item={item} />
            ))}
          </div>
          <button
            type="button"
            onClick={clearCart}
            className="mt-4 text-sm text-ivory-dim underline-offset-2 hover:text-red-400 hover:underline"
          >
            Vaciar carrito
          </button>
        </div>

        <div>
          <div className="rounded-2xl border border-ivory/5 bg-charcoal p-6">
            <h2 className="mb-4 font-display text-xl text-ivory">Resumen</h2>
            <div className="flex justify-between text-sm text-ivory-dim">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm text-ivory-dim">
              <span>Envío</span>
              <span>Se confirma por WhatsApp</span>
            </div>
            <div className="mt-4 flex justify-between border-t border-ivory/10 pt-4 font-display text-lg text-ivory">
              <span>Total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            <div className="mt-6 border-t border-ivory/10 pt-6">
              <h3 className="mb-4 text-sm uppercase tracking-widest-plus text-gold">Datos de entrega</h3>
              <CheckoutForm onSubmit={handleCheckout} submitting={submitting} defaultValues={defaultCheckoutValues} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
