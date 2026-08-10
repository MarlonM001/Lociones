export function Loading({ label = 'Cargando...', fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ivory-dim">
      <span className="h-10 w-10 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
      <p className="text-sm tracking-wide">{label}</p>
    </div>
  )

  if (fullScreen) {
    return <div className="flex min-h-[60vh] items-center justify-center">{content}</div>
  }

  return content
}
