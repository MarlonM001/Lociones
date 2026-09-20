import { useState } from 'react'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { useLocation, useNavigate } from 'react-router-dom'
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
  useDocumentMeta({ title: 'Iniciar sesión', noindex: true })
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
      // Un admin que entra directo por /login (sin haber sido redirigido desde
      // una ruta puntual) va al panel de administración, no al inicio de la
      // tienda — es lo que quiere ver casi siempre que inicia sesión.
      const destination = user.role === 'admin' && !location.state?.from ? '/admin' : redirectTo
      navigate(destination, { replace: true })
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col justify-center px-4 py-12 sm:py-16">
      <div className="text-center">
        <span className="text-xs uppercase tracking-widest-plus text-gold">Mi cuenta</span>
        <h1 className="mt-2 font-display text-3xl text-ivory sm:text-4xl">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-ivory-dim">
          Accede para ver tu perfil y el seguimiento de tus pedidos.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 flex flex-col gap-4 rounded-2xl border border-ivory/10 bg-charcoal p-6 sm:p-8"
      >
        {formError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-danger">
            {formError}
          </div>
        )}

        <div>
          <label htmlFor="login-email" className="mb-1 block text-sm text-ivory-dim">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange('email')}
            className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2.5 text-ivory focus:border-gold focus:outline-none"
          />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="login-password" className="mb-1 block text-sm text-ivory-dim">Contraseña</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={handleChange('password')}
            className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2.5 text-ivory focus:border-gold focus:outline-none"
          />
          {errors.password && <p className="mt-1 text-xs text-danger">{errors.password}</p>}
        </div>

        <Button type="submit" variant="primary" size="lg" disabled={submitting} fullWidth>
          {submitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </Button>
      </form>

      <div className="mt-6 rounded-2xl border border-ivory/10 p-5 text-center">
        <p className="text-sm text-ivory">¿Primera vez en Essence Polar?</p>
        <p className="mt-1 text-xs text-ivory-dim">
          Crea tu cuenta para guardar tus datos de entrega y seguir tus pedidos.
        </p>
        <Button to="/registro" state={location.state} variant="secondary" size="sm" className="mt-4">
          Crear cuenta
        </Button>
      </div>
    </div>
  )
}
