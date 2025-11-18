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
  Users,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Building2,
  Calendar,
  Download,
  Shield,
  CheckCircle2,
  XCircle
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

const MA_users = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')

  // Mock data - Replace with API calls
  const [users] = useState([
    { id: 1, name: 'John Doe', email: 'john@techcorp.com', role: 'Admin', company: 'TechCorp Inc.', status: 'active', lastActive: '2024-02-01', phone: '+91 9876543210' },
    { id: 2, name: 'Jane Smith', email: 'jane@startupxyz.com', role: 'Sales', company: 'StartupXYZ', status: 'active', lastActive: '2024-02-02', phone: '+91 9876543211' },
    { id: 3, name: 'Mike Johnson', email: 'mike@enterprise.com', role: 'PM', company: 'Enterprise Ltd.', status: 'active', lastActive: '2024-01-30', phone: '+91 9876543212' },
    { id: 4, name: 'Sarah Williams', email: 'sarah@digitalsolutions.com', role: 'Employee', company: 'Digital Solutions', status: 'active', lastActive: '2024-02-01', phone: '+91 9876543213' },
    { id: 5, name: 'David Brown', email: 'david@cloudtech.com', role: 'Client', company: 'CloudTech', status: 'inactive', lastActive: '2024-01-15', phone: '+91 9876543214' },
    { id: 6, name: 'Emily Davis', email: 'emily@smallbiz.com', role: 'Admin', company: 'SmallBiz Co.', status: 'active', lastActive: '2024-02-02', phone: '+91 9876543215' }
  ])

  const getStatusColor = (status) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-700'
      case 'Sales':
        return 'bg-blue-100 text-blue-700'
      case 'PM':
        return 'bg-indigo-100 text-indigo-700'
      case 'Employee':
        return 'bg-emerald-100 text-emerald-700'
      case 'Client':
        return 'bg-cyan-100 text-cyan-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.company.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterRole === 'all' || user.role === filterRole
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    admins: users.filter(u => u.role === 'Admin').length
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
                  User <span className="text-teal-600">Management</span>
                </h1>
                <p className="mt-2 text-base text-slate-600">
                  Manage all platform users and their permissions
                </p>
              </div>
              <Button
                onClick={() => navigate('/master-admin-users/new')}
                className="bg-teal-500 text-white hover:bg-teal-600">
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Total Users', value: stats.total, icon: Users, color: 'from-blue-500 to-blue-600' },
              { title: 'Active Users', value: stats.active, icon: UserCheck, color: 'from-green-500 to-green-600' },
              { title: 'Inactive Users', value: stats.inactive, icon: UserX, color: 'from-gray-500 to-gray-600' },
              { title: 'Admins', value: stats.admins, icon: Shield, color: 'from-purple-500 to-purple-600' }
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
                      placeholder="Search by name, email, or company..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="rounded-md border border-teal-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                      <option value="all">All Roles</option>
                      <option value="Admin">Admin</option>
                      <option value="Sales">Sales</option>
                      <option value="PM">PM</option>
                      <option value="Employee">Employee</option>
                      <option value="Client">Client</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Users Table */}
          <motion.div
            initial="hidden"
            animate="show"
            custom={0.5}
            variants={fadeUp}>
            <Card className="border-teal-100 bg-white shadow-sm">
              <CardHeader className="border-b border-teal-100 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-slate-900">
                    All Users ({filteredUsers.length})
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
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">User</th>
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Role</th>
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Company</th>
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Last Active</th>
                        <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-teal-50">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="transition-colors duration-200 hover:bg-teal-50/50">
                          <td className="py-4">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{user.name}</p>
                              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                <Mail className="h-3 w-3" />
                                <span>{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleColor(user.role)}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-slate-600">{user.company}</td>
                          <td className="py-4">
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(user.status)}`}>
                              {user.status === 'active' ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                              {user.status}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-slate-600">{user.lastActive}</td>
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

export default MA_users

