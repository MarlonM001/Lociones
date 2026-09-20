import { STORE_CONFIG } from '@/config/store'
import { PAYMENT_METHODS_TEXT } from '@/config/payments'

function Section({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl text-ivory">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-ivory-dim">{children}</div>
    </section>
  )
}

export function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <span className="text-xs uppercase tracking-widest-plus text-gold">Legal</span>
      <h1 className="mt-2 font-display text-3xl text-ivory sm:text-4xl">Términos y condiciones</h1>
      <p className="mt-4 text-sm text-ivory-dim">
        Estos términos aplican a las compras realizadas en {STORE_CONFIG.name}. Al confirmar un pedido, aceptas
        lo siguiente.
      </p>

      <Section title="Pedidos y confirmación">
        <p>
          Los pedidos hechos desde el catálogo no se cobran en línea. Al finalizar el pedido te contactamos por
          WhatsApp para confirmar disponibilidad, coordinar el pago y los detalles de la entrega. El pedido solo
          queda en firme una vez confirmado por ese medio.
        </p>
      </Section>

      <Section title="Pagos">
        <p>
          El pago se coordina directamente por WhatsApp. Aceptamos {PAYMENT_METHODS_TEXT}, según lo que acuerdes
          con quien te atienda. No pedimos ni almacenamos datos de tarjetas en el sitio.
        </p>
      </Section>

      <Section title="Envíos">
        <p>Enviamos a {STORE_CONFIG.shippingCoverage}.</p>
        <p>
          El costo del envío y el tiempo de entrega dependen del destino y se confirman al coordinar el pedido por
          WhatsApp.
        </p>
      </Section>

      <Section title="Disponibilidad">
        <p>
          El stock mostrado en el catálogo se actualiza periódicamente, pero puede haber variaciones. Si un
          producto ya no está disponible al confirmar tu pedido, te lo haremos saber por WhatsApp antes de
          continuar.
        </p>
      </Section>

      <Section title="Cambios y devoluciones">
        <p>
          Si recibes un producto en mal estado o distinto al que pediste, escríbenos por WhatsApp dentro de las
          48 horas siguientes a la entrega para coordinar el cambio.
        </p>
      </Section>

      <Section title="Contacto">
        <p>
          Para dudas sobre estos términos, escríbenos a {STORE_CONFIG.email} o por WhatsApp.
        </p>
      </Section>
    </div>
  )
}
