import { Price } from './Price'

/**
 * Precio de un producto. Si tiene una oferta vigente muestra el precio de hoy, el normal tachado
 * y el porcentaje de descuento; si no, solo el precio.
 */
export function PriceTag({ product, className = '' }) {
  if (!product.onSale || !product.regularPrice || product.regularPrice <= product.price) {
    return <Price value={product.price} className={className} />
  }

  const percent = Math.round((1 - product.price / product.regularPrice) * 100)
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <Price value={product.price} className={className} />
      <span className="text-sm text-ivory-dim line-through decoration-ivory-dim/60">
        <Price value={product.regularPrice} />
      </span>
      <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">-{percent}%</span>
    </span>
  )
}
