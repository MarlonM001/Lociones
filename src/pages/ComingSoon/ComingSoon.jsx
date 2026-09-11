import { Button } from '@/components/ui/Button'

export function ComingSoon({ title, message }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="text-xs uppercase tracking-widest-plus text-gold">Próximamente</span>
      <h1 className="font-display text-3xl text-ivory sm:text-4xl">{title}</h1>
      <p className="text-ivory-dim">{message}</p>
      <Button to="/catalogo" variant="secondary" className="mt-4">
        Ver catálogo
      </Button>
    </div>
  )
}
