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
  CheckCircle2,
  XCircle,
  CreditCard,
  Building2,
  Users,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign
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

const MA_subscriptions = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // Mock data - Replace with API calls
  const [subscriptions] = useState([
    { id: 1, company: 'TechCorp Inc.', plan: 'Professional', status: 'active', users: 20, amount: 2999, nextBilling: '2024-02-15', startDate: '2023-08-15', email: 'admin@techcorp.com' },
    { id: 2, company: 'StartupXYZ', plan: 'Starter', status: 'active', users: 5, amount: 1999, nextBilling: '2024-02-10', startDate: '2023-12-01', email: 'contact@startupxyz.com' },
    { id: 3, company: 'Enterprise Ltd.', plan: 'Premium', status: 'active', users: 50, amount: 4999, nextBilling: '2024-02-20', startDate: '2023-06-01', email: 'info@enterprise.com' },
    { id: 4, company: 'Digital Solutions', plan: 'Professional', status: 'active', users: 15, amount: 2999, nextBilling: '2024-02-18', startDate: '2023-09-15', email: 'support@digitalsolutions.com' },
    { id: 5, company: 'CloudTech', plan: 'Premium', status: 'suspended', users: 30, amount: 4999, nextBilling: '2024-02-25', startDate: '2023-05-10', email: 'admin@cloudtech.com' }
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
      case 'suspended':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sub.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' || sub.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    suspended: subscriptions.filter(s => s.status === 'suspended').length,
    revenue: subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + s.amount, 0)
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
                  Subscriptions <span className="text-teal-600">Management</span>
                </h1>
                <p className="mt-2 text-base text-slate-600">
                  Manage all platform subscriptions and billing
                </p>
              </div>
              <Button
                onClick={() => navigate('/master-admin-subscriptions/new')}
                className="bg-teal-500 text-white hover:bg-teal-600">
                <Plus className="mr-2 h-4 w-4" />
                New Subscription
              </Button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Total Subscriptions', value: stats.total, icon: CreditCard, color: 'from-blue-500 to-blue-600' },
              { title: 'Active', value: stats.active, icon: CheckCircle2, color: 'from-green-500 to-green-600' },
              { title: 'Suspended', value: stats.suspended, icon: XCircle, color: 'from-red-500 to-red-600' },
              { title: 'Monthly Revenue', value: formatCurrency(stats.revenue), icon: DollarSign, color: 'from-teal-500 to-teal-600' }
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

          {/* Filters and Search */}
          <motion.div
            initial="hidden"
            animate="show"
            custom={0.4}
            variants={fadeUp}
            className="mb-6">
            <Card className="border-teal-100 bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search by company or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="rounded-md border border-teal-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Subscriptions Table */}
          <motion.div
            initial="hidden"
            animate="show"
            custom={0.5}
            variants={fadeUp}>
            <Card className="border-teal-100 bg-white shadow-sm">
              <CardHeader className="border-b border-teal-100 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-slate-900">
                    All Subscriptions ({filteredSubscriptions.length})
                  </CardTitle>
                  <Button variant="outline" size="sm" className="border-teal-200">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-teal-100">
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Company</th>
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Plan</th>
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Users</th>
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Amount</th>
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Next Billing</th>
                        <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-teal-50">
                      {filteredSubscriptions.map((subscription) => (
                        <tr key={subscription.id} className="transition-colors duration-200 hover:bg-teal-50/50">
                          <td className="py-4">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{subscription.company}</p>
                              <p className="text-xs text-slate-500">{subscription.email}</p>
                            </div>
                          </td>
                          <td className="py-4 text-sm text-slate-600">{subscription.plan}</td>
                          <td className="py-4">
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(subscription.status)}`}>
                              {subscription.status}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-slate-600">{subscription.users}</td>
                          <td className="py-4 text-sm font-semibold text-slate-900">
                            {formatCurrency(subscription.amount)}
                          </td>
                          <td className="py-4 text-sm text-slate-600">{subscription.nextBilling}</td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default MA_subscriptions

