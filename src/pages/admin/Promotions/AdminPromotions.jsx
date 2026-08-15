import { useEffect, useState } from 'react'
import { getPromoBanner, savePromoBanner, isPromoBannerActive } from '@/services/promotions'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'

export function AdminPromotions() {
  const { showToast } = useToast()
  const [values, setValues] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getPromoBanner().then(setValues)
  }, [])

  if (!values) return <Loading label="Cargando..." />

  const handleChange = (field) => (event) => {
    const value = field === 'enabled' ? event.target.checked : event.target.value
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await savePromoBanner(values)
      showToast('Aviso de promoción guardado')
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
        Controla el aviso de promoción o fecha especial que aparece arriba de toda la tienda.
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

        <div className="mt-5">
          <label className="mb-1 block text-sm text-ivory-dim">Mensaje</label>
          <input
            type="text"
            value={values.message}
            onChange={handleChange('message')}
            placeholder="Ej. 20% de descuento en toda la colección ARABIA esta semana"
            maxLength={140}
            className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory placeholder:text-ivory-dim/50 focus:border-gold focus:outline-none"
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-ivory-dim">Texto del enlace (opcional)</label>
            <input
              type="text"
              value={values.linkLabel}
              onChange={handleChange('linkLabel')}
              placeholder="Ver colección"
              className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory placeholder:text-ivory-dim/50 focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ivory-dim">Ruta del enlace (opcional)</label>
            <input
              type="text"
              value={values.linkTo}
              onChange={handleChange('linkTo')}
              placeholder="/productos/arabia"
              className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory placeholder:text-ivory-dim/50 focus:border-gold focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-1 block text-sm text-ivory-dim">Válido hasta (opcional)</label>
          <input
            type="date"
            value={values.expiresAt}
            onChange={handleChange('expiresAt')}
            className="rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory focus:border-gold focus:outline-none"
          />
          <p className="mt-1 text-xs text-ivory-dim">
            Después de esta fecha, el aviso se oculta solo aunque sigas con "Mostrar" activado — útil para
            promociones con fecha límite.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          <span className={`text-xs ${previewActive ? 'text-emerald-400' : 'text-ivory-dim'}`}>
            {previewActive ? '● Se está mostrando ahora mismo en la tienda' : '○ No se está mostrando actualmente'}
          </span>
        </div>
      </form>
    </div>
  )
}
