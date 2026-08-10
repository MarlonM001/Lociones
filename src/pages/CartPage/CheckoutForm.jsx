import { useState } from 'react'
import { SHIPPING_CITY_NAMES, isCityAvailable } from '@/config/shipping'
import { validateDeliveryAddress } from '@/services/geocoding'
import { isNonEmpty, isValidPhone, validateFields } from '@/utils/validation'
import { Button } from '@/components/ui/Button'

const INITIAL_VALUES = { customerName: '', customerPhone: '', city: '', address: '' }

const RULES = {
  customerName: (value) => (!isNonEmpty(value) ? 'Ingresa tu nombre completo' : null),
  customerPhone: (value) => (!isValidPhone(value) ? 'Ingresa un teléfono válido' : null),
  city: (value) => (!isCityAvailable(value) ? 'Por ahora solo enviamos a las ciudades listadas' : null),
  address: (value) => (!isNonEmpty(value) ? 'Ingresa la dirección de entrega' : null),
}

export function CheckoutForm({ onSubmit, submitting, defaultValues }) {
  const [values, setValues] = useState(() => ({ ...INITIAL_VALUES, ...defaultValues }))
  const [errors, setErrors] = useState({})
  const [checkingAddress, setCheckingAddress] = useState(false)

  const handleChange = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const { valid, errors: fieldErrors } = validateFields(values, RULES)
    setErrors(fieldErrors)
    if (!valid) return

    setCheckingAddress(true)
    const result = await validateDeliveryAddress(values.address, values.city)
    setCheckingAddress(false)

    if (result.status === 'not_found') {
      setErrors((current) => ({
        ...current,
        address: 'No encontramos esa dirección. Revisa que esté bien escrita.',
      }))
      return
    }
    if (result.status === 'city_mismatch') {
      setErrors((current) => ({
        ...current,
        address: `Esa dirección no parece estar en ${values.city}. Revisa la ciudad o la dirección.`,
      }))
      return
    }
    // 'valid', 'skipped' (sin API key configurada) o 'error' (falla de red):
    // en estos dos últimos casos dejamos pasar para no bloquear la compra
    // por un problema del servicio externo, no de la dirección en sí.
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm text-ivory-dim">Nombre completo</label>
        <input
          type="text"
          value={values.customerName}
          onChange={handleChange('customerName')}
          className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory focus:border-gold focus:outline-none"
        />
        {errors.customerName && <p className="mt-1 text-xs text-red-400">{errors.customerName}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm text-ivory-dim">Teléfono</label>
        <input
          type="tel"
          value={values.customerPhone}
          onChange={handleChange('customerPhone')}
          className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory focus:border-gold focus:outline-none"
        />
        {errors.customerPhone && <p className="mt-1 text-xs text-red-400">{errors.customerPhone}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm text-ivory-dim">Ciudad de entrega</label>
        <select
          value={values.city}
          onChange={handleChange('city')}
          className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory focus:border-gold focus:outline-none"
        >
          <option value="">Selecciona una ciudad</option>
          {SHIPPING_CITY_NAMES.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
        {errors.city && <p className="mt-1 text-xs text-red-400">{errors.city}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm text-ivory-dim">Dirección</label>
        <input
          type="text"
          value={values.address}
          onChange={handleChange('address')}
          className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory focus:border-gold focus:outline-none"
        />
        {errors.address && <p className="mt-1 text-xs text-red-400">{errors.address}</p>}
      </div>

      <Button type="submit" variant="whatsapp" size="lg" disabled={submitting || checkingAddress} fullWidth>
        {checkingAddress ? 'Verificando dirección...' : submitting ? 'Creando pedido...' : 'Finalizar pedido por WhatsApp'}
      </Button>
    </form>
  )
}
