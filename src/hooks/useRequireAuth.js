import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { useToast } from './useToast'

/**
 * Devuelve una función `requireAuth(action)` que ejecuta `action` si hay
 * sesión iniciada, o redirige a /login (guardando la ruta actual) si no.
 * Comprar NO pasa por aquí (el carrito y el checkout son libres, sin cuenta);
 * esto sigue usándose para pujar en subastas y subir referencias de entrega,
 * que sí necesitan quedar ligadas a un usuario.
 */
export function useRequireAuth() {
  const { isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  return function requireAuth(action) {
    if (!isAuthenticated) {
      showToast('Inicia sesión para continuar', 'info')
      navigate('/login', { state: { from: location.pathname } })
      return false
    }
    action()
    return true
  }
}
