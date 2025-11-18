import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LogOut,
  User,
  Bell,
  Search,
  Menu,
  X,
  Sparkles,
  Settings,
  HelpCircle
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { AuroraText } from '../../../components/ui/aurora-text'

const MA_dashboard_navbar = () => {
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Mock user data - Replace with actual auth data
  const userData = {
    name: 'Master Admin',
    email: 'admin@crmplatform.com',
    role: 'MASTER_ADMIN'
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      // Add logout logic here
      setTimeout(() => {
        navigate('/master-admin')
        setIsLoggingOut(false)
      }, 1000)
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  const handleProfile = () => {
    setShowProfileMenu(!showProfileMenu)
  }

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm border-b border-teal-100 z-50">
      <div className="mx-auto w-full max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left Section - Logo */}
          <div className="flex items-center gap-4">
            <Link to="/master-admin" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-md shadow-teal-200/50">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:flex flex-col leading-tight">
                <AuroraText className="text-lg font-semibold text-slate-900">SaaS CRM</AuroraText>
                <span className="text-xs text-slate-500">Master Admin</span>
              </div>
            </Link>
          </div>

          {/* Center Section - Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search users, companies, subscriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 border-teal-200 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative h-9 w-9 p-0 hover:bg-teal-50 text-slate-600 hover:text-teal-600">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
            </Button>

            {/* Help */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex h-9 w-9 p-0 hover:bg-teal-50 text-slate-600 hover:text-teal-600">
              <HelpCircle className="h-5 w-5" />
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex h-9 w-9 p-0 hover:bg-teal-50 text-slate-600 hover:text-teal-600">
              <Settings className="h-5 w-5" />
            </Button>

            {/* User Profile */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleProfile}
                className="flex items-center gap-2 h-9 px-3 hover:bg-teal-50">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-white text-xs font-semibold">
                  {userData.name.charAt(0)}
                </div>
                <div className="hidden md:flex flex-col items-start text-left">
                  <span className="text-sm font-medium text-slate-900">{userData.name}</span>
                  <span className="text-xs text-slate-500">{userData.role}</span>
                </div>
              </Button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-teal-100 bg-white shadow-xl z-50">
                  <div className="p-4 border-b border-teal-100">
                    <p className="text-sm font-semibold text-slate-900">{userData.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{userData.email}</p>
                  </div>
                  <div className="p-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-slate-600 hover:text-teal-600 hover:bg-teal-50">
                      <User className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-slate-600 hover:text-teal-600 hover:bg-teal-50">
                      <Settings className="mr-2 h-4 w-4" />
                      Preferences
                    </Button>
                  </div>
                  <div className="p-2 border-t border-teal-100">
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                      {isLoggingOut ? (
                        <>
                          <div className="mr-2 h-4 w-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                          Logging out...
                        </>
                      ) : (
                        <>
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-4 top-full mt-2 w-80 rounded-xl border border-teal-100 bg-white shadow-xl z-50">
          <div className="p-4 border-b border-teal-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-teal-600">
                Mark all read
              </Button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            <div className="text-center py-8 text-sm text-slate-500">
              No new notifications
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}

export default MA_dashboard_navbar

