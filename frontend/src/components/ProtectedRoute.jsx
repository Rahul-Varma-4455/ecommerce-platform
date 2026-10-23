import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem('access_token')
  const userData = localStorage.getItem('user')

  if (!token || !userData) {
    return <Navigate to="/login" replace />
  }

  const user = JSON.parse(userData)

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute