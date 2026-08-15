import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Loading } from '@/components/ui/Loading'

/**
 * Envuelve rutas que exigen sesión iniciada (ej. carrito/checkout).
 * Guarda la ruta de origen en location.state.from para volver ahí tras el login.
 */
export function RequireAuth({ children }) {
  const { isAuthenticated, initializing } = useAuth()
  const location = useLocation()

  if (initializing) {
    return <Loading fullScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return children
}
