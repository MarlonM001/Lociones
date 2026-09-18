import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SHIPPING_CITY_NAMES, isCityAvailable } from '@/config/shipping'
import { validateDeliveryAddress } from '@/services/geocoding'
import { isNonEmpty, isValidEmail, isValidPhone, validateFields } from '@/utils/validation'
import { Button } from '@/components/ui/Button'

const INITIAL_VALUES = {
  customerEmail: '',
  firstName: '',
  lastName: '',
  customerPhone: '',
  city: '',
  address: '',
}

const RULES = {
  customerEmail: (value) => (value && !isValidEmail(value) ? 'Ingresa un email válido' : null),
  firstName: (value) => (!isNonEmpty(value) ? 'Ingresa tu nombre' : null),
  lastName: (value) => (!isNonEmpty(value) ? 'Ingresa tu apellido' : null),
  customerPhone: (value) => (!isValidPhone(value) ? 'Ingresa un teléfono válido' : null),
  city: (value) => (!isCityAvailable(value) ? 'Por ahora solo enviamos a las ciudades listadas' : null),
  address: (value) => (!isNonEmpty(value) ? 'Ingresa la dirección de entrega' : null),
}

export function CheckoutForm({ onSubmit, submitting, defaultValues }) {
  const location = useLocation()
  const navigate = useNavigate()
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
    onSubmit({ ...values, customerName: `${values.firstName.trim()} ${values.lastName.trim()}`.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-ivory-dim">
        ¿Ya tienes una cuenta?{' '}
        <button
          type="button"
          onClick={() => navigate('/login', { state: { from: location.pathname } })}
          className="text-gold hover:underline"
        >
          Iniciar sesión
        </button>
      </p>

      <div>
        <label className="mb-1 block text-sm text-ivory-dim">Email (opcional)</label>
        <input
          type="email"
          value={values.customerEmail}
          onChange={handleChange('customerEmail')}
          className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory focus:border-gold focus:outline-none"
        />
        {errors.customerEmail && <p className="mt-1 text-xs text-red-400">{errors.customerEmail}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-ivory-dim">Nombre</label>
          <input
            type="text"
            value={values.firstName}
            onChange={handleChange('firstName')}
            className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory focus:border-gold focus:outline-none"
          />
          {errors.firstName && <p className="mt-1 text-xs text-red-400">{errors.firstName}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm text-ivory-dim">Apellido</label>
          <input
            type="text"
            value={values.lastName}
            onChange={handleChange('lastName')}
            className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory focus:border-gold focus:outline-none"
          />
          {errors.lastName && <p className="mt-1 text-xs text-red-400">{errors.lastName}</p>}
        </div>
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

      <Button type="submit" variant="primary" size="lg" disabled={submitting || checkingAddress} fullWidth>
        {checkingAddress ? 'Verificando dirección...' : 'Continuar'}
      </Button>
    </form>
  )
}
