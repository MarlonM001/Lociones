import { STORE_CONFIG } from '@/config/store'

function Section({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl text-ivory">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-ivory-dim">{children}</div>
    </section>
  )
}

export function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <span className="text-xs uppercase tracking-widest-plus text-gold">Legal</span>
      <h1 className="mt-2 font-display text-3xl text-ivory sm:text-4xl">Política de privacidad</h1>
      <p className="mt-4 text-sm text-ivory-dim">
        Esta política explica qué datos recogemos en {STORE_CONFIG.name} y para qué los usamos.
      </p>

      <Section title="Qué datos recogemos">
        <p>
          Al crear una cuenta o al hacer un pedido como invitado, pedimos nombre, teléfono, ciudad y dirección
          de entrega, y opcionalmente tu email. Esta información es la mínima necesaria para procesar tu pedido
          y contactarte por WhatsApp.
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
          No vendemos ni compartimos tus datos con terceros, salvo lo necesario para coordinar el envío de tu
          pedido (por ejemplo, con quien haga la entrega).
        </p>
      </Section>

      <Section title="Almacenamiento local">
        <p>
          El carrito de compras se guarda en tu propio navegador (localStorage), no en nuestros servidores,
          hasta que confirmas el pedido.
        </p>
      </Section>

      <Section title="Tus derechos">
        <p>
          Puedes pedirnos en cualquier momento que te mostremos, corrijamos o eliminemos los datos que tenemos
          sobre ti, escribiendo a {STORE_CONFIG.email} o por WhatsApp.
        </p>
      </Section>
    </div>
  )
}
