/** Numerito rojo para avisar cosas pendientes; no dibuja nada si el conteo es 0. */
export function CountBadge({ count, className = '' }) {
  if (!count) return null
  return (
    <span
      aria-label={`${count} sin atender`}
      className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-semibold leading-none text-white ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
