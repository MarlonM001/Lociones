import { STORE_CONFIG } from '@/config/store'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { PAYMENT_METHODS_TEXT } from '@/config/payments'
import { formatWhatsAppNumber } from '@/utils/formatPhone'

function Section({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl text-ivory">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-ivory-dim">{children}</div>
    </section>
  )
}

export function Terms() {
  useDocumentMeta({ title: 'Términos y condiciones' })
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <span className="text-xs uppercase tracking-widest-plus text-gold">Legal</span>
      <h1 className="mt-2 font-display text-3xl text-ivory sm:text-4xl">Términos y condiciones</h1>
      <p className="mt-4 text-sm text-ivory-dim">
        Estos términos aplican a las compras realizadas en {STORE_CONFIG.name}. Al confirmar un pedido, aceptas
        lo siguiente.
      </p>

      <Section title="Quién vende">
        <p>
          {STORE_CONFIG.legal.businessName || STORE_CONFIG.name}
          {STORE_CONFIG.legal.nit && <> — NIT {STORE_CONFIG.legal.nit}</>}
          {STORE_CONFIG.legal.address && <> — {STORE_CONFIG.legal.address}</>}
        </p>
        <p>
          Contacto: {STORE_CONFIG.email} · WhatsApp {formatWhatsAppNumber(STORE_CONFIG.whatsappNumber)} ·{' '}
          {STORE_CONFIG.hours}
        </p>
      </Section>

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

      <Section title="Cambios, garantía y devoluciones">
        <p>
          Si recibes un producto en mal estado o distinto al que pediste, escríbenos por WhatsApp dentro de las
          48 horas siguientes a la entrega para coordinar el cambio. Esto no limita los derechos que te da la ley
          de protección al consumidor, incluida la garantía legal.
        </p>
      </Section>

      <Section title="Derecho de retracto">
        <p>
          Como la compra se hace a distancia, puedes retractarte y pedir la devolución de tu dinero dentro de los
          cinco (5) días hábiles siguientes a la entrega del producto (Ley 1480 de 2011, artículo 47).
        </p>
        <p>
          Para hacerlo escríbenos por WhatsApp o a {STORE_CONFIG.email} indicando tu número de pedido. El producto
          debe devolverse sin usar, con su empaque y sellos originales. Los costos de transporte de la devolución
          los asume quien compra. Te devolvemos el dinero, por el mismo medio de pago o el que acordemos, dentro de
          los treinta (30) días calendario siguientes al ejercicio del retracto.
        </p>
      </Section>

      <Section title="Reclamos">
        <p>
          Si tienes una queja, escríbenos primero para resolverla. También puedes acudir a la Superintendencia de
          Industria y Comercio (SIC), autoridad de protección al consumidor en Colombia.
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
