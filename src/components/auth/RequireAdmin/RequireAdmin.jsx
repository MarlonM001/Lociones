import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Loading } from '@/components/ui/Loading'

/**
 * Protege las rutas /admin/*. Sin sesión -> /login. Con sesión pero sin rol
 * admin -> /, para no confirmar ni exponer la existencia del panel.
 */
export function RequireAdmin({ children }) {
  const { isAuthenticated, isAdmin, initializing } = useAuth()
  const location = useLocation()

  if (initializing) {
    return <Loading fullScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}
