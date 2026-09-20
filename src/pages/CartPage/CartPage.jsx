import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'
import { createOrder } from '@/services/orders'
import { generateWhatsAppOrder } from '@/services/whatsapp'
import { isCityAvailable } from '@/config/shipping'
import { PAYMENT_METHODS } from '@/config/payments'
import { Price } from '@/components/ui/Price'
import { toTitleCase } from '@/utils/formatName'
import { CartItem } from '@/components/cart/CartItem'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { CheckoutForm } from './CheckoutForm'

function SuccessIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function OrderSummary({ items, subtotal, showItems }) {
  return (
    <div className="rounded-2xl border border-ivory/5 bg-charcoal p-6">
      <h2 className="mb-4 font-display text-xl text-ivory">Resumen</h2>

      {showItems && (
        <div className="mb-4 flex flex-col gap-3 border-b border-ivory/10 pb-4">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white p-1">
                <img src={item.image} alt={item.name} className="h-full w-full object-contain object-center" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ivory">{item.name}</p>
                <p className="text-xs text-ivory-dim">x{item.quantity}</p>
              </div>
              <Price value={item.price * item.quantity} className="shrink-0 text-sm text-ivory" />
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between text-sm text-ivory-dim">
        <span>Subtotal</span>
        <Price value={subtotal} className="text-ivory" />
      </div>
      <div className="mt-1 flex justify-between text-sm text-ivory-dim">
        <span>Envío</span>
        <span>Se confirma por WhatsApp</span>
      </div>
      <div className="mt-4 flex items-baseline justify-between border-t border-ivory/10 pt-4 font-display text-lg text-ivory">
        <span>Total</span>
        <Price value={subtotal} className="text-2xl text-gold" />
      </div>
    </div>
  )
}

export function CartPage() {
  const { items, subtotal, clearCart } = useCart()
  const { showToast } = useToast()
  const { user } = useAuth()
  const [step, setStep] = useState('cart') // 'cart' | 'details' | 'review'
  const [checkoutData, setCheckoutData] = useState(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedMarketing, setAcceptedMarketing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [completedOrder, setCompletedOrder] = useState(null)
  const [whatsappLink, setWhatsappLink] = useState(null)

  const [firstName = '', ...restName] = (user?.name ?? '').split(' ')
  const defaultCheckoutValues = {
    customerEmail: user?.email ?? '',
    firstName,
    lastName: restName.join(' '),
    customerPhone: user?.phone ?? '',
    city: isCityAvailable(user?.city) ? user.city : '',
    address: user?.address ?? '',
  }

  const handleDetailsSubmit = (values) => {
    setCheckoutData(values)
    setStep('review')
  }

  const handleConfirmOrder = async () => {
    if (!acceptedTerms) return
    setSubmitting(true)
    try {
      const order = await createOrder({
        ...checkoutData,
        userId: user?.id ?? null,
        marketingOptIn: acceptedMarketing,
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
    } catch (error) {
      showToast(error.message || 'No pudimos crear el pedido, intenta de nuevo.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (completedOrder) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gold/10 text-gold ring-1 ring-gold/30">
          <SuccessIcon />
        </div>
        <span className="mt-8 block text-xs uppercase tracking-widest-plus text-gold">Pedido registrado</span>
        <h1 className="mt-2 font-display text-3xl text-ivory text-balance">
          Gracias por tu compra, {toTitleCase(completedOrder.customerName)}
        </h1>

        <div className="mt-8 rounded-2xl border border-ivory/5 bg-charcoal p-6 text-left">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-ivory-dim">Total</span>
            <Price value={completedOrder.total} className="text-xl text-gold" />
          </div>
        </div>

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
      <h1 className="mb-8 font-display text-3xl text-ivory">
        {step === 'cart' && 'Tu carrito'}
        {step === 'details' && 'Datos de entrega'}
        {step === 'review' && 'Revisa y confirma tu pedido'}
      </h1>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          {step === 'cart' && (
            <>
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
            </>
          )}

          {step === 'details' && (
            <div className="rounded-2xl border border-ivory/5 bg-charcoal p-6">
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="mb-4 text-sm text-ivory-dim hover:text-ivory"
              >
                ← Volver al carrito
              </button>
              <CheckoutForm onSubmit={handleDetailsSubmit} defaultValues={checkoutData ?? defaultCheckoutValues} />
            </div>
          )}

          {step === 'review' && checkoutData && (
            <div className="flex flex-col gap-6">
              <div className="rounded-2xl border border-ivory/5 bg-charcoal p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg text-ivory">Detalles del cliente y de la entrega</h2>
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="text-sm text-gold hover:underline"
                  >
                    Editar
                  </button>
                </div>
                <div className="mt-3 text-sm text-ivory-dim">
                  <p className="text-ivory">{checkoutData.customerName}</p>
                  {checkoutData.customerEmail && <p>{checkoutData.customerEmail}</p>}
                  <p>{checkoutData.customerPhone}</p>
                  <p>{checkoutData.address}</p>
                  <p>Barrio {checkoutData.neighborhood} · {checkoutData.city}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-ivory/5 bg-charcoal p-6">
                <h2 className="font-display text-lg text-ivory">Forma de pago</h2>
                <p className="mt-1 text-sm leading-relaxed text-ivory-dim">
                  No cobramos en línea. Al confirmar tu pedido te escribimos por WhatsApp para coordinar el pago y
                  la entrega. Aceptamos:
                </p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {PAYMENT_METHODS.map((method) => (
                    <li key={method.id} className="rounded-xl border border-gold/20 bg-ink/40 p-4">
                      <p className="text-sm font-medium text-ivory">{method.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-ivory-dim">{method.description}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-ivory/5 bg-charcoal p-6">
                <h2 className="mb-1 font-display text-lg text-ivory">Revisa y realiza el pedido</h2>
                <p className="mb-4 text-sm text-ivory-dim">
                  Revisa la información anterior y continúa cuando esté todo listo.
                </p>

                <label className="flex items-start gap-2 text-sm text-ivory-dim">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-ivory/20 accent-gold"
                  />
                  <span>
                    Acepto los{' '}
                    <Link to="/terminos" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                      Términos y condiciones
                    </Link>{' '}
                    y la{' '}
                    <Link to="/privacidad" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                      Política de privacidad
                    </Link>{' '}
                    *
                  </span>
                </label>

                <label className="mt-3 flex items-start gap-2 text-sm text-ivory-dim">
                  <input
                    type="checkbox"
                    checked={acceptedMarketing}
                    onChange={(event) => setAcceptedMarketing(event.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-ivory/20 accent-gold"
                  />
                  <span>
                    Acepto recibir información de marketing por email y WhatsApp sobre promociones y novedades
                    (opcional).
                  </span>
                </label>
              </div>

              <Button
                type="button"
                variant="whatsapp"
                size="lg"
                disabled={submitting || !acceptedTerms}
                onClick={handleConfirmOrder}
                fullWidth
              >
                {submitting ? 'Creando pedido...' : 'Finalizar pedido por WhatsApp'}
              </Button>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <OrderSummary items={items} subtotal={subtotal} showItems={step !== 'cart'} />
          {step === 'cart' && (
            <Button variant="primary" size="lg" onClick={() => setStep('details')} fullWidth>
              Pagar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
