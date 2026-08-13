import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { isNonEmpty, isValidEmail, validateFields } from '@/utils/validation'
import { Button } from '@/components/ui/Button'

const INITIAL_VALUES = { email: '', password: '' }

const RULES = {
  email: (value) => (!isValidEmail(value) ? 'Ingresa un email válido' : null),
  password: (value) => (!isNonEmpty(value) ? 'Ingresa tu contraseña' : null),
}

export function Login() {
  const { login } = useAuth()
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
    setErrors(fieldErrors)
    if (!valid) return

    setSubmitting(true)
    try {
      const user = await login(values)
      showToast(`Bienvenido de nuevo, ${user.name.split(' ')[0]}`)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col justify-center px-4 py-16">
      <span className="text-xs uppercase tracking-widest-plus text-gold">Bienvenido de nuevo</span>
      <h1 className="mt-2 font-display text-3xl text-ivory">Iniciar sesión</h1>
      <p className="mt-2 text-sm text-ivory-dim">
        Necesitas una cuenta para finalizar tu compra por WhatsApp.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        {formError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {formError}
          </div>
        )}

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
          <label className="mb-1 block text-sm text-ivory-dim">Contraseña</label>
          <input
            type="password"
            value={values.password}
            onChange={handleChange('password')}
            className="w-full rounded-lg border border-ivory/10 bg-charcoal px-3 py-2 text-ivory focus:border-gold focus:outline-none"
          />
          {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
        </div>

        <Button type="submit" variant="primary" size="lg" disabled={submitting} fullWidth>
          {submitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ivory-dim">
        ¿Aún no tienes cuenta?{' '}
        <Link to="/registro" state={location.state} className="text-gold hover:underline">
          Regístrate aquí
        </Link>
      </p>
    </div>
  )
}
