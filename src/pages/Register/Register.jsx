import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { isNonEmpty, isValidEmail, isValidPhone, minLength, validateFields } from '@/utils/validation'
import { Button } from '@/components/ui/Button'

const INITIAL_VALUES = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  city: '',
  address: '',
}

const RULES = {
  name: (value) => (!isNonEmpty(value) ? 'Ingresa tu nombre completo' : null),
  email: (value) => (!isValidEmail(value) ? 'Ingresa un email válido' : null),
  phone: (value) => (!isValidPhone(value) ? 'Ingresa un teléfono válido' : null),
  password: (value) => (!minLength(value, 6) ? 'La contraseña debe tener al menos 6 caracteres' : null),
  city: (value) => (!isNonEmpty(value) ? 'Ingresa tu ciudad' : null),
  address: (value) => (!isNonEmpty(value) ? 'Ingresa tu dirección de entrega' : null),
}

export function Register() {
  const { register } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [values, setValues] = useState(INITIAL_VALUES)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = location.state?.from ?? '/'

  const handleChange = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError(null)

    const { valid, errors: fieldErrors } = validateFields(values, RULES)
    if (values.password !== values.confirmPassword) {
      fieldErrors.confirmPassword = 'Las contraseñas no coinciden'
    }
    setErrors(fieldErrors)
    if (!valid || fieldErrors.confirmPassword) return

    setSubmitting(true)
    try {
      const user = await register(values)
      showToast(`Cuenta creada. ¡Bienvenido, ${user.name.split(' ')[0]}!`)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col px-4 py-16">
      <span className="text-xs uppercase tracking-widest-plus text-gold">Únete</span>
      <h1 className="mt-2 font-display text-3xl text-ivory">Crear cuenta</h1>
      <p className="mt-2 text-sm text-ivory-dim">
        Regístrate para poder finalizar tus pedidos por WhatsApp y hacer seguimiento a tus compras.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        {formError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {formError}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm text-ivory-dim">Nombre completo</label>
          <input
            type="text"
            value={values.name}
            onChange={handleChange('name')}
            className="w-full rounded-lg border border-ivory/10 bg-charcoal px-3 py-2 text-ivory focus:border-gold focus:outline-none"
          />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-ivory-dim">Email</label>
            <input
              type="email"
              value={values.email}
              onChange={handleChange('email')}
              className="w-full rounded-lg border border-ivory/10 bg-charcoal px-3 py-2 text-ivory focus:border-gold focus:outline-none"
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm text-ivory-dim">Teléfono</label>
            <input
              type="tel"
              value={values.phone}
              onChange={handleChange('phone')}
              className="w-full rounded-lg border border-ivory/10 bg-charcoal px-3 py-2 text-ivory focus:border-gold focus:outline-none"
            />
            {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-ivory-dim">Contraseña</label>
            <input
              type="password"
              value={values.password}
              onChange={handleChange('password')}
              className="w-full rounded-lg border border-ivory/10 bg-charcoal px-3 py-2 text-ivory focus:border-gold focus:outline-none"
            />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm text-ivory-dim">Confirmar contraseña</label>
            <input
              type="password"
              value={values.confirmPassword}
              onChange={handleChange('confirmPassword')}
              className="w-full rounded-lg border border-ivory/10 bg-charcoal px-3 py-2 text-ivory focus:border-gold focus:outline-none"
            />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-ivory-dim">Ciudad</label>
            <input
              type="text"
              value={values.city}
              onChange={handleChange('city')}
              placeholder="Ej. Bogotá"
              className="w-full rounded-lg border border-ivory/10 bg-charcoal px-3 py-2 text-ivory placeholder:text-ivory-dim/50 focus:border-gold focus:outline-none"
            />
            {errors.city && <p className="mt-1 text-xs text-red-400">{errors.city}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm text-ivory-dim">Dirección de entrega</label>
            <input
              type="text"
              value={values.address}
              onChange={handleChange('address')}
              className="w-full rounded-lg border border-ivory/10 bg-charcoal px-3 py-2 text-ivory focus:border-gold focus:outline-none"
            />
            {errors.address && <p className="mt-1 text-xs text-red-400">{errors.address}</p>}
          </div>
        </div>

        <Button type="submit" variant="primary" size="lg" disabled={submitting} fullWidth>
          {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ivory-dim">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" state={location.state} className="text-gold hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
