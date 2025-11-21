import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Settings,
  Shield,
  Database,
  Server,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Workflow,
  Cloud,
  Monitor,
  Smartphone,
  Download,
  Bell,
  Search,
  Filter,
  MoreVertical,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Zap,
  Crown,
  Sparkles,
  RefreshCw,
  FileText,
  CreditCard,
  IndianRupee,
  Building2,
  UserCheck,
  UserX,
  Globe,
  Lock,
  Unlock,
  Power,
  PowerOff,
  ArrowRight,
  TrendingDown
} from 'lucide-react'

import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { AuroraText } from '../../../components/ui/aurora-text'
import { masterAdminAnalyticsService, masterAdminSubscriptionService, masterAdminCompanyService, masterAdminLogService } from '../MA-services'
import { useToast } from '../../../contexts/ToastContext'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', delay }
  })
}

const MA_dashboard = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [timeRange, setTimeRange] = useState('7d')

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalUsers: 0,
      activeSubscriptions: 0,
      totalRevenue: 0,
      monthlyGrowth: 0,
      activeModules: 5,
      systemHealth: 0,
      totalCompanies: 0,
      monthlyRevenue: 0,
      churnRate: 0
    },
    modules: [],
    revenueTrend: [],
    moduleDistribution: [],
    recentActivity: [],
    subscriptions: [],
    topCompanies: []
  })

  // Load dashboard data
  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load all dashboard data in parallel
      const [overviewRes, modulesRes, revenueTrendRes, planDistRes, subscriptionsRes, logsRes] = await Promise.all([
        masterAdminAnalyticsService.getDashboardOverview(),
        masterAdminAnalyticsService.getModuleStatistics(),
        masterAdminAnalyticsService.getRevenueTrend({ months: 6 }),
        masterAdminAnalyticsService.getPlanDistribution(),
        masterAdminSubscriptionService.getAllSubscriptions({ status: 'active', limit: 5 }),
        masterAdminLogService.getAllLogs({ limit: 5 })
      ])

      // Set overview data
      if (overviewRes.success && overviewRes.data.overview) {
        setDashboardData(prev => ({
          ...prev,
          overview: overviewRes.data.overview
        }))
      }

      // Set modules data
      if (modulesRes.success && modulesRes.data.modules) {
        const modulesWithIcons = modulesRes.data.modules.map((module, index) => ({
          ...module,
          id: index + 1,
          icon: [Target, Workflow, Users, DollarSign, Cloud][index] || Target,
          color: [
            'from-blue-500 to-blue-600',
            'from-purple-500 to-purple-600',
            'from-emerald-500 to-emerald-600',
            'from-slate-500 to-slate-600',
            'from-cyan-500 to-cyan-600'
          ][index] || 'from-blue-500 to-blue-600'
        }))
        setDashboardData(prev => ({
          ...prev,
          modules: modulesWithIcons
        }))
      }

      // Set revenue trend
      if (revenueTrendRes.success && revenueTrendRes.data.revenueTrend) {
        setDashboardData(prev => ({
          ...prev,
          revenueTrend: revenueTrendRes.data.revenueTrend
        }))
      }

      // Set module distribution from plan distribution
      if (planDistRes.success && planDistRes.data.planDistribution) {
        const distribution = planDistRes.data.planDistribution.map((plan, index) => ({
          name: plan.name,
          value: plan.value,
          color: plan.color
        }))
        setDashboardData(prev => ({
          ...prev,
          moduleDistribution: distribution
        }))
      }

      // Set subscriptions
      if (subscriptionsRes.success && subscriptionsRes.data.subscriptions) {
        const formattedSubs = subscriptionsRes.data.subscriptions.map(sub => ({
          id: sub._id,
          company: sub.company?.name || 'Unknown',
          plan: sub.plan,
          status: sub.status,
          users: sub.users,
          amount: sub.amount,
          nextBilling: new Date(sub.nextBillingDate).toLocaleDateString()
        }))
        setDashboardData(prev => ({
          ...prev,
          subscriptions: formattedSubs
        }))
      }

      // Set recent activity from logs
      if (logsRes.success && logsRes.data.logs) {
        const formattedLogs = logsRes.data.logs.map(log => ({
          id: log._id,
          type: log.type,
          action: log.action,
          user: log.user,
          time: new Date(log.createdAt).toLocaleString(),
          status: log.status
        }))
        setDashboardData(prev => ({
          ...prev,
          recentActivity: formattedLogs
        }))
      }

      // Load top companies
      try {
        const companiesRes = await masterAdminCompanyService.getAllCompanies({ limit: 4, status: 'active' })
        if (companiesRes.success && companiesRes.data.companies) {
          const topCompanies = companiesRes.data.companies.map((company, index) => ({
            id: company._id,
            name: company.name,
            revenue: company.totalRevenue || 0,
            growth: 0, // Calculate if needed
            users: company.totalUsers || 0
          }))
          setDashboardData(prev => ({
            ...prev,
            topCompanies: topCompanies
          }))
        }
      } catch (error) {
        console.error('Error loading companies:', error)
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data', {
        title: 'Error',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

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

  const getActivityIcon = (type) => {
    switch (type) {
      case 'subscription':
        return <CreditCard className="h-4 w-4" />
      case 'user':
        return <Users className="h-4 w-4" />
      case 'payment':
        return <DollarSign className="h-4 w-4" />
      case 'module':
        return <Settings className="h-4 w-4" />
      case 'alert':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const COLORS = ['#14b8a6', '#3b82f6', '#a855f7', '#10b981', '#64748b']

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {loading && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 shadow-xl">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-6 w-6 animate-spin text-teal-600" />
                  <span className="text-lg font-medium text-slate-700">Loading dashboard...</span>
                </div>
              </div>
            </div>
          )}
          {/* Header Section */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                  Master Admin <span className="text-teal-600">Dashboard</span>
                </h1>
                <p className="mt-2 text-base text-slate-600">
                  Control and manage your entire CRM platform from one place
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  onClick={loadDashboardData}
                  disabled={loading}
                  className="border-teal-200 bg-white text-teal-600 hover:bg-teal-50">
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  className="border-teal-200 bg-white text-teal-600 hover:bg-teal-50">
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Overview Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Total Users',
                value: dashboardData.overview.totalUsers.toLocaleString(),
                change: '+12.5%',
                trend: 'up',
                icon: Users,
                color: 'from-blue-500 to-blue-600'
              },
              {
                title: 'Active Subscriptions',
                value: dashboardData.overview.activeSubscriptions,
                change: '+8.2%',
                trend: 'up',
                icon: CreditCard,
                color: 'from-emerald-500 to-emerald-600'
              },
              {
                title: 'Total Revenue',
                value: formatCurrency(dashboardData.overview.totalRevenue),
                change: `+${dashboardData.overview.monthlyGrowth}%`,
                trend: 'up',
                icon: DollarSign,
                color: 'from-teal-500 to-teal-600'
              },
              {
                title: 'System Health',
                value: `${dashboardData.overview.systemHealth}%`,
                change: '+2.1%',
                trend: 'up',
                icon: Activity,
                color: 'from-purple-500 to-purple-600'
              }
            ].map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.title}
                  initial="hidden"
                  animate="show"
                  custom={index * 0.1}
                  variants={fadeUp}>
                  <Card className="border-teal-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-teal-100/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                          <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
                          <div className="mt-2 flex items-center gap-1 text-xs">
                            {stat.trend === 'up' ? (
                              <ArrowUpRight className="h-3 w-3 text-green-600" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3 text-red-600" />
                            )}
                            <span className={stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                              {stat.change}
                            </span>
                            <span className="text-slate-500">vs last month</span>
                          </div>
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

          {/* Charts Row */}
          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            {/* Revenue Trend Chart */}
            <motion.div
              initial="hidden"
              animate="show"
              custom={0.4}
              variants={fadeUp}>
              <Card className="border-teal-100 bg-white shadow-sm">
                <CardHeader className="border-b border-teal-100 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold text-slate-900">
                      Revenue Trend
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="text-xs text-slate-600">
                        Last 6 months
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dashboardData.revenueTrend}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#14b8a6"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Module Distribution Chart */}
            <motion.div
              initial="hidden"
              animate="show"
              custom={0.5}
              variants={fadeUp}>
              <Card className="border-teal-100 bg-white shadow-sm">
                <CardHeader className="border-b border-teal-100 pb-4">
                  <CardTitle className="text-xl font-semibold text-slate-900">
                    Module Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={dashboardData.moduleDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dashboardData.moduleDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Modules Management */}
          <motion.div
            initial="hidden"
            animate="show"
            custom={0.6}
            variants={fadeUp}
            className="mb-8">
            <Card className="border-teal-100 bg-white shadow-sm">
              <CardHeader className="border-b border-teal-100 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-slate-900">
                    Platform Modules
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {dashboardData.modules.map((module, index) => {
                    const Icon = module.icon
                    return (
                      <motion.div
                        key={module.id}
                        initial="hidden"
                        animate="show"
                        custom={0.7 + index * 0.1}
                        variants={fadeUp}
                        className="group relative overflow-hidden rounded-xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/30 p-5 transition-all duration-300 hover:border-teal-300 hover:shadow-lg hover:shadow-teal-100/50">
                        <div className="flex flex-col items-center text-center">
                          <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${module.color} shadow-md transition-transform duration-300 group-hover:scale-110`}>
                            <Icon className="h-7 w-7 text-white" />
                          </div>
                          <h3 className="mb-1 text-sm font-semibold text-slate-900">{module.name}</h3>
                          <div className="mb-2 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">Active</span>
                          </div>
                          <div className="space-y-1 text-xs">
                            <p className="text-slate-600">
                              <span className="font-semibold text-slate-900">{module.users}</span> users
                            </p>
                            <p className="text-slate-600">
                              <span className="font-semibold text-slate-900">{formatCurrency(module.revenue)}</span>
                            </p>
                            <div className="flex items-center justify-center gap-1 text-green-600">
                              <TrendingUp className="h-3 w-3" />
                              <span>+{module.growth}%</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Activity */}
            <motion.div
              initial="hidden"
              animate="show"
              custom={0.8}
              variants={fadeUp}
              className="lg:col-span-2">
              <Card className="border-teal-100 bg-white shadow-sm">
                <CardHeader className="border-b border-teal-100 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold text-slate-900">
                      Recent Activity
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/master-admin-logs')}
                      className="text-teal-600 hover:text-teal-700">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {dashboardData.recentActivity.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial="hidden"
                        animate="show"
                        custom={0.9 + index * 0.05}
                        variants={fadeUp}
                        className="flex items-start gap-4 rounded-lg border border-teal-50 bg-white p-4 transition-all duration-300 hover:border-teal-200 hover:shadow-sm">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                          <p className="mt-1 text-xs text-slate-600">{activity.user}</p>
                          <p className="mt-1 text-xs text-slate-500">{activity.time}</p>
                        </div>
                        <div className={`rounded-full px-2 py-1 text-xs font-medium ${
                          activity.status === 'success' ? 'bg-green-100 text-green-700' :
                          activity.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {activity.status}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Top Companies */}
            <motion.div
              initial="hidden"
              animate="show"
              custom={1.0}
              variants={fadeUp}>
              <Card className="border-teal-100 bg-white shadow-sm">
                <CardHeader className="border-b border-teal-100 pb-4">
                  <CardTitle className="text-xl font-semibold text-slate-900">
                    Top Companies
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {dashboardData.topCompanies.map((company, index) => (
                      <div
                        key={company.id}
                        className="flex items-center justify-between rounded-lg border border-teal-50 p-3 transition-all duration-300 hover:border-teal-200 hover:bg-teal-50/50">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 text-white text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{company.name}</p>
                            <p className="text-xs text-slate-500">{company.users} users</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">{formatCurrency(company.revenue)}</p>
                          <div className={`flex items-center gap-1 text-xs ${company.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {company.growth > 0 ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            <span>{Math.abs(company.growth)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Subscriptions Table */}
          <motion.div
            initial="hidden"
            animate="show"
            custom={1.2}
            variants={fadeUp}
            className="mt-6">
            <Card className="border-teal-100 bg-white shadow-sm">
              <CardHeader className="border-b border-teal-100 pb-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-xl font-semibold text-slate-900">
                    Active Subscriptions
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="Search subscriptions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 sm:w-64"
                      />
                    </div>
                    <Button variant="outline" size="sm" className="border-teal-200">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                  </div>
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
                      {dashboardData.subscriptions.map((subscription) => (
                        <tr key={subscription.id} className="transition-colors duration-200 hover:bg-teal-50/50">
                          <td className="py-4 text-sm font-medium text-slate-900">{subscription.company}</td>
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
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
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
  )
}

export default MA_dashboard
