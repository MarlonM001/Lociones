import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * React Router no reinicia el scroll al navegar (es una SPA, el navegador no
 * hace una carga de página nueva). Sin esto, ir a /producto/:slug desde el
 * fondo del catálogo abre la ficha del producto en ese mismo scroll, casi
 * en el footer.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
