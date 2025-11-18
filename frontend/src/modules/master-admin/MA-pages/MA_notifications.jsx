import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Mail,
  Calendar,
  Trash2,
  CheckCheck,
  Settings
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

const MA_notifications = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')

  // Mock data - Replace with API calls
  const [notifications] = useState([
    { id: 1, type: 'success', title: 'Payment Received', message: 'Payment of ₹2,999 received from TechCorp Inc.', time: '2 mins ago', read: false },
    { id: 2, type: 'warning', title: 'Subscription Expiring', message: 'StartupXYZ subscription expires in 3 days', time: '15 mins ago', read: false },
    { id: 3, type: 'info', title: 'New User Registered', message: 'John Doe registered as Admin for Digital Solutions', time: '1 hour ago', read: true },
    { id: 4, type: 'error', title: 'Payment Failed', message: 'Payment failed for CloudTech - Amount: ₹4,999', time: '2 hours ago', read: false },
    { id: 5, type: 'success', title: 'Module Updated', message: 'PM Cloud module has been successfully updated', time: '3 hours ago', read: true },
    { id: 6, type: 'warning', title: 'High System Load', message: 'Server CPU usage is above 80%', time: '5 hours ago', read: true }
  ])

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />
      default:
        return <Bell className="h-5 w-5 text-slate-600" />
    }
  }

  const getNotificationBg = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-white border-teal-100'
    }
  }

  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notif.message.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === 'all' || notif.type === filterType
    return matchesSearch && matchesFilter
  })

  const unreadCount = notifications.filter(n => !n.read).length

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
                  Notifications <span className="text-teal-600">Center</span>
                </h1>
                <p className="mt-2 text-base text-slate-600">
                  Manage and view all platform notifications
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="border-teal-200">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
                <Button className="bg-teal-500 text-white hover:bg-teal-600">
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Mark All Read
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial="hidden"
            animate="show"
            custom={0.2}
            variants={fadeUp}
            className="mb-8">
            <Card className="border-teal-100 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Unread Notifications</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{unreadCount}</p>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg">
                    <Bell className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Filters and Search */}
          <motion.div
            initial="hidden"
            animate="show"
            custom={0.3}
            variants={fadeUp}
            className="mb-6">
            <Card className="border-teal-100 bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search notifications..."
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
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                      <option value="info">Info</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications List */}
          <motion.div
            initial="hidden"
            animate="show"
            custom={0.4}
            variants={fadeUp}>
            <Card className="border-teal-100 bg-white shadow-sm">
              <CardHeader className="border-b border-teal-100 pb-4">
                <CardTitle className="text-xl font-semibold text-slate-900">
                  All Notifications ({filteredNotifications.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {filteredNotifications.map((notif, index) => (
                    <motion.div
                      key={notif.id}
                      initial="hidden"
                      animate="show"
                      custom={0.5 + index * 0.05}
                      variants={fadeUp}
                      className={`rounded-lg border p-4 transition-all duration-300 hover:shadow-sm ${
                        notif.read ? getNotificationBg(notif.type) : `${getNotificationBg(notif.type)} border-2`
                      }`}>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-sm font-semibold text-slate-900">{notif.title}</h3>
                              <p className="mt-1 text-sm text-slate-600">{notif.message}</p>
                              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                <Calendar className="h-3 w-3" />
                                <span>{notif.time}</span>
                              </div>
                            </div>
                            {!notif.read && (
                              <div className="h-2 w-2 rounded-full bg-teal-500 flex-shrink-0 mt-1" />
                            )}
                          </div>
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

export default MA_notifications

