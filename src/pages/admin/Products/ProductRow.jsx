import { getCategoryById } from '@/config/categories'
import { formatCurrency } from '@/utils/formatCurrency'

export function ProductRow({ product, onEdit, onToggleActive, onDelete }) {
  const category = getCategoryById(product.categoryId)

  return (
    <tr className="border-b border-ivory/5 last:border-0">
      <td className="px-4 py-3">
        <img src={product.image} alt={product.name} className="h-12 w-12 rounded-lg object-cover" />
      </td>
      <td className="px-4 py-3 text-sm text-ivory">
        <div>{product.name}</div>
        <div className="text-xs text-ivory-dim">{product.sku}</div>
      </td>
      <td className="px-4 py-3 text-sm text-ivory-dim">{category?.name ?? product.categoryId}</td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-ivory">{formatCurrency(product.price)}</td>
      <td className="px-4 py-3 text-sm text-ivory-dim">{product.stock}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
            product.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-ivory/5 text-ivory-dim'
          }`}
        >
          {product.active ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
        <button type="button" onClick={() => onEdit(product)} className="text-gold hover:underline">
          Editar
        </button>
        <button
          type="button"
          onClick={() => onToggleActive(product)}
          className="ml-3 text-ivory-dim hover:text-ivory"
        >
          {product.active ? 'Desactivar' : 'Activar'}
        </button>
        <button
          type="button"
          onClick={() => onDelete(product)}
          className="ml-3 text-ivory-dim hover:text-red-400"
        >
          Eliminar
        </button>
      </td>
    </tr>
  )
}
