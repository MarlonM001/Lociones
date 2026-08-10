export function EmptyState({ title = 'No hay resultados', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ivory-dim/20 px-6 py-16 text-center">
      <h3 className="font-display text-xl text-ivory">{title}</h3>
      {message && <p className="max-w-sm text-sm text-ivory-dim">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
