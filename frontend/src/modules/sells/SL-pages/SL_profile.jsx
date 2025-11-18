import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FaWallet, 
  FaBell, 
  FaSignOutAlt, 
  FaPhone, 
  FaEnvelope,
  FaUser,
  FaHeart,
  FaArrowRight,
  FaClipboardList,
  FaSpinner
} from 'react-icons/fa'
import SL_navbar from '../SL-components/SL_navbar'
import { logoutSales, clearSalesData, getStoredSalesData } from '../SL-services/salesAuthService'
import { useToast } from '../../../contexts/ToastContext'

const SL_profile = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [salesData, setSalesData] = useState(null)

  // Load sales data from stored authentication data
  useEffect(() => {
    const storedSalesData = getStoredSalesData()
    if (storedSalesData) {
      setSalesData(storedSalesData)
    }
  }, [])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logoutSales()
      clearSalesData()
      toast.logout('You have been successfully logged out', {
        title: 'Logged Out',
        duration: 2000
      })
      setTimeout(() => {
        navigate('/sales-login')
      }, 800)
    } catch (error) {
      console.error('Logout error:', error)
      clearSalesData()
      toast.error('Logout failed, but you have been logged out locally', {
        title: 'Logout Error',
        duration: 2000
      })
      setTimeout(() => {
        navigate('/sales-login')
      }, 1000)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <SL_navbar />
      
      {/* Mobile Layout */}
      <main className="max-w-md mx-auto px-4 pt-16 pb-20 lg:hidden">
        {/* Profile Header Section */}
        <div className="text-center mb-6">
          {/* Profile Picture */}
          <div className="mb-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center shadow-md border border-teal-300/50">
              <FaUser className="text-teal-600 text-2xl" />
            </div>
          </div>

          {/* User Information */}
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-1 tracking-tight">
              {salesData?.name || 'Sales User'}
            </h1>
            <p className="text-gray-600 text-sm font-medium">
              {salesData?.email || 'sales@example.com'}
            </p>
          </div>
        </div>

        {/* Contact Information Card */}
        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg flex items-center justify-center">
                <FaPhone className="text-teal-600 text-sm transform scale-x-[-1]" />
              </div>
              <span className="text-gray-600 font-medium text-sm">Phone</span>
            </div>
            <span className="text-gray-900 font-semibold text-sm">
              {salesData?.phone || '+1234567890'}
            </span>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="space-y-3 mb-6">
          {/* Wallet Card */}
          <Link to="/wallet">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200/50 cursor-pointer transition-all duration-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg flex items-center justify-center">
                    <FaWallet className="text-teal-600 text-base" />
                  </div>
                  <span className="text-gray-900 font-semibold text-base">Wallet</span>
                </div>
                <FaArrowRight className="text-gray-400 text-sm" />
              </div>
            </div>
          </Link>

          {/* Notifications Card */}
          <Link to="/notifications">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200/50 cursor-pointer transition-all duration-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg flex items-center justify-center">
                    <FaBell className="text-teal-600 text-base" />
                  </div>
                  <span className="text-gray-900 font-semibold text-base">Notifications</span>
                </div>
                <FaArrowRight className="text-gray-400 text-sm" />
              </div>
            </div>
          </Link>

          {/* Requests Card */}
          <Link to="/requests">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200/50 cursor-pointer transition-all duration-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg flex items-center justify-center">
                    <FaClipboardList className="text-teal-600 text-base" />
                  </div>
                  <span className="text-gray-900 font-semibold text-base">Requests</span>
                </div>
                <FaArrowRight className="text-gray-400 text-sm" />
              </div>
            </div>
          </Link>

          {/* Logout Card */}
          <div 
            onClick={handleLogout}
            className="bg-white rounded-xl p-4 shadow-sm border border-red-200/50 cursor-pointer transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center">
                  {isLoggingOut ? (
                    <FaSpinner className="text-red-600 text-base animate-spin" />
                  ) : (
                    <FaSignOutAlt className="text-red-600 text-base" />
                  )}
                </div>
                <span className="text-red-600 font-semibold text-base">
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </span>
              </div>
              {!isLoggingOut && <FaArrowRight className="text-red-400 text-sm" />}
            </div>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-teal-600 font-medium text-sm">Appzeto loves you</span>
            <FaHeart className="text-teal-400 text-sm" />
          </div>
        </div>
      </main>

      {/* Desktop Layout */}
      <main className="hidden lg:block max-w-4xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Profile Info */}
          <div className="col-span-4">
            {/* Profile Header */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200/50 mb-4">
              <div className="text-center">
                {/* Profile Picture */}
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center shadow-md border border-teal-300/50">
                    <FaUser className="text-teal-600 text-xl" />
                  </div>
                </div>

                {/* User Information */}
                <h1 className="text-lg font-bold text-gray-900 mb-1">
                  {salesData?.name || 'Sales User'}
                </h1>
                <p className="text-gray-600 text-sm">
                  {salesData?.email || 'sales@example.com'}
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200/50">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg flex items-center justify-center">
                  <FaPhone className="text-teal-600 text-sm transform scale-x-[-1]" />
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Phone</p>
                  <p className="text-gray-900 font-semibold text-sm">
                    {salesData?.phone || '+1234567890'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Navigation Cards */}
          <div className="col-span-8">
            <div className="grid grid-cols-2 gap-4">
              {/* Wallet Card */}
              <Link to="/wallet">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200/50 cursor-pointer transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg flex items-center justify-center">
                      <FaWallet className="text-teal-600 text-base" />
                    </div>
                    <span className="text-gray-900 font-semibold text-base">Wallet</span>
                  </div>
                  <p className="text-gray-600 text-xs">Manage your wallet and transactions</p>
                </div>
              </Link>

              {/* Notifications Card */}
              <Link to="/notifications">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200/50 cursor-pointer transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg flex items-center justify-center">
                      <FaBell className="text-teal-600 text-base" />
                    </div>
                    <span className="text-gray-900 font-semibold text-base">Notifications</span>
                  </div>
                  <p className="text-gray-600 text-xs">View and manage your notifications</p>
                </div>
              </Link>

              {/* Requests Card */}
              <Link to="/requests">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200/50 cursor-pointer transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg flex items-center justify-center">
                      <FaClipboardList className="text-teal-600 text-base" />
                    </div>
                    <span className="text-gray-900 font-semibold text-base">Requests</span>
                  </div>
                  <p className="text-gray-600 text-xs">View and manage your requests</p>
                </div>
              </Link>

              {/* Logout Card */}
              <div 
                onClick={handleLogout}
                className="bg-white rounded-xl p-4 shadow-sm border border-red-200/50 cursor-pointer transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center">
                    {isLoggingOut ? (
                      <FaSpinner className="text-red-600 text-base animate-spin" />
                    ) : (
                      <FaSignOutAlt className="text-red-600 text-base" />
                    )}
                  </div>
                  <span className="text-red-600 font-semibold text-base">
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </span>
                </div>
                <p className="text-gray-600 text-xs">Sign out of your account</p>
              </div>
            </div>

            {/* Footer Message */}
            <div className="text-center mt-6">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-teal-600 font-medium text-sm">Appzeto loves you</span>
                <FaHeart className="text-teal-400 text-sm" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SL_profile

