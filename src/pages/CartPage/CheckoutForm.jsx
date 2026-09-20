import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  SHIPPING_DEPARTMENTS,
  findPlaceByCityValue,
  getCitiesByDepartment,
  isCityAvailable,
} from '@/config/shipping'
import { validateDeliveryAddress } from '@/services/geocoding'
import { isNonEmpty, isValidEmail, isValidPhone, validateFields } from '@/utils/validation'
import { Button } from '@/components/ui/Button'

const INITIAL_VALUES = {
  customerEmail: '',
  firstName: '',
  lastName: '',
  customerPhone: '',
  department: '',
  city: '',
  neighborhood: '',
  address: '',
}

const RULES = {
  customerEmail: (value) => {
    if (!isNonEmpty(value)) return 'Ingresa tu email'
    return isValidEmail(value) ? null : 'Ingresa un email válido'
  },
  firstName: (value) => (!isNonEmpty(value) ? 'Ingresa tu nombre' : null),
  lastName: (value) => (!isNonEmpty(value) ? 'Ingresa tu apellido' : null),
  customerPhone: (value) => (!isValidPhone(value) ? 'Ingresa un teléfono válido' : null),
  department: (value) => (!isNonEmpty(value) ? 'Elige un departamento' : null),
  city: (value) => {
    if (!isNonEmpty(value)) return 'Elige una ciudad'
    return isCityAvailable(value) ? null : 'Elige una ciudad de la lista'
  },
  neighborhood: (value) => (!isNonEmpty(value) ? 'Ingresa el barrio' : null),
  address: (value) => (!isNonEmpty(value) ? 'Ingresa la dirección de entrega' : null),
}

const INPUT_CLASSES =
  'w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory placeholder:text-ivory-dim/60 focus:border-gold focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'

function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-ivory-dim">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function CheckoutForm({ onSubmit, submitting, defaultValues }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [values, setValues] = useState(() => {
    const initial = { ...INITIAL_VALUES, ...defaultValues }
    // Los pedidos guardan solo la ciudad ("Yopal, Casanare"); el departamento se deduce de ella al volver a
    // editar. Si la ciudad de la cuenta no es una de la lista, se deja vacía para que el cliente la elija.
    const place = findPlaceByCityValue(initial.city)
    return { ...initial, department: place?.department ?? '', city: place ? initial.city : '' }
  })
  const [errors, setErrors] = useState({})
  const [checkingAddress, setCheckingAddress] = useState(false)

  const cities = getCitiesByDepartment(values.department)

  const handleChange = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  // Al cambiar de departamento la ciudad elegida deja de valer, así que se borra.
  const handleDepartmentChange = (event) => {
    setValues((current) => ({ ...current, department: event.target.value, city: '' }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const { valid, errors: fieldErrors } = validateFields(values, RULES)
    setErrors(fieldErrors)
    if (!valid) return

    setCheckingAddress(true)
    const place = findPlaceByCityValue(values.city)
    const result = await validateDeliveryAddress(values.address, place.city, place.department)
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
        address: `Esa dirección no parece estar en ${place.city}. Revisa la ciudad o la dirección.`,
      }))
      return
    }
    // 'valid', 'skipped' (sin API key configurada) o 'error' (falla de red):
    // en estos dos últimos casos dejamos pasar para no bloquear la compra
    // por un problema del servicio externo, no de la dirección en sí.
    onSubmit({
      ...values,
      neighborhood: values.neighborhood.trim(),
      customerName: `${values.firstName.trim()} ${values.lastName.trim()}`.trim(),
    })
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

      <Field id="checkout-email" label="Email" error={errors.customerEmail}>
        <input
          id="checkout-email"
          type="email"
          value={values.customerEmail}
          onChange={handleChange('customerEmail')}
          placeholder="tucorreo@ejemplo.com"
          autoComplete="email"
          className={INPUT_CLASSES}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field id="checkout-first-name" label="Nombre" error={errors.firstName}>
          <input
            id="checkout-first-name"
            type="text"
            value={values.firstName}
            onChange={handleChange('firstName')}
            placeholder="Ej. Laura"
            autoComplete="given-name"
            className={INPUT_CLASSES}
          />
        </Field>
        <Field id="checkout-last-name" label="Apellido" error={errors.lastName}>
          <input
            id="checkout-last-name"
            type="text"
            value={values.lastName}
            onChange={handleChange('lastName')}
            placeholder="Ej. Gómez"
            autoComplete="family-name"
            className={INPUT_CLASSES}
          />
        </Field>
      </div>

      <Field id="checkout-phone" label="Teléfono" error={errors.customerPhone}>
        <input
          id="checkout-phone"
          type="tel"
          inputMode="tel"
          value={values.customerPhone}
          onChange={handleChange('customerPhone')}
          placeholder="Ej. 3001234567"
          autoComplete="tel"
          className={INPUT_CLASSES}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-3">
        <Field id="checkout-department" label="Departamento" error={errors.department}>
          <select
            id="checkout-department"
            value={values.department}
            onChange={handleDepartmentChange}
            autoComplete="address-level1"
            className={`${INPUT_CLASSES} ${values.department ? '' : 'text-ivory-dim'}`}
          >
            <option value="">Elige una opción...</option>
            {SHIPPING_DEPARTMENTS.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </Field>
        <Field id="checkout-city" label="Ciudad" error={errors.city}>
          <select
            id="checkout-city"
            value={values.city}
            onChange={handleChange('city')}
            disabled={!values.department}
            autoComplete="address-level2"
            className={`${INPUT_CLASSES} ${values.city ? '' : 'text-ivory-dim'}`}
          >
            <option value="">{values.department ? 'Elige una opción...' : 'Elige primero el departamento'}</option>
            {cities.map((city) => (
              <option key={city.value} value={city.value}>
                {city.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field id="checkout-address" label="Dirección" error={errors.address}>
        <input
          id="checkout-address"
          type="text"
          value={values.address}
          onChange={handleChange('address')}
          placeholder="Ej. Calle 12 # 34-56, apto 201"
          autoComplete="street-address"
          className={INPUT_CLASSES}
        />
      </Field>

      <Field id="checkout-neighborhood" label="Barrio" error={errors.neighborhood}>
        <input
          id="checkout-neighborhood"
          type="text"
          value={values.neighborhood}
          onChange={handleChange('neighborhood')}
          placeholder="Ej. Chapinero"
          autoComplete="address-level3"
          className={INPUT_CLASSES}
        />
      </Field>

      <Button type="submit" variant="primary" size="lg" disabled={submitting || checkingAddress} fullWidth>
        {checkingAddress ? 'Verificando dirección...' : 'Continuar'}
      </Button>
    </form>
  )
}
