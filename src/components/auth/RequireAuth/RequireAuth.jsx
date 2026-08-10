import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

/**
 * Envuelve rutas que exigen sesión iniciada (ej. carrito/checkout).
 * Guarda la ruta de origen en location.state.from para volver ahí tras el login.
 */
export function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return children
}
