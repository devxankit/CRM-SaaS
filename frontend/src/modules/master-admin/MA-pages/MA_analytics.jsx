import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  CreditCard,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import MA_dashboard_navbar from '../MA-components/MA_dashboard_navbar'
import MA_dashboard_sidebar from '../MA-components/MA_dashboard_sidebar'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', delay }
  })
}

const MA_analytics = () => {
  const [timeRange, setTimeRange] = useState('6m')

  const revenueData = [
    { month: 'Aug', revenue: 850000, subscriptions: 280 },
    { month: 'Sep', revenue: 920000, subscriptions: 295 },
    { month: 'Oct', revenue: 980000, subscriptions: 310 },
    { month: 'Nov', revenue: 1050000, subscriptions: 325 },
    { month: 'Dec', revenue: 1120000, subscriptions: 335 },
    { month: 'Jan', revenue: 1250000, subscriptions: 342 }
  ]

  const moduleData = [
    { name: 'Sales CRM', revenue: 342000, users: 456 },
    { name: 'PM Cloud', revenue: 291750, users: 389 },
    { name: 'Client Portal', revenue: 249750, users: 40 },
    { name: 'People Ops', revenue: 175500, users: 234 },
    { name: 'Admin HQ', revenue: 192000, users: 128 }
  ]

  const planDistribution = [
    { name: 'Premium', value: 45, color: '#14b8a6' },
    { name: 'Professional', value: 35, color: '#3b82f6' },
    { name: 'Starter', value: 20, color: '#10b981' }
  ]

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
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
                  Analytics & <span className="text-teal-600">Reports</span>
                </h1>
                <p className="mt-2 text-base text-slate-600">
                  Comprehensive insights into your platform performance
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="rounded-md border border-teal-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="1m">Last Month</option>
                  <option value="3m">Last 3 Months</option>
                  <option value="6m">Last 6 Months</option>
                  <option value="1y">Last Year</option>
                </select>
                <Button variant="outline" className="border-teal-200">
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Key Metrics */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Total Revenue', value: formatCurrency(1250000), change: '+12.5%', trend: 'up', icon: DollarSign, color: 'from-teal-500 to-teal-600' },
              { title: 'Active Subscriptions', value: '342', change: '+8.2%', trend: 'up', icon: CreditCard, color: 'from-emerald-500 to-emerald-600' },
              { title: 'Total Users', value: '1,247', change: '+15.3%', trend: 'up', icon: Users, color: 'from-blue-500 to-blue-600' },
              { title: 'Growth Rate', value: '18.9%', change: '+2.1%', trend: 'up', icon: TrendingUp, color: 'from-purple-500 to-purple-600' }
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
            {/* Revenue Trend */}
            <motion.div
              initial="hidden"
              animate="show"
              custom={0.4}
              variants={fadeUp}>
              <Card className="border-teal-100 bg-white shadow-sm">
                <CardHeader className="border-b border-teal-100 pb-4">
                  <CardTitle className="text-xl font-semibold text-slate-900">
                    Revenue Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueData}>
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

            {/* Plan Distribution */}
            <motion.div
              initial="hidden"
              animate="show"
              custom={0.5}
              variants={fadeUp}>
              <Card className="border-teal-100 bg-white shadow-sm">
                <CardHeader className="border-b border-teal-100 pb-4">
                  <CardTitle className="text-xl font-semibold text-slate-900">
                    Plan Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={planDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {planDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Module Performance */}
          <motion.div
            initial="hidden"
            animate="show"
            custom={0.6}
            variants={fadeUp}>
            <Card className="border-teal-100 bg-white shadow-sm">
              <CardHeader className="border-b border-teal-100 pb-4">
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Module Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={moduleData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="revenue" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="users" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default MA_analytics

