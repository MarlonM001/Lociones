import { useEffect, useRef, useState } from 'react'

/**
 * Envuelve contenido y le aplica la animación `animate-fade-up` (ya definida
 * en styles/index.css) la primera vez que entra al viewport, en vez de
 * dispararla de una al cargar la página. `delay` permite escalonar tarjetas
 * dentro de una misma grilla (efecto "stagger").
 *
 * Usa IntersectionObserver en vez de un listener de scroll/resize propio:
 * en móvil, la barra de direcciones del navegador se oculta/muestra al
 * hacer scroll y eso cambia `window.innerHeight` a cada rato, disparando el
 * chequeo basado en resize en momentos erráticos — el contenido se quedaba
 * en opacity-0 (mostrando el fondo) un instante de más y luego aparecía ya
 * desplazado. IntersectionObserver no depende de esas medidas y solo
 * notifica cuando el elemento realmente entra al viewport.
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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px 40px 0px', threshold: 0 },
    )

    observer.observe(node)

    return () => observer.disconnect()
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
