import { useEffect, useRef, useState } from 'react'

/**
 * Envuelve contenido y le aplica la animación `animate-fade-up` (ya definida
 * en styles/index.css) la primera vez que entra al viewport, en vez de
 * dispararla de una al cargar la página. `delay` permite escalonar tarjetas
 * dentro de una misma grilla (efecto "stagger").
 *
 * Deliberadamente NO usa requestAnimationFrame para acotar la frecuencia del
 * chequeo: el chequeo (un getBoundingClientRect) es barato, y algunos
 * entornos de renderizado pausan rAF cuando la pestaña no está siendo
 * compuesta activamente, lo que dejaría la revelación colgada. Un listener
 * directo de scroll/resize es más lento de lo estrictamente necesario pero
 * nunca se queda esperando un frame que no llega.
 */
export function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return undefined
    }

    const check = () => {
      const rect = node.getBoundingClientRect()
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight
      if (rect.top < viewportHeight - 40 && rect.bottom > 0) {
        setVisible(true)
        window.removeEventListener('scroll', check)
        window.removeEventListener('resize', check)
      }
    }

    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)

    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={`${visible ? 'animate-fade-up' : 'opacity-0'} ${className}`}
      style={visible ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
