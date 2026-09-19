import { formatCurrency } from '@/utils/formatCurrency'

/**
 * Precio con números de trazo firme (sans-serif, alineados a la línea base y de
 * ancho fijo) en vez de la fuente decorativa de los títulos, cuyos números
 * "antiguos" suben y bajan y le restan seriedad al valor. El símbolo va más
 * chico para que el monto sea lo que se lea primero.
 */
export function Price({ value, className = '' }) {
  const formatted = formatCurrency(value)
  const match = formatted.match(/^([^\d-]+?)\s*(-?[\d.,\s ]+)$/)

  if (!match) return <span className={`price ${className}`}>{formatted}</span>

  const [, symbol, amount] = match
  return (
    <span className={`price ${className}`}>
      <span className="mr-[0.15em] align-[0.12em] text-[0.62em] font-semibold opacity-80">{symbol.trim()}</span>
      {amount.trim()}
    </span>
  )
}
