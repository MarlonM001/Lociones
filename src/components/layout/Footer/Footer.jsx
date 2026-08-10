import { Link } from 'react-router-dom'
import { STORE_CONFIG } from '@/config/store'
import { SHIPPING_CITY_NAMES } from '@/config/shipping'
import { CATEGORIES } from '@/config/categories'

const SOCIAL_LINKS = [
  { label: 'Instagram', href: STORE_CONFIG.instagram },
  { label: 'Facebook', href: STORE_CONFIG.facebook },
  { label: 'TikTok', href: STORE_CONFIG.tiktok },
  { label: 'WhatsApp', href: `https://wa.me/${STORE_CONFIG.whatsappNumber}` },
]

export function Footer() {
  return (
    <footer className="border-t border-gold/10 bg-charcoal">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <Link to="/" className="font-display text-2xl tracking-widest text-ivory">
            {STORE_CONFIG.name}
            <span className="ml-1 text-gold">.</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ivory-dim">
            Perfumería especializada en lociones ARABA, para mujer y para caballero.
            Selección curada, calidad garantizada y atención personalizada por WhatsApp.
          </p>
          <p className="mt-4 text-sm text-ivory-dim">{STORE_CONFIG.email}</p>
        </div>

        <div>
          <h4 className="mb-4 text-xs uppercase tracking-widest-plus text-gold">Navegación</h4>
          <ul className="space-y-2 text-sm text-ivory-dim">
            <li><Link to="/" className="hover:text-ivory">Inicio</Link></li>
            <li><Link to="/catalogo" className="hover:text-ivory">Catálogo</Link></li>
            {CATEGORIES.map((category) => (
              <li key={category.id}>
                <Link to={`/productos/${category.slug}`} className="hover:text-ivory">
                  {category.name}
                </Link>
              </li>
            ))}
            <li><Link to="/seguimiento" className="hover:text-ivory">Seguimiento de pedido</Link></li>
            <li><Link to="/referencias" className="hover:text-ivory">Referencias de entrega</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-xs uppercase tracking-widest-plus text-gold">Atención</h4>
          <ul className="space-y-2 text-sm text-ivory-dim">
            <li>{STORE_CONFIG.hours}</li>
            <li>Envíos a: {SHIPPING_CITY_NAMES.join(' · ')}</li>
            <li>
              <a
                href={`https://wa.me/${STORE_CONFIG.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-ivory"
              >
                Escríbenos por WhatsApp
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-xs uppercase tracking-widest-plus text-gold">Síguenos</h4>
          <ul className="space-y-2 text-sm text-ivory-dim">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.label}>
                <a href={social.href} target="_blank" rel="noreferrer" className="hover:text-ivory">
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-gold/10 px-4 py-6 text-center text-xs text-ivory-dim/70 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} {STORE_CONFIG.name}. Todos los derechos reservados.
      </div>
    </footer>
  )
}
