import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  MoreVertical,
  Building2,
  Users,
  CreditCard,
  Calendar,
  Mail,
  Phone,
  Globe,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import MA_dashboard_navbar from '../MA-components/MA_dashboard_navbar'
import MA_dashboard_sidebar from '../MA-components/MA_dashboard_sidebar'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', delay }
  })
}

const MA_companies = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  // Mock data - Replace with API calls
  const [companies] = useState([
    { id: 1, name: 'TechCorp Inc.', email: 'admin@techcorp.com', phone: '+91 9876543210', users: 20, plan: 'Professional', status: 'active', revenue: 35988, growth: 12.5, joinedDate: '2023-08-15' },
    { id: 2, name: 'Enterprise Ltd.', email: 'info@enterprise.com', phone: '+91 9876543211', users: 50, plan: 'Premium', status: 'active', revenue: 249950, growth: 8.3, joinedDate: '2023-06-01' },
    { id: 3, name: 'StartupXYZ', email: 'contact@startupxyz.com', phone: '+91 9876543212', users: 5, plan: 'Starter', status: 'active', revenue: 9995, growth: 15.2, joinedDate: '2023-12-01' },
    { id: 4, name: 'Digital Solutions', email: 'support@digitalsolutions.com', phone: '+91 9876543213', users: 15, plan: 'Professional', status: 'active', revenue: 19992, growth: -2.1, joinedDate: '2023-09-15' },
    { id: 5, name: 'CloudTech', email: 'admin@cloudtech.com', phone: '+91 9876543214', users: 30, plan: 'Premium', status: 'suspended', revenue: 0, growth: 0, joinedDate: '2023-05-10' },
    { id: 6, name: 'SmallBiz Co.', email: 'hello@smallbiz.com', phone: '+91 9876543215', users: 3, plan: 'Starter', status: 'trial', revenue: 0, growth: 0, joinedDate: '2024-01-20' }
  ])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'trial':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'suspended':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: companies.length,
    active: companies.filter(c => c.status === 'active').length,
    totalUsers: companies.reduce((sum, c) => sum + c.users, 0),
    totalRevenue: companies.filter(c => c.status === 'active').reduce((sum, c) => sum + c.revenue, 0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-white font-sans">
      <MA_dashboard_navbar />
      <MA_dashboard_sidebar />

      <main className="ml-64 pt-16 min-h-screen transition-all duration-300">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                  Companies <span className="text-teal-600">Management</span>
                </h1>
                <p className="mt-2 text-base text-slate-600">
                  Manage all companies and their subscriptions
                </p>
              </div>
              <Button
                onClick={() => navigate('/master-admin-companies/new')}
                className="bg-teal-500 text-white hover:bg-teal-600">
                <Plus className="mr-2 h-4 w-4" />
                Add Company
              </Button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Total Companies', value: stats.total, icon: Building2, color: 'from-blue-500 to-blue-600' },
              { title: 'Active Companies', value: stats.active, icon: CheckCircle2, color: 'from-green-500 to-green-600' },
              { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-purple-500 to-purple-600' },
              { title: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: CreditCard, color: 'from-teal-500 to-teal-600' }
            ].map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.title}
                  initial="hidden"
                  animate="show"
                  custom={index * 0.1}
                  variants={fadeUp}>
                  <Card className="border-teal-100 bg-white shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                          <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
                        </div>
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* Search */}
          <motion.div
            initial="hidden"
            animate="show"
            custom={0.4}
            variants={fadeUp}
            className="mb-6">
            <Card className="border-teal-100 bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search by company name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Companies Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCompanies.map((company, index) => (
              <motion.div
                key={company.id}
                initial="hidden"
                animate="show"
                custom={0.5 + index * 0.1}
                variants={fadeUp}>
                <Card className="border-teal-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-teal-100/50">
                  <CardHeader className="border-b border-teal-100 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white text-lg font-bold shadow-md">
                          {company.name.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-slate-900">{company.name}</CardTitle>
                          <span className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusColor(company.status)}`}>
                            {company.status}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="h-4 w-4" />
                        <span>{company.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="h-4 w-4" />
                        <span>{company.phone}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-teal-50">
                        <div>
                          <p className="text-xs text-slate-500">Users</p>
                          <p className="text-lg font-semibold text-slate-900">{company.users}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Plan</p>
                          <p className="text-lg font-semibold text-slate-900">{company.plan}</p>
                        </div>
                      </div>
                      {company.revenue > 0 && (
                        <div className="pt-3 border-t border-teal-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-slate-500">Revenue</p>
                              <p className="text-lg font-semibold text-slate-900">{formatCurrency(company.revenue)}</p>
                            </div>
                            <div className={`flex items-center gap-1 text-sm ${company.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {company.growth > 0 ? (
                                <ArrowUpRight className="h-4 w-4" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4" />
                              )}
                              <span>{Math.abs(company.growth)}%</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-3">
                        <Button variant="outline" size="sm" className="flex-1 border-teal-200">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 border-teal-200">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default MA_companies

