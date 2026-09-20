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
  salePrice: '',
  saleEndsOn: '',
  sku: '',
  stock: '',
  shortDescription: '',
  description: '',
  isBestseller: false,
  bestsellerRank: '',
}

const RULES = {
  name: (value) => (!isNonEmpty(value) ? 'Ingresa el nombre del producto' : null),
  categoryId: (value) => (!isNonEmpty(value) ? 'Selecciona una categoría' : null),
  price: (value) => (!value || Number(value) <= 0 ? 'Ingresa un precio válido' : null),
  stock: (value) => (value === '' || Number(value) < 0 ? 'Ingresa un stock válido' : null),
}

/** La oferta es opcional; si se escribe debe ser un precio válido y menor al precio normal. */
function validateSale(values) {
  const errors = {}
  if (values.salePrice !== '') {
    const sale = Number(values.salePrice)
    if (!Number.isInteger(sale) || sale <= 0) errors.salePrice = 'Ingresa un precio de oferta válido'
    else if (sale >= Number(values.price)) errors.salePrice = 'El precio de oferta debe ser menor al precio normal'
  }
  return errors
}

export function ProductFormModal({ open, product, onClose, onSaved }) {
  const { showToast } = useToast()
  const fileInputRef = useRef(null)
  const bestsellerFileInputRef = useRef(null)
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
    if (bestsellerFileInputRef.current) bestsellerFileInputRef.current.value = ''
    setValues(
      product
        ? {
            name: product.name,
            categoryId: product.categoryId,
            // `price` del producto es el precio de hoy (con oferta); el formulario edita el normal.
            price: String(product.regularPrice ?? product.price),
            salePrice: product.salePrice ? String(product.salePrice) : '',
            saleEndsOn: product.saleEndsOn ?? '',
            sku: product.sku,
            stock: String(product.stock),
            shortDescription: product.shortDescription,
            description: product.description,
            isBestseller: Boolean(product.isBestseller),
            bestsellerRank: product.bestsellerRank ? String(product.bestsellerRank) : '',
          }
        : EMPTY_VALUES,
    )
  }, [open, product])

  const handleChange = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleCheckboxChange = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.checked }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError(null)
    const { valid, errors: fieldErrors } = validateFields(values, RULES)
    const saleErrors = isEditing ? validateSale(values) : {}
    setErrors({ ...fieldErrors, ...saleErrors })
    if (!valid || Object.keys(saleErrors).length > 0) return

    setSubmitting(true)
    try {
      const imageFile = fileInputRef.current?.files?.[0] ?? null
      const bestsellerImageFile = bestsellerFileInputRef.current?.files?.[0] ?? null
      const payload = {
        ...values,
        // Sin oferta se manda vacío a propósito: así el servidor la quita si el admin la borró.
        ...(!isEditing && { salePrice: undefined, saleEndsOn: undefined }),
        ...(imageFile && { imageFile }),
        ...(bestsellerImageFile && { bestsellerImageFile }),
      }
      if (isEditing) {
        await updateProduct(product.id, payload)
        showToast('Producto actualizado')
      } else {
        await createProduct(payload)
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
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-danger">
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
          {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
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
            {errors.price && <p className="mt-1 text-xs text-danger">{errors.price}</p>}
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
            {errors.stock && <p className="mt-1 text-xs text-danger">{errors.stock}</p>}
          </div>
        </div>

        {isEditing && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm font-medium text-ivory">Oferta (opcional)</p>
            <p className="mt-1 text-xs text-ivory-dim">
              Fija un precio menor solo para este producto. Los clientes ven el precio normal tachado y pagan el de
              oferta. Déjalo vacío para quitarla.
            </p>
            {product?.saleFromBanner && (
              <p className="mt-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-ivory">
                Esta oferta la puso la franja de <strong>Promociones</strong> y se quita sola cuando cambies de
                promoción. Si la cambias aquí, pasa a ser una oferta manual.
              </p>
            )}
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="sale-price" className="mb-1 block text-sm text-ivory-dim">Precio en oferta (COP)</label>
                <input
                  id="sale-price"
                  type="number"
                  min="0"
                  value={values.salePrice}
                  onChange={handleChange('salePrice')}
                  placeholder="Ej. 89000"
                  className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory placeholder:text-ivory-dim/50 focus:border-gold focus:outline-none"
                />
                {errors.salePrice && <p className="mt-1 text-xs text-danger">{errors.salePrice}</p>}
              </div>
              <div>
                <label htmlFor="sale-ends" className="mb-1 block text-sm text-ivory-dim">Oferta válida hasta (opcional)</label>
                <input
                  id="sale-ends"
                  type="date"
                  value={values.saleEndsOn}
                  onChange={handleChange('saleEndsOn')}
                  disabled={values.salePrice === ''}
                  className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory focus:border-gold focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        )}

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
            accept="image/jpeg,image/png,image/webp"
            className="w-full text-sm text-ivory-dim file:mr-4 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:text-sm file:font-medium file:text-on-gold"
          />
        </div>

        <div className="rounded-xl border border-gold/20 bg-gold/5 p-4">
          <label className="flex items-center gap-2 text-sm text-ivory">
            <input
              type="checkbox"
              checked={values.isBestseller}
              onChange={handleCheckboxChange('isBestseller')}
              className="h-4 w-4 rounded border-ivory/20 accent-gold"
            />
            Mostrar en el módulo "Top ventas" de la página principal
          </label>

          {values.isBestseller && (
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm text-ivory-dim">Posición en el ranking (opcional)</label>
                <input
                  type="number"
                  min="1"
                  value={values.bestsellerRank}
                  onChange={handleChange('bestsellerRank')}
                  placeholder="Ej: 1 para que aparezca primero"
                  className="w-full max-w-[220px] rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory placeholder:text-ivory-dim/50 focus:border-gold focus:outline-none"
                />
                <p className="mt-1 text-xs text-ivory-dim">Si lo dejas vacío, se ordena por más reciente.</p>
              </div>

              <div>
                <label className="mb-1 block text-sm text-ivory-dim">
                  Foto destacada para Top ventas (opcional)
                </label>
                {product?.bestsellerImage && (
                  <img
                    src={product.bestsellerImage}
                    alt=""
                    className="mb-2 h-20 w-20 rounded-lg border border-ivory/10 bg-white object-contain p-1"
                  />
                )}
                <input
                  ref={bestsellerFileInputRef}
                  type="file"
                  accept="image/*"
                  className="w-full text-sm text-ivory-dim file:mr-4 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:text-sm file:font-medium file:text-on-gold"
                />
                <p className="mt-1 text-xs text-ivory-dim">
                  Si no subes una, se usa la foto normal del producto.
                </p>
              </div>
            </div>
          )}
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
