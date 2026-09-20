import { useEffect, useRef, useState } from 'react'
import { getPromoBanner, savePromoBanner, isPromoBannerActive } from '@/services/promotions'
import { getProducts } from '@/services/products'
import { discountedPrice } from '@/utils/discount'
import { formatCurrency } from '@/utils/formatCurrency'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'

const INPUT_CLASSES =
  'w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory placeholder:text-ivory-dim/50 focus:border-gold focus:outline-none disabled:opacity-60'

function autoMessage(product, percent) {
  return product && percent ? `${percent}% DE DESCUENTO EN ${product.name.toUpperCase()}` : ''
}

/** El servidor devuelve el porcentaje como número; el formulario lo maneja como texto. */
function toFormValues(banner) {
  return { ...banner, discountPercent: banner.discountPercent ? String(banner.discountPercent) : '' }
}

export function AdminPromotions() {
  const { showToast } = useToast()
  const [values, setValues] = useState(null)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  // ¿El admin escribió el mensaje a mano? Mientras no, el panel lo arma solo con el producto y el porcentaje, para
  // que el aviso nunca diga un descuento distinto del que de verdad se aplica.
  const messageEdited = useRef(false)

  useEffect(() => {
    getPromoBanner().then((banner) => {
      messageEdited.current = Boolean(banner.product) && banner.message !== autoMessage(banner.product, banner.discountPercent)
      setValues(toFormValues(banner))
    })
  }, [])

  // Búsqueda de productos por nombre, con una pequeña espera para no consultar en cada tecla.
  useEffect(() => {
    const text = query.trim()
    if (text.length < 2) {
      setResults([])
      return undefined
    }
    let cancelled = false
    const timer = setTimeout(() => {
      getProducts({ search: text })
        .then((products) => {
          if (!cancelled) setResults(products.slice(0, 8))
        })
        .catch(() => {
          if (!cancelled) setResults([])
        })
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  if (!values) return <Loading label="Cargando..." />

  const percent = Number(values.discountPercent)
  const percentValid = Number.isInteger(percent) && percent >= 1 && percent <= 90
  const product = values.product
  const salePreview = product && percentValid ? discountedPrice(product.regularPrice, percent) : null

  /** Aplica cambios y, si el mensaje sigue siendo el que armó el panel, lo actualiza con el producto y el porcentaje nuevos. */
  const update = (changes) => {
    const next = { ...values, ...changes }
    const nextPercent = Number(next.discountPercent)
    const nextAuto = autoMessage(next.product, Number.isInteger(nextPercent) && nextPercent >= 1 ? nextPercent : null)
    if (!messageEdited.current || values.message.trim() === '') next.message = nextAuto || values.message
    if (next.product && !next.linkLabel) next.linkLabel = 'COMPRAR'
    setValues(next)
  }

  const handleChange = (field) => (event) => {
    const value = field === 'enabled' ? event.target.checked : event.target.value
    if (field === 'message') messageEdited.current = true
    if (field === 'discountPercent') update({ discountPercent: value })
    else setValues((current) => ({ ...current, [field]: value }))
  }

  const chooseProduct = (chosen) => {
    setQuery('')
    setResults([])
    messageEdited.current = false
    update({
      productId: chosen.id,
      product: { id: chosen.id, name: chosen.name, slug: chosen.slug, image: chosen.image, regularPrice: chosen.regularPrice ?? chosen.price },
      linkTo: `/producto/${chosen.slug}`,
    })
  }

  const clearProduct = () => {
    messageEdited.current = true // sin producto no hay mensaje automático: se queda el texto que había
    update({ productId: null, product: null, discountPercent: '' })
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const saved = await savePromoBanner({
        enabled: values.enabled,
        message: values.message,
        linkLabel: values.linkLabel,
        linkTo: values.linkTo,
        expiresAt: values.expiresAt,
        productId: product?.id ?? null,
        discountPercent: product ? values.discountPercent : null,
      })
      messageEdited.current = Boolean(saved.product) && saved.message !== autoMessage(saved.product, saved.discountPercent)
      setValues(toFormValues(saved))
      showToast(
        saved.enabled && saved.product
          ? `Promoción guardada: ${saved.product.name} ya se vende con ${saved.discountPercent}% de descuento.`
          : 'Aviso de promoción guardado',
        'success',
        6000,
      )
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const previewActive = isPromoBannerActive(values)

  return (
    <div>
      <h1 className="font-display text-3xl text-ivory">Promociones</h1>
      <p className="mt-1 text-sm text-ivory-dim">
        Controla el aviso de promoción que aparece arriba de toda la tienda y el descuento del producto que promociona.
      </p>

      <form onSubmit={handleSave} className="mt-8 max-w-xl rounded-2xl border border-ivory/5 bg-charcoal p-6">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={values.enabled}
            onChange={handleChange('enabled')}
            className="h-5 w-5 rounded border-ivory/20 accent-gold"
          />
          <span className="text-ivory">Mostrar el aviso en la tienda</span>
        </label>

        <div className="mt-6 rounded-xl border border-gold/20 bg-gold/5 p-4">
          <p className="text-sm font-medium text-ivory">Producto en promoción</p>
          <p className="mt-1 text-xs text-ivory-dim">
            Elige el producto y el porcentaje: al guardar, ese producto baja de precio solo. Cuando cambies de
            producto, apagues el aviso o pase la fecha, el producto vuelve a su precio normal.
          </p>

          {product ? (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-ivory/10 bg-ink p-3">
              {product.image && (
                <img src={product.image} alt="" className="h-12 w-12 shrink-0 rounded-md bg-white object-contain p-1" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ivory">{product.name}</p>
                <p className="text-xs text-ivory-dim">Precio normal {formatCurrency(product.regularPrice)}</p>
              </div>
              <button type="button" onClick={clearProduct} className="text-sm text-ivory-dim hover:text-danger">
                Quitar
              </button>
            </div>
          ) : (
            <div className="relative mt-4">
              <label htmlFor="promo-product-search" className="mb-1 block text-sm text-ivory-dim">Buscar producto por nombre</label>
              <input
                id="promo-product-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ej. Cookie Crave"
                autoComplete="off"
                className={INPUT_CLASSES}
              />
              {results.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-ivory/10 bg-charcoal shadow-xl">
                  {results.map((result) => (
                    <li key={result.id}>
                      <button
                        type="button"
                        onClick={() => chooseProduct(result)}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-ivory hover:bg-ivory/5"
                      >
                        <span className="truncate">{result.name}</span>
                        <span className="shrink-0 text-xs text-ivory-dim">{formatCurrency(result.regularPrice ?? result.price)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {product && (
            <div className="mt-4">
              <label htmlFor="promo-percent" className="mb-1 block text-sm text-ivory-dim">Descuento (%)</label>
              <input
                id="promo-percent"
                type="number"
                min="1"
                max="90"
                value={values.discountPercent}
                onChange={handleChange('discountPercent')}
                placeholder="Ej. 20"
                className={`${INPUT_CLASSES} sm:w-40`}
              />
              {salePreview !== null && (
                <p className="mt-2 text-sm text-ivory">
                  Los clientes verán <span className="text-ivory-dim line-through">{formatCurrency(product.regularPrice)}</span>{' '}
                  y pagarán <strong className="text-gold">{formatCurrency(salePreview)}</strong>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-5">
          <label htmlFor="promo-message" className="mb-1 block text-sm text-ivory-dim">Mensaje del aviso</label>
          <input
            id="promo-message"
            type="text"
            value={values.message}
            onChange={handleChange('message')}
            placeholder="Ej. 20% de descuento en toda la colección Árabes esta semana"
            maxLength={140}
            className={INPUT_CLASSES}
          />
          <p className="mt-2 text-xs text-ivory-dim">
            {product
              ? 'Se arma solo con el producto y el porcentaje, pero puedes cambiarlo.'
              : 'Sin producto elegido, el aviso es solo un mensaje y no cambia ningún precio.'}
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="promo-link-label" className="mb-1 block text-sm text-ivory-dim">Texto del enlace (opcional)</label>
            <input
              id="promo-link-label"
              type="text"
              value={values.linkLabel}
              onChange={handleChange('linkLabel')}
              placeholder="Ver colección"
              className={INPUT_CLASSES}
            />
          </div>
          <div>
            <label htmlFor="promo-link-to" className="mb-1 block text-sm text-ivory-dim">Ruta del enlace (opcional)</label>
            <input
              id="promo-link-to"
              type="text"
              value={product ? `/producto/${product.slug}` : values.linkTo}
              onChange={handleChange('linkTo')}
              disabled={Boolean(product)}
              placeholder="/productos/arabia"
              className={INPUT_CLASSES}
            />
            {product && <p className="mt-1 text-xs text-ivory-dim">Lleva a la página del producto en promoción.</p>}
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="promo-expires" className="mb-1 block text-sm text-ivory-dim">Válido hasta (opcional)</label>
          <input
            id="promo-expires"
            type="date"
            value={values.expiresAt}
            onChange={handleChange('expiresAt')}
            className="rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory focus:border-gold focus:outline-none"
          />
          <p className="mt-1 text-xs text-ivory-dim">
            Después de esta fecha el aviso se oculta solo y el producto vuelve a su precio normal, aunque sigas con
            "Mostrar" activado. Sin fecha, la promoción dura hasta que la quites.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          <span className={`text-xs ${previewActive ? 'text-success' : 'text-ivory-dim'}`}>
            {previewActive ? '● Se está mostrando ahora mismo en la tienda' : '○ No se está mostrando actualmente'}
          </span>
        </div>
      </form>
    </div>
  )
}
