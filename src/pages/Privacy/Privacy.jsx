import { STORE_CONFIG } from '@/config/store'
import { formatWhatsAppNumber } from '@/utils/formatPhone'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

function Section({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl text-ivory">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-ivory-dim">{children}</div>
    </section>
  )
}

export function Privacy() {
  useDocumentMeta({ title: 'Política de privacidad' })
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <span className="text-xs uppercase tracking-widest-plus text-gold">Legal</span>
      <h1 className="mt-2 font-display text-3xl text-ivory sm:text-4xl">Política de privacidad</h1>
      <p className="mt-4 text-sm text-ivory-dim">
        Esta política explica qué datos recogemos en {STORE_CONFIG.name} y para qué los usamos.
      </p>

      <Section title="Responsable del tratamiento">
        <p>
          {STORE_CONFIG.legal.businessName || STORE_CONFIG.name}
          {STORE_CONFIG.legal.nit && <> — NIT {STORE_CONFIG.legal.nit}</>}
          {STORE_CONFIG.legal.address && <> — {STORE_CONFIG.legal.address}</>}
        </p>
        <p>
          Contacto para asuntos de datos personales: {STORE_CONFIG.email} · WhatsApp{' '}
          {formatWhatsAppNumber(STORE_CONFIG.whatsappNumber)}.
        </p>
      </Section>

      <Section title="Qué datos recogemos">
        <p>
          Al crear una cuenta o al hacer un pedido, pedimos nombre, apellido, correo electrónico, teléfono,
          ciudad, barrio y dirección de entrega. También guardamos los mensajes que nos escribes por el chat y las
          referencias (fotos o videos) que decidas compartir. Esta información es la necesaria para procesar tu
          pedido, contactarte por WhatsApp y darte seguimiento. Por seguridad, el servidor registra de forma
          temporal la dirección IP desde la que se hacen los intentos de ingreso y los pedidos, para frenar abusos.
        </p>
      </Section>

      <Section title="Autorización">
        <p>
          Al aceptar los términos y esta política y confirmar tu pedido, o al crear tu cuenta, autorizas el
          tratamiento de tus datos personales para las finalidades descritas aquí (Ley 1581 de 2012).
        </p>
      </Section>

      <Section title="Para qué los usamos">
        <p>
          Usamos tus datos para confirmar y entregar tu pedido, y para responderte si nos escribes por el chat
          o WhatsApp del sitio. Si aceptaste recibir información de marketing, también podemos escribirte sobre
          promociones o novedades — puedes pedir que dejemos de hacerlo cuando quieras.
        </p>
      </Section>

      <Section title="Con quién los compartimos">
        <p>
          No vendemos tus datos. Los compartimos únicamente con quien sea necesario para entregarte el pedido (por
          ejemplo, la empresa de mensajería) y con los proveedores de tecnología que alojan el sitio y sus datos o
          validan direcciones, que pueden procesar la información en servidores fuera de Colombia bajo sus propias
          políticas de seguridad.
        </p>
      </Section>

      <Section title="Almacenamiento local">
        <p>
          El carrito de compras se guarda en tu propio navegador (localStorage), no en nuestros servidores,
          hasta que confirmas el pedido.
        </p>
      </Section>

      <Section title="Cuánto tiempo los conservamos">
        <p>
          Guardamos los datos de tus pedidos mientras sean necesarios para la entrega, la garantía, el retracto y
          las obligaciones contables y legales. Los datos de tu cuenta los conservamos mientras la mantengas.
        </p>
      </Section>

      <Section title="Tus derechos">
        <p>
          Puedes conocer, actualizar y rectificar tus datos, pedir que los eliminemos, revocar la autorización que
          nos diste y solicitar prueba de ella, escribiendo a {STORE_CONFIG.email} o por WhatsApp. Respondemos las
          consultas en máximo diez (10) días hábiles y los reclamos en máximo quince (15) días hábiles.
        </p>
        <p>
          Si consideras que no atendimos bien tu solicitud, puedes presentar una queja ante la Superintendencia de
          Industria y Comercio (SIC).
        </p>
      </Section>
    </div>
  )
}
