import { useEffect } from 'react'
import { DEFAULT_TITLE, resetBaseTitle, setBaseTitle } from '@/utils/documentTitle'
import { STORE_CONFIG } from '@/config/store'

const DEFAULT_DESCRIPTION =
  'Perfumería de lujo online — Lociones árabes, para mujer y para caballero. Compra fácil, envíos a toda Colombia, confirmación por WhatsApp.'
const DEFAULT_IMAGE = '/images/brand/logo-icon.png'

function upsertHead(selector, create, apply) {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = create()
    document.head.appendChild(element)
  }
  apply(element)
  return element
}

function setMeta(attribute, name, content) {
  upsertHead(
    `meta[${attribute}="${name}"]`,
    () => {
      const meta = document.createElement('meta')
      meta.setAttribute(attribute, name)
      return meta
    },
    (meta) => meta.setAttribute('content', content),
  )
}

function absoluteUrl(path) {
  return path?.startsWith('http') ? path : `${window.location.origin}${path ?? ''}`
}

/**
 * Título, descripción, dirección canónica, imagen para compartir y datos estructurados de la página
 * actual. La tienda es una sola página que cambia por dentro, así que sin esto todas las direcciones
 * se verían igual para Google y para quien comparte un enlace. `noindex` pide que no aparezca en
 * buscadores (carrito, cuenta, seguimiento, páginas que no existen). `jsonLd` son datos estructurados
 * (por ejemplo el precio y la disponibilidad de un producto).
 */
export function useDocumentMeta({ title, description, image, noindex = false, jsonLd } = {}) {
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd) : null

  useEffect(() => {
    const fullTitle = title ? `${title} | ${STORE_CONFIG.name}` : DEFAULT_TITLE
    const text = description || DEFAULT_DESCRIPTION
    const url = `${window.location.origin}${window.location.pathname}`

    setBaseTitle(fullTitle)
    setMeta('name', 'description', text)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', text)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', absoluteUrl(image ?? DEFAULT_IMAGE))
    setMeta('name', 'twitter:card', 'summary')
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')
    upsertHead(
      'link[rel="canonical"]',
      () => {
        const link = document.createElement('link')
        link.setAttribute('rel', 'canonical')
        return link
      },
      (link) => link.setAttribute('href', url),
    )

    let script = null
    if (jsonLdText) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.text = jsonLdText
      document.head.appendChild(script)
    }

    return () => {
      script?.remove()
      resetBaseTitle()
      setMeta('name', 'description', DEFAULT_DESCRIPTION)
      setMeta('name', 'robots', 'index, follow')
    }
  }, [title, description, image, noindex, jsonLdText])
}
