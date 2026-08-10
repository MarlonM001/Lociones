import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

/**
 * Protege las rutas /admin/*. Sin sesión -> /login. Con sesión pero sin rol
 * admin -> /, para no confirmar ni exponer la existencia del panel.
 */
export function RequireAdmin({ children }) {
  const { isAuthenticated, isAdmin } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}
