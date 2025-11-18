import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Code, 
  IndianRupee, 
  Trophy, 
  Gift, 
  TrendingUp,
  MessageSquare,
  Users,
  UserCheck,
  FileText
} from 'lucide-react'
import { Button } from '../../../components/ui/button'

const Admin_sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/admin-dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'project-management',
      label: 'Project Management',
      path: '/admin-project-management',
      icon: Code
    },
    {
      id: 'user-management',
      label: 'User Management',
      path: '/admin-user-management',
      icon: Users
    },
    {
      id: 'hr-management',
      label: 'HR Management',
      path: '/admin-hr-management',
      icon: UserCheck
    },
    {
      id: 'sales-management',
      label: 'Sales Management',
      path: '/admin-sales-management',
      icon: TrendingUp
    },
    {
      id: 'finance-management',
      label: 'Finance Management',
      path: '/admin-finance-management',
      icon: IndianRupee
    },
    {
      id: 'reward-management',
      label: 'Reward Management',
      path: '/admin-reward-management',
      icon: Gift
    },
    {
      id: 'requests-management',
      label: 'Requests Management',
      path: '/admin-requests-management',
      icon: MessageSquare
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      path: '/admin-leaderboard',
      icon: Trophy
    },
    {
      id: 'notice-board',
      label: 'Notice Board',
      path: '/admin-notice-board',
      icon: FileText
    }
  ]

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <div className="fixed left-0 top-16 w-64 bg-white shadow-sm border-r border-gray-200 h-screen z-40">
      <div className="p-6 h-full flex flex-col">

        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            
            return (
              <Button
                key={item.id}
                variant={active ? "default" : "ghost"}
                className={`w-full justify-start space-x-3 transition-all duration-300 ease-in-out ${
                  active 
                    ? 'bg-teal-50/80 text-teal-600 border-teal-100 shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-50/60 hover:text-gray-600'
                }`}
                onClick={() => navigate(item.path)}
              >
                <Icon className={`h-5 w-5 transition-colors duration-300 ease-in-out ${active ? 'text-teal-500' : 'text-gray-400 hover:text-gray-500'}`} />
                <span className={`font-medium transition-colors duration-300 ease-in-out ${active ? 'text-teal-600' : 'text-gray-500'}`}>{item.label}</span>
              </Button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export default Admin_sidebar
