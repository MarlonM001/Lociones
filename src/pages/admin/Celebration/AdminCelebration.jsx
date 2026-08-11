import { useEffect, useState } from 'react'
import { getCelebrationConfig, saveCelebrationConfig } from '@/services/celebration'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'

export function AdminCelebration() {
  const { showToast } = useToast()
  const [values, setValues] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setValues(getCelebrationConfig())
  }, [])

  if (!values) return <Loading label="Cargando..." />

  const handleToggle = (event) => {
    setValues((current) => ({ ...current, enabled: event.target.checked }))
  }

  const handleSave = (event) => {
    event.preventDefault()
    setSaving(true)
    saveCelebrationConfig(values)
    showToast('Efecto de celebración guardado')
    setSaving(false)
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ivory">Celebración</h1>
      <p className="mt-1 text-sm text-ivory-dim">
        Confeti que cae desde ambos lados de la pantalla durante 1 minuto y 30 segundos cada vez que alguien entra
        a la tienda. Cada visitante corre su propio temporizador, así que puedes dejarlo encendido sin que se vuelva
        molesto. Es puramente decorativo y no se puede cerrar desde la tienda.
      </p>

      <form onSubmit={handleSave} className="mt-8 max-w-xl rounded-2xl border border-ivory/5 bg-charcoal p-6">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={values.enabled}
            onChange={handleToggle}
            className="h-5 w-5 rounded border-ivory/20 accent-gold"
          />
          <span className="text-ivory">Mostrar confeti al entrar a la tienda</span>
        </label>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          <span className={`text-xs ${values.enabled ? 'text-emerald-400' : 'text-ivory-dim'}`}>
            {values.enabled ? '● Activo en la tienda' : '○ Desactivado'}
          </span>
        </div>
      </form>
    </div>
  )
}
