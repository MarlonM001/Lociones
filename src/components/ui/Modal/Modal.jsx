import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Fondo fijo (no depende del tema): un scrim debe oscurecer la página
          tanto en modo día como en modo noche, nunca aclararla. */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-up"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-gold/20 bg-charcoal p-6 shadow-2xl animate-fade-up">
        {title && (
          <h3 className="mb-4 font-display text-xl text-ivory">{title}</h3>
        )}
        <div className="text-ivory-dim">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
