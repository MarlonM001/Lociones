import { useEffect, useRef, useState } from 'react'
import { createAuction, updateAuction } from '@/services/auctions'
import { getProducts } from '@/services/products'
import { getCategoryById } from '@/config/categories'
import { formatCurrency } from '@/utils/formatCurrency'
import { isNonEmpty, validateFields } from '@/utils/validation'
import { useToast } from '@/hooks/useToast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

const EMPTY_VALUES = {
  title: '',
  description: '',
  kind: 'product',
  startingPrice: '',
  minIncrement: '5000',
  startsAt: '',
  endsAt: '',
}

const RULES = {
  title: (value) => (!isNonEmpty(value) ? 'Ingresa un título' : null),
  startingPrice: (value) => (!value || Number(value) < 0 ? 'Ingresa un precio inicial válido' : null),
  minIncrement: (value) => (!value || Number(value) <= 0 ? 'Ingresa un incremento mínimo válido' : null),
  startsAt: (value) => (!isNonEmpty(value) ? 'Elige cuándo empieza' : null),
  endsAt: (value) => (!isNonEmpty(value) ? 'Elige cuándo cierra' : null),
}

function toDatetimeLocal(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function AuctionFormModal({ open, auction, onClose, onSaved }) {
  const { showToast } = useToast()
  const fileInputRef = useRef(null)
  const [values, setValues] = useState(EMPTY_VALUES)
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const isEditing = Boolean(auction)
  const locked = isEditing && auction.bidCount > 0

  useEffect(() => {
    if (!open) return
    setErrors({})
    setFormError(null)
    setSearch('')
    setSearchResults([])
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (auction) {
      setValues({
        title: auction.title,
        description: auction.description,
        kind: auction.kind,
        startingPrice: String(auction.startingPrice),
        minIncrement: String(auction.minIncrement),
        startsAt: toDatetimeLocal(auction.startsAt),
        endsAt: toDatetimeLocal(auction.endsAt),
      })
      setItems(auction.items.map((item) => ({ ...item.product, quantity: item.quantity })))
    } else {
      setValues(EMPTY_VALUES)
      setItems([])
    }
  }, [open, auction])

  useEffect(() => {
    const term = search.trim()
    if (!term) {
      setSearchResults([])
      return
    }
    let cancelled = false
    getProducts({ search: term }).then((products) => {
      if (!cancelled) {
        const selectedIds = new Set(items.map((item) => item.id))
        setSearchResults(products.filter((product) => !selectedIds.has(product.id)).slice(0, 6))
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const handleChange = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleAddItem = (product) => {
    if (values.kind === 'product') {
      setItems([{ ...product, quantity: 1 }])
    } else {
      setItems((current) => [...current, { ...product, quantity: 1 }])
    }
    setSearch('')
    setSearchResults([])
  }

  const handleQuantityChange = (productId, quantity) => {
    setItems((current) => current.map((item) => (item.id === productId ? { ...item, quantity } : item)))
  }

  const handleRemoveItem = (productId) => {
    setItems((current) => current.filter((item) => item.id !== productId))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError(null)
    const { valid, errors: fieldErrors } = validateFields(values, RULES)
    setErrors(fieldErrors)
    if (!valid) return
    if (items.length === 0) {
      setFormError('Selecciona al menos un producto.')
      return
    }
    if (new Date(values.endsAt) <= new Date(values.startsAt)) {
      setFormError('La fecha de cierre debe ser posterior a la de inicio.')
      return
    }

    setSubmitting(true)
    try {
      const imageFile = fileInputRef.current?.files?.[0] ?? null
      const payload = {
        ...values,
        items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
        ...(imageFile && { imageFile }),
      }
      if (isEditing) {
        await updateAuction(auction.id, payload)
        showToast('Subasta actualizada')
      } else {
        await createAuction(payload)
        showToast('Subasta creada')
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
    <Modal open={open} onClose={onClose} title={isEditing ? 'Editar subasta' : 'Nueva subasta'}>
      <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
        {formError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {formError}
          </div>
        )}
        {locked && (
          <div className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-xs text-gold">
            Esta subasta ya tiene pujas: no se pueden cambiar los productos, el precio inicial, el incremento
            mínimo ni la fecha de inicio. Solo puedes ajustar el título, la descripción, la foto o adelantar/atrasar
            el cierre.
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm text-ivory-dim">Título</label>
          <input
            type="text"
            value={values.title}
            onChange={handleChange('title')}
            placeholder='Ej: "Subasta especial: Baccarat Rouge 540"'
            className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory placeholder:text-ivory-dim/50 focus:border-gold focus:outline-none"
          />
          {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm text-ivory-dim">Descripción (opcional)</label>
          <textarea
            value={values.description}
            onChange={handleChange('description')}
            rows={2}
            className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-ivory-dim">Tipo</label>
          <div className="flex gap-2">
            {[
              { value: 'product', label: 'Un solo producto' },
              { value: 'combo', label: 'Combo (varios productos)' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={locked}
                onClick={() => setValues((current) => ({ ...current, kind: option.value }))}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors disabled:opacity-50 ${
                  values.kind === option.value
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-ivory/10 text-ivory-dim hover:text-ivory'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-ivory-dim">
            {values.kind === 'combo' ? 'Productos del combo' : 'Producto'}
          </label>

          {!locked && (
            <div className="relative">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Busca por nombre, SKU o slug..."
                disabled={values.kind === 'product' && items.length > 0}
                className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory placeholder:text-ivory-dim/50 focus:border-gold focus:outline-none disabled:opacity-50"
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-ivory/10 bg-charcoal shadow-xl">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleAddItem(product)}
                      className="flex w-full items-center gap-2 border-b border-ivory/5 px-3 py-2 text-left text-sm last:border-0 hover:bg-ivory/5"
                    >
                      <img src={product.image} alt="" className="h-8 w-8 rounded bg-white object-contain p-0.5" />
                      <span className="flex-1 text-ivory">{product.name}</span>
                      <span className="text-xs text-ivory-dim">{formatCurrency(product.price)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-2 flex flex-col gap-2">
            {items.map((item) => {
              const category = getCategoryById(item.categoryId)
              return (
                <div key={item.id} className="flex items-center gap-3 rounded-lg border border-ivory/5 bg-ink px-3 py-2">
                  <img src={item.image} alt="" className="h-10 w-10 rounded bg-white object-contain p-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-ivory">{item.name}</p>
                    <p className="text-xs text-ivory-dim">{category?.name} · {formatCurrency(item.price)}</p>
                  </div>
                  {values.kind === 'combo' && (
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      disabled={locked}
                      onChange={(event) => handleQuantityChange(item.id, Number(event.target.value) || 1)}
                      className="w-16 rounded-lg border border-ivory/10 bg-charcoal px-2 py-1 text-center text-sm text-ivory focus:border-gold focus:outline-none disabled:opacity-50"
                    />
                  )}
                  {!locked && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-xs text-ivory-dim hover:text-red-400"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              )
            })}
            {items.length === 0 && <p className="text-xs text-ivory-dim">Aún no has agregado productos.</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-ivory-dim">Precio inicial (COP)</label>
            <input
              type="number"
              min="0"
              disabled={locked}
              value={values.startingPrice}
              onChange={handleChange('startingPrice')}
              className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory focus:border-gold focus:outline-none disabled:opacity-50"
            />
            {errors.startingPrice && <p className="mt-1 text-xs text-red-400">{errors.startingPrice}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm text-ivory-dim">Incremento mínimo por puja (COP)</label>
            <input
              type="number"
              min="1"
              disabled={locked}
              value={values.minIncrement}
              onChange={handleChange('minIncrement')}
              className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory focus:border-gold focus:outline-none disabled:opacity-50"
            />
            {errors.minIncrement && <p className="mt-1 text-xs text-red-400">{errors.minIncrement}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-ivory-dim">Empieza</label>
            <input
              type="datetime-local"
              disabled={locked}
              value={values.startsAt}
              onChange={handleChange('startsAt')}
              className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory focus:border-gold focus:outline-none disabled:opacity-50"
            />
            {errors.startsAt && <p className="mt-1 text-xs text-red-400">{errors.startsAt}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm text-ivory-dim">Cierra</label>
            <input
              type="datetime-local"
              value={values.endsAt}
              onChange={handleChange('endsAt')}
              className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory focus:border-gold focus:outline-none"
            />
            {errors.endsAt && <p className="mt-1 text-xs text-red-400">{errors.endsAt}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-ivory-dim">
            Foto de la subasta {isEditing && '(opcional — deja vacío para mantener la actual)'}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="w-full text-sm text-ivory-dim file:mr-4 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:text-sm file:font-medium file:text-on-gold"
          />
          <p className="mt-1 text-xs text-ivory-dim">
            Si no subes una, se usa la foto del producto (o la del primer producto, si es combo).
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear subasta'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
