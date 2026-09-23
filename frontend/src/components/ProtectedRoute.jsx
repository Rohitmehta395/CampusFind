import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Route guard component that restricts access to authenticated users.
 * Redirects unauthenticated requests to /login, preserving target location.
 */
export default function ProtectedRoute({ children }) {
  const { user, token } = useAuth()
  const location = useLocation()

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children ? children : <Outlet />
}
