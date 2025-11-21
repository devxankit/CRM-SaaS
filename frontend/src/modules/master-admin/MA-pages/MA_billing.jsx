import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Filter,
  Download,
  DollarSign,
  CreditCard,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Receipt
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { masterAdminBillingService } from '../MA-services'
import { useToast } from '../../../contexts/ToastContext'
import { RefreshCw } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', delay }
  })
}

const MA_billing = () => {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingAmount: 0,
    paidCount: 0,
    pendingCount: 0
  })

  // Load payments data
  const loadPayments = async () => {
    setLoading(true)
    try {
      const [paymentsRes, statsRes] = await Promise.all([
        masterAdminBillingService.getAllPayments({ 
          search: searchQuery,
          status: filterStatus === 'all' ? undefined : filterStatus
        }),
        masterAdminBillingService.getPaymentStatistics()
      ])

      if (paymentsRes.success && paymentsRes.data.payments) {
        setPayments(paymentsRes.data.payments)
      }

      if (statsRes.success && statsRes.data) {
        setStats({
          totalRevenue: statsRes.data.totalRevenue || 0,
          pendingAmount: statsRes.data.pendingAmount || 0,
          paidCount: statsRes.data.paidCount || 0,
          pendingCount: statsRes.data.paidCount || 0 // Use paidCount as placeholder, will be calculated
        })
      }
    } catch (error) {
      console.error('Error loading payments:', error)
      toast.error('Failed to load payments', {
        title: 'Error',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [filterStatus])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        loadPayments()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'trial':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payment.invoice.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                Billing & <span className="text-teal-600">Payments</span>
              </h1>
              <p className="mt-2 text-base text-slate-600">
                Track all payments, invoices, and billing information
              </p>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'from-teal-500 to-teal-600' },
              { title: 'Pending Amount', value: formatCurrency(stats.pendingAmount), icon: Clock, color: 'from-yellow-500 to-yellow-600' },
              { title: 'Paid Invoices', value: stats.paidCount, icon: CheckCircle2, color: 'from-green-500 to-green-600' },
              { title: 'Pending Invoices', value: stats.pendingCount, icon: XCircle, color: 'from-orange-500 to-orange-600' }
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
                      placeholder="Search by company or invoice..."
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
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                      <option value="trial">Trial</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payments Table */}
          <motion.div
            initial="hidden"
            animate="show"
            custom={0.5}
            variants={fadeUp}>
            <Card className="border-teal-100 bg-white shadow-sm">
              <CardHeader className="border-b border-teal-100 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-slate-900">
                    Payment History ({filteredPayments.length})
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={loadPayments}
                      disabled={loading}
                      className="border-teal-200">
                      <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button variant="outline" size="sm" className="border-teal-200">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-teal-100">
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Invoice</th>
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Company</th>
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Plan</th>
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Amount</th>
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Payment Method</th>
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Date</th>
                        <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-teal-50">
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="py-12 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <RefreshCw className="h-5 w-5 animate-spin text-teal-600" />
                              <span className="text-slate-600">Loading payments...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-12 text-center">
                            <Receipt className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                            <p className="text-lg font-medium text-slate-700">No payments found</p>
                            <p className="text-sm text-slate-500 mt-2">Try adjusting your filters or search</p>
                          </td>
                        </tr>
                      ) : (
                        filteredPayments.map((payment) => (
                        <tr key={payment.id} className="transition-colors duration-200 hover:bg-teal-50/50">
                          <td className="py-4 text-sm font-medium text-slate-900">{payment.invoice}</td>
                          <td className="py-4 text-sm text-slate-600">{payment.company}</td>
                          <td className="py-4 text-sm text-slate-600">{payment.plan}</td>
                          <td className="py-4 text-sm font-semibold text-slate-900">
                            {payment.amount > 0 ? formatCurrency(payment.amount) : 'Free Trial'}
                          </td>
                          <td className="py-4">
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(payment.status)}`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-slate-600">{payment.method}</td>
                          <td className="py-4 text-sm text-slate-600">{payment.date}</td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Receipt className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
  )
}

export default MA_billing

