import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Activity,
  CreditCard,
  Settings,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock
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

const MA_logs = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')

  // Mock data - Replace with API calls
  const [logs] = useState([
    { id: 1, type: 'subscription', action: 'New subscription created', user: 'TechCorp Inc.', admin: 'Master Admin', time: '2024-02-01 10:30:00', status: 'success' },
    { id: 2, type: 'user', action: 'User registered', user: 'John Doe', admin: 'System', time: '2024-02-01 09:15:00', status: 'success' },
    { id: 3, type: 'payment', action: 'Payment received', user: 'StartupXYZ', admin: 'System', time: '2024-02-01 08:45:00', status: 'success' },
    { id: 4, type: 'module', action: 'Module configuration updated', user: 'PM Cloud', admin: 'Master Admin', time: '2024-01-31 16:20:00', status: 'info' },
    { id: 5, type: 'security', action: 'Failed login attempt', user: 'admin@cloudtech.com', admin: 'System', time: '2024-01-31 14:10:00', status: 'warning' },
    { id: 6, type: 'user', action: 'User deleted', user: 'David Brown', admin: 'Master Admin', time: '2024-01-31 12:00:00', status: 'error' },
    { id: 7, type: 'subscription', action: 'Subscription cancelled', user: 'SmallBiz Co.', admin: 'Master Admin', time: '2024-01-30 18:30:00', status: 'info' },
    { id: 8, type: 'payment', action: 'Payment failed', user: 'CloudTech', admin: 'System', time: '2024-01-30 15:45:00', status: 'error' }
  ])

  const getActivityIcon = (type) => {
    switch (type) {
      case 'subscription':
        return <CreditCard className="h-4 w-4" />
      case 'user':
        return <Users className="h-4 w-4" />
      case 'payment':
        return <Activity className="h-4 w-4" />
      case 'module':
        return <Settings className="h-4 w-4" />
      case 'security':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-700'
      case 'warning':
        return 'bg-yellow-100 text-yellow-700'
      case 'error':
        return 'bg-red-100 text-red-700'
      case 'info':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.admin.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === 'all' || log.type === filterType
    return matchesSearch && matchesFilter
  })

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
                  Activity <span className="text-teal-600">Logs</span>
                </h1>
                <p className="mt-2 text-base text-slate-600">
                  View all platform activities and system events
                </p>
              </div>
              <Button variant="outline" className="border-teal-200">
                <Download className="mr-2 h-4 w-4" />
                Export Logs
              </Button>
            </div>
          </motion.div>

          {/* Filters and Search */}
          <motion.div
            initial="hidden"
            animate="show"
            custom={0.2}
            variants={fadeUp}
            className="mb-6">
            <Card className="border-teal-100 bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search by action, user, or admin..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="rounded-md border border-teal-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                      <option value="all">All Types</option>
                      <option value="subscription">Subscription</option>
                      <option value="user">User</option>
                      <option value="payment">Payment</option>
                      <option value="module">Module</option>
                      <option value="security">Security</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Logs Table */}
          <motion.div
            initial="hidden"
            animate="show"
            custom={0.3}
            variants={fadeUp}>
            <Card className="border-teal-100 bg-white shadow-sm">
              <CardHeader className="border-b border-teal-100 pb-4">
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Activity Logs ({filteredLogs.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {filteredLogs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial="hidden"
                      animate="show"
                      custom={0.4 + index * 0.05}
                      variants={fadeUp}
                      className="flex items-start gap-4 rounded-lg border border-teal-50 bg-white p-4 transition-all duration-300 hover:border-teal-200 hover:shadow-sm">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                        {getActivityIcon(log.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{log.action}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{log.user}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>By: {log.admin}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{log.time}</span>
                              </div>
                            </div>
                          </div>
                          <span className={`ml-4 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(log.status)}`}>
                            {log.status}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default MA_logs

