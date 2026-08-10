import { useEffect, useRef, useState } from 'react'
import { createProduct, updateProduct } from '@/services/products'
import { CATEGORIES } from '@/config/categories'
import { isNonEmpty, validateFields } from '@/utils/validation'
import { useToast } from '@/hooks/useToast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

const EMPTY_VALUES = {
  name: '',
  categoryId: CATEGORIES[0]?.id ?? '',
  price: '',
  sku: '',
  stock: '',
  shortDescription: '',
  description: '',
}

const RULES = {
  name: (value) => (!isNonEmpty(value) ? 'Ingresa el nombre del producto' : null),
  categoryId: (value) => (!isNonEmpty(value) ? 'Selecciona una categoría' : null),
  price: (value) => (!value || Number(value) <= 0 ? 'Ingresa un precio válido' : null),
  stock: (value) => (value === '' || Number(value) < 0 ? 'Ingresa un stock válido' : null),
}

export function ProductFormModal({ open, product, onClose, onSaved }) {
  const { showToast } = useToast()
  const fileInputRef = useRef(null)
  const [values, setValues] = useState(EMPTY_VALUES)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const isEditing = Boolean(product)

  useEffect(() => {
    if (!open) return
    setErrors({})
    setFormError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setValues(
      product
        ? {
            name: product.name,
            categoryId: product.categoryId,
            price: String(product.price),
            sku: product.sku,
            stock: String(product.stock),
            shortDescription: product.shortDescription,
            description: product.description,
          }
        : EMPTY_VALUES,
    )
  }, [open, product])

  const handleChange = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError(null)
    const { valid, errors: fieldErrors } = validateFields(values, RULES)
    setErrors(fieldErrors)
    if (!valid) return

    setSubmitting(true)
    try {
      const imageFile = fileInputRef.current?.files?.[0] ?? null
      if (isEditing) {
        await updateProduct(product.id, { ...values, ...(imageFile && { imageFile }) })
        showToast('Producto actualizado')
      } else {
        await createProduct({ ...values, imageFile })
        showToast('Producto creado')
      }
      onSaved?.()
      onClose()
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Editar producto' : 'Nuevo producto'}>
      <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
        {formError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {formError}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm text-ivory-dim">Nombre</label>
          <input
            type="text"
            value={values.name}
            onChange={handleChange('name')}
            className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory focus:border-gold focus:outline-none"
          />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-ivory-dim">Categoría</label>
            <select
              value={values.categoryId}
              onChange={handleChange('categoryId')}
              className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory focus:border-gold focus:outline-none"
            >
              {CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-ivory-dim">SKU (opcional)</label>
            <input
              type="text"
              value={values.sku}
              onChange={handleChange('sku')}
              placeholder="Autogenerado si se deja vacío"
              className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory placeholder:text-ivory-dim/50 focus:border-gold focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-ivory-dim">Precio (COP)</label>
            <input
              type="number"
              min="0"
              value={values.price}
              onChange={handleChange('price')}
              className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory focus:border-gold focus:outline-none"
            />
            {errors.price && <p className="mt-1 text-xs text-red-400">{errors.price}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm text-ivory-dim">Stock</label>
            <input
              type="number"
              min="0"
              value={values.stock}
              onChange={handleChange('stock')}
              className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory focus:border-gold focus:outline-none"
            />
            {errors.stock && <p className="mt-1 text-xs text-red-400">{errors.stock}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-ivory-dim">Descripción corta</label>
          <input
            type="text"
            value={values.shortDescription}
            onChange={handleChange('shortDescription')}
            className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-ivory-dim">Descripción completa</label>
          <textarea
            value={values.description}
            onChange={handleChange('description')}
            rows={3}
            className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-ivory-dim">
            Foto del producto {isEditing && '(opcional — deja vacío para mantener la actual)'}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="w-full text-sm text-ivory-dim file:mr-4 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:text-sm file:font-medium file:text-on-gold"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
