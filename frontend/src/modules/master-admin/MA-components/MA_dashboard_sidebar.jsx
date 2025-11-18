import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Target,
  Workflow,
  Cloud,
  Smartphone,
  Building2,
  FileText,
  Globe,
  Zap,
  Crown,
  DollarSign,
  Activity,
  PieChart
} from 'lucide-react'
import { Button } from '../../../components/ui/button'

const MA_dashboard_sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/master-admin-dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'subscriptions',
      label: 'Subscriptions',
      path: '/master-admin-subscriptions',
      icon: CreditCard
    },
    {
      id: 'users',
      label: 'User Management',
      path: '/master-admin-users',
      icon: Users
    },
    {
      id: 'analytics',
      label: 'Analytics & Reports',
      path: '/master-admin-analytics',
      icon: BarChart3
    },
    {
      id: 'billing',
      label: 'Billing & Payments',
      path: '/master-admin-billing',
      icon: DollarSign
    },
    {
      id: 'companies',
      label: 'Companies',
      path: '/master-admin-companies',
      icon: Building2
    },
    {
      id: 'logs',
      label: 'Activity Logs',
      path: '/master-admin-logs',
      icon: FileText
    }
  ]

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <div className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-white shadow-lg border-r border-teal-100 z-40 overflow-y-auto">
      <div className="flex flex-col h-full">
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 pt-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start gap-3 px-4 ${
                  active 
                    ? 'bg-teal-50 text-teal-600 border-l-4 border-teal-500 hover:bg-teal-100' 
                    : 'text-slate-600 hover:bg-teal-50 hover:text-teal-600'
                }`}
                onClick={() => navigate(item.path)}
              >
                <Icon className={`h-5 w-5 ${
                  active ? 'text-teal-600' : 'text-slate-500'
                }`} />
                <span className={`font-medium ${active ? 'text-teal-600' : 'text-slate-700'}`}>
                  {item.label}
                </span>
              </Button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export default MA_dashboard_sidebar

