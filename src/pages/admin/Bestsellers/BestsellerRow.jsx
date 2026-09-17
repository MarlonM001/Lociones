import { useRef } from 'react'
import { getCategoryById } from '@/config/categories'
import { formatCurrency } from '@/utils/formatCurrency'

export function BestsellerRow({ product, position, isFirst, isLast, onMoveUp, onMoveDown, onRemove, onImageChange }) {
  const fileInputRef = useRef(null)
  const category = getCategoryById(product.categoryId)

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (file) onImageChange(product, file)
    event.target.value = ''
  }

  return (
    <tr className="border-b border-ivory/5 last:border-0">
      <td className="px-4 py-3 text-center text-sm text-ivory-dim">{position}</td>
      <td className="px-4 py-3">
        <img
          src={product.bestsellerImage || product.image}
          alt={product.name}
          className="h-14 w-14 rounded-lg bg-white object-contain p-1"
        />
      </td>
      <td className="px-4 py-3 text-sm text-ivory">
        <div>{product.name}</div>
        <div className="text-xs text-ivory-dim">{category?.name} · {formatCurrency(product.price)}</div>
      </td>
      <td className="px-4 py-3 text-sm">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-gold hover:underline"
        >
          {product.bestsellerImage ? 'Cambiar foto' : 'Subir foto especial'}
        </button>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
        <button
          type="button"
          aria-label="Subir posición"
          onClick={() => onMoveUp(product)}
          disabled={isFirst}
          className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-ivory-dim transition-colors hover:bg-ivory/5 hover:text-ivory disabled:opacity-20"
        >
          ↑
        </button>
        <button
          type="button"
          aria-label="Bajar posición"
          onClick={() => onMoveDown(product)}
          disabled={isLast}
          className="mr-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-ivory-dim transition-colors hover:bg-ivory/5 hover:text-ivory disabled:opacity-20"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={() => onRemove(product)}
          className="text-ivory-dim hover:text-red-400"
        >
          Quitar
        </button>
      </td>
    </tr>
  )
}
