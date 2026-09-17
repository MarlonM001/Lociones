import { useEffect, useState } from 'react'

const SCROLL_REVEAL_PX = 24

/**
 * Los botones flotantes (chat, WhatsApp) son `fixed` en las esquinas
 * inferiores, así que si no se ocultan pueden tapar contenido real:
 * - Al final de la página, lo que sea que el footer tenga ahí (en móvil
 *   apila sus columnas, así que el bloque en riesgo cambia según cada
 *   página) — se resuelve ocultándolos mientras el footer sea visible.
 * - Al cargar una página más alta que la pantalla, el borde inferior del
 *   contenido inicial (antes de que el visitante haga scroll) — se resuelve
 *   no mostrándolos hasta el primer scroll. En páginas cortas esto no quita
 *   nada: ahí el footer ya es visible desde el inicio y los oculta la otra
 *   regla.
 */
export function useHideNearFooter() {
  const [nearFooter, setNearFooter] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const footer = document.getElementById('site-footer')
    if (!footer) return undefined

    const observer = new IntersectionObserver(([entry]) => setNearFooter(entry.isIntersecting))
    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > SCROLL_REVEAL_PX)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return nearFooter || !scrolled
}
