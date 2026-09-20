import { Button } from '@/components/ui/Button'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

/** Página para direcciones que no existen. Se marca "noindex" para que los buscadores no la guarden. */
export function NotFound() {
  useDocumentMeta({ title: 'Página no encontrada', noindex: true })

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="text-xs uppercase tracking-widest-plus text-gold">Error 404</span>
      <h1 className="font-display text-3xl text-ivory sm:text-4xl">Página no encontrada</h1>
      <p className="text-ivory-dim">El contenido que buscas no existe o fue movido.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Button to="/" variant="primary">
          Ir al inicio
        </Button>
        <Button to="/catalogo" variant="secondary">
          Ver catálogo
        </Button>
      </div>
    </div>
  )
}
