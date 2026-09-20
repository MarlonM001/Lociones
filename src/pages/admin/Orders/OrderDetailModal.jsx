import { Modal } from '@/components/ui/Modal'
import { Price } from '@/components/ui/Price'
import { ORDER_STATUS_LABELS } from '@/services/orders/statuses'
import { generateWhatsAppToCustomer } from '@/services/whatsapp'
import { formatCurrency } from '@/utils/formatCurrency'
import { STATUS_BADGE_CLASSES } from './statusBadge'

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-ivory/5 bg-ink/40 p-4">
      <h4 className="mb-2 text-xs uppercase tracking-widest-plus text-gold">{title}</h4>
      {children}
    </section>
  )
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5 py-1 sm:flex-row sm:gap-3">
      <dt className="w-28 shrink-0 text-xs text-ivory-dim">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-ivory">{children}</dd>
    </div>
  )
}

export function OrderDetailModal({ order, onClose }) {
  if (!order) return null

  const units = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const whatsappLink = generateWhatsAppToCustomer(order)
  const createdAt = new Date(order.createdAt).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={`Pedido #${order.id}`}
      footer={
        <>
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-emerald-500/40 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-500/10"
            >
              Escribir al cliente
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-ivory/10 px-4 py-2 text-sm text-ivory hover:border-gold hover:text-gold"
          >
            Cerrar
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE_CLASSES[order.status]}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <span className="text-sm text-ivory-dim">{createdAt}</span>
        </div>

        <Section title="Cliente">
          <dl>
            <Field label="Nombre">{order.customerName}</Field>
            <Field label="Teléfono">{order.customerPhone}</Field>
            <Field label="Correo">
              {order.customerEmail ? (
                <a href={`mailto:${order.customerEmail}`} className="text-gold hover:underline">
                  {order.customerEmail}
                </a>
              ) : (
                <span className="text-ivory-dim">No dejó correo</span>
              )}
            </Field>
            <Field label="Cuenta">
              {order.account ? (
                <>
                  Cliente registrado · {order.account.name}
                  <span className="block text-xs text-ivory-dim">{order.account.email}</span>
                </>
              ) : (
                <span className="text-ivory-dim">Compró como invitado</span>
              )}
            </Field>
            <Field label="Promociones">{order.marketingOptIn ? 'Aceptó recibirlas' : 'No aceptó'}</Field>
          </dl>
        </Section>

        <Section title="Entrega">
          <dl>
            <Field label="Ciudad">{order.city}</Field>
            {order.neighborhood && <Field label="Barrio">{order.neighborhood}</Field>}
            <Field label="Dirección">{order.address}</Field>
          </dl>
        </Section>

        <Section title={`Productos (${order.items.length} ${order.items.length === 1 ? 'referencia' : 'referencias'} · ${units} ${units === 1 ? 'unidad' : 'unidades'})`}>
          <ul className="divide-y divide-ivory/5">
            {order.items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3 py-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white p-1">
                  {item.image && <img src={item.image} alt="" className="h-full w-full object-contain" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ivory">{item.name}</p>
                  <p className="text-xs text-ivory-dim">
                    {item.sku ? `${item.sku} · ` : ''}
                    {item.quantity} × {formatCurrency(item.price)}
                  </p>
                </div>
                <Price value={item.subtotal} className="text-sm font-semibold text-ivory" />
              </li>
            ))}
          </ul>

          <div className="mt-2 space-y-1 border-t border-ivory/10 pt-3 text-sm">
            <div className="flex justify-between text-ivory-dim">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-ivory-dim">
              <span>Envío</span>
              <span>{order.shipping > 0 ? formatCurrency(order.shipping) : 'Se acordó por WhatsApp'}</span>
            </div>
            <div className="flex items-baseline justify-between pt-1 text-ivory">
              <span>Total</span>
              <Price value={order.total} className="text-lg text-gold" />
            </div>
          </div>
        </Section>
      </div>
    </Modal>
  )
}
