import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { useToast } from './useToast'

/**
 * Devuelve una función `requireAuth(action)` que ejecuta `action` si hay
 * sesión iniciada, o redirige a /login (guardando la ruta actual) si no.
 * Centraliza el gating de compra usado en ProductCard y Product.
 */
export function useRequireAuth() {
  const { isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  return function requireAuth(action) {
    if (!isAuthenticated) {
      showToast('Inicia sesión para agregar productos y comprar', 'info')
      navigate('/login', { state: { from: location.pathname } })
      return false
    }
    action()
    return true
  }
}
