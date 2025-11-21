import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { masterAdminAuthService } from '../../modules/master-admin/MA-services'

const MasterAdminProtectedRoute = ({ children }) => {
  const location = useLocation()
  
  // Check if user is authenticated
  const isAuthenticated = masterAdminAuthService.isAuthenticated()
  
  if (!isAuthenticated) {
    // Redirect to master admin login page with return url
    return <Navigate to="/master-admin-login" state={{ from: location }} replace />
  }
  
  // If authenticated, render the protected component
  return children
}

export default MasterAdminProtectedRoute


