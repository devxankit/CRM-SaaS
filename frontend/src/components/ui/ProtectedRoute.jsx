import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { isAdminAuthenticated } from '../../modules/admin/admin-services/adminAuthService'

const ProtectedRoute = ({ children, requiredRole = 'admin' }) => {
  const location = useLocation()
  
  // Check if user is authenticated
  const isAuthenticated = isAdminAuthenticated()
  
  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/admin-login" state={{ from: location }} replace />
  }
  
  // If authenticated, render the protected component
  return children
}

export default ProtectedRoute
