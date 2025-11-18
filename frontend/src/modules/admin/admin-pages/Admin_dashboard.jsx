import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Admin_navbar from '../admin-components/Admin_navbar'
import Admin_sidebar from '../admin-components/Admin_sidebar'
import { 
  Users, 
  FolderOpen, 
  DollarSign, 
  TrendingUp,
  Activity,
  Award,
  Code,
  Trophy,
  Gift,
  AlertTriangle,
  CheckCircle,
  Clock,
  PieChart,
  LineChart,
  Download,
  Settings,
  Bell,
  Eye,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Target,
  Zap,
  Shield,
  Database,
  Server,
  TrendingDown,
  IndianRupee,
  CreditCard,
  Minus,
  BarChart3,
  RefreshCw,
  Filter,
  MoreHorizontal,
  Star,
  TrendingUp as TrendingUpIcon,
  ArrowRight,
  Sparkles,
  Crown,
  Flame
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import Loading from '../../../components/ui/loading'
import { MagicCard } from '../../../components/ui/magic-card'
import { BorderBeam } from '../../../components/ui/border-beam'
import { SparklesText } from '../../../components/ui/sparkles-text'
import { AuroraText } from '../../../components/ui/aurora-text'
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

// Import custom components
import ChartContainer from '../admin-components/ChartContainer'
import NotificationPanel from '../admin-components/NotificationPanel'
import QuickActionButton from '../admin-components/QuickActionButton'

// Import dashboard service
import adminDashboardService from '../admin-services/adminDashboardService'
import { adminFinanceService } from '../admin-services/adminFinanceService'

const Admin_dashboard = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [timeRange, setTimeRange] = useState('7d')
  const [notifications, setNotifications] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Dashboard data - loaded from API
  const [dashboardData, setDashboardData] = useState({
    // User Statistics
    users: {
      total: 0,
      sales: 0,
      pm: 0,
      employees: 0,
      clients: 0,
      active: 0,
      newThisMonth: 0,
      growth: 0
    },
    
    // Project Statistics
    projects: {
      total: 0,
      active: 0,
      completed: 0,
      onHold: 0,
      overdue: 0,
      totalRevenue: 0,
      avgProjectValue: 0,
      completionRate: 0
    },
    
    // Sales Statistics
    sales: {
      totalLeads: 0,
      converted: 0,
      conversionRate: 0,
      totalRevenue: 0,
      avgDealSize: 0,
      growth: 0
    },
    
    // Financial Statistics
    finance: {
      totalRevenue: 0,
      monthlyRevenue: 0,
      outstandingPayments: 0,
      expenses: 0,
      profit: 0,
      profitMargin: 0,
      growth: 0
    },

    // Today's Financial Metrics
    today: {
      earnings: 0,
      expenses: 0,
      sales: 0,
      pendingAmount: 0,
      profit: 0,
      loss: 0,
      earningsGrowth: 0,
      expensesGrowth: 0,
      salesGrowth: 0,
      profitGrowth: 0,
      lossGrowth: 0
    },

    // System Health
    system: {
      uptime: 0,
      performance: 0,
      errors: 0,
      activeUsers: 0,
      serverLoad: 0
    },

    // Revenue trend data
    revenueTrend: [],

    // Project status distribution
    projectStatusDistribution: []
  })

  // Chart data from API
  const revenueData = dashboardData.revenueTrend || []

  // Project status data from API
  const projectStatusData = dashboardData.projectStatusDistribution || []

  // Mock notifications (can be replaced with real API later)
  const mockNotifications = [
    {
      id: 1,
      type: 'warning',
      title: 'Payment Overdue',
      message: `${dashboardData.projects.overdue || 0} projects have overdue payments totaling ${dashboardData.finance.outstandingPayments ? `₹${(dashboardData.finance.outstandingPayments / 1000).toFixed(0)}k` : '₹0'}`,
      time: '2 hours ago',
      icon: AlertTriangle
    },
    {
      id: 2,
      type: 'success',
      title: 'Project Completed',
      message: `${dashboardData.projects.completed || 0} projects completed successfully`,
      time: '4 hours ago',
      icon: CheckCircle
    },
    {
      id: 3,
      type: 'info',
      title: 'New User Registration',
      message: `${dashboardData.users.newThisMonth || 0} new users registered this month`,
      time: '6 hours ago',
      icon: Users
    },
    {
      id: 4,
      type: 'error',
      title: 'System Alert',
      message: `Server load: ${dashboardData.system.serverLoad || 0}%`,
      time: '1 day ago',
      icon: Server
    }
  ]

  // Fetch recent activities
  const fetchRecentActivities = async () => {
    try {
      const response = await adminDashboardService.getRecentActivities(3)
      if (response.success && response.data) {
        // Sort by time and take only top 3
        const sortedActivities = response.data
          .sort((a, b) => new Date(b.time) - new Date(a.time))
          .slice(0, 3)
        setRecentActivities(sortedActivities)
      }
    } catch (err) {
      console.error('Error fetching recent activities:', err)
      // Keep existing activities on error
    }
  }

  // Helper function to get icon component based on icon name
  const getActivityIcon = (iconName, color) => {
    const colorClasses = {
      green: 'text-emerald-600',
      red: 'text-red-600',
      blue: 'text-blue-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600'
    }
    const iconClass = `h-3 w-3 ${colorClasses[color] || 'text-gray-600'}`
    
    switch (iconName) {
      case 'trending-up':
        return <TrendingUp className={iconClass} />
      case 'trending-down':
        return <TrendingDown className={iconClass} />
      case 'folder':
        return <FolderOpen className={iconClass} />
      case 'dollar':
        return <DollarSign className={iconClass} />
      case 'target':
        return <Target className={iconClass} />
      default:
        return <Activity className={iconClass} />
    }
  }

  // Helper function to format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Just now'
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  }

  useEffect(() => {
    // Load dashboard data from API
    const loadDashboardData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch dashboard stats and finance statistics in parallel
        // Fetch both all-time and monthly finance statistics
        const [dashboardResponse, financeResponseAll, financeResponseMonth] = await Promise.all([
          adminDashboardService.getDashboardStats(),
          adminFinanceService.getFinanceStatistics('all').catch(err => {
            console.error('Error fetching finance statistics (all):', err)
            return null
          }),
          adminFinanceService.getFinanceStatistics('month').catch(err => {
            console.error('Error fetching finance statistics (month):', err)
            return null
          })
        ])
        
        if (dashboardResponse.success && dashboardResponse.data) {
          let dashboardData = { ...dashboardResponse.data }
          
          // Override financial data with comprehensive finance statistics if available
          const financeData = financeResponseAll?.success && financeResponseAll?.data ? financeResponseAll.data : null
          const financeDataMonth = financeResponseMonth?.success && financeResponseMonth?.data ? financeResponseMonth.data : null
          
          if (financeData) {
            // Update finance section with comprehensive data
            dashboardData.finance = {
              totalRevenue: financeData.totalRevenue || 0,
              monthlyRevenue: financeDataMonth?.totalRevenue || financeData.totalRevenue || 0, // Use monthly data if available
              outstandingPayments: financeData.pendingAmounts?.totalPendingReceivables || 0,
              expenses: financeData.totalExpenses || 0,
              profit: financeData.netProfit || 0,
              profitMargin: parseFloat(financeData.profitMargin || 0),
              growth: parseFloat(financeDataMonth?.revenueChange || financeData.revenueChange || 0)
            }
            
            // Update today's financial metrics with accurate data
            dashboardData.today = {
              ...dashboardData.today,
              earnings: financeData.todayEarnings || dashboardData.today.earnings || 0,
              expenses: financeData.todayExpenses || dashboardData.today.expenses || 0,
              sales: financeData.todayEarnings || dashboardData.today.sales || 0, // Today sales = today earnings
              pendingAmount: financeData.pendingAmounts?.totalPendingReceivables || dashboardData.today.pendingAmount || 0,
              profit: financeData.todayProfit || dashboardData.today.profit || 0,
              loss: (financeData.todayExpenses || 0) > (financeData.todayEarnings || 0) 
                ? (financeData.todayExpenses - financeData.todayEarnings) 
                : 0
            }
          }
          
          setDashboardData(dashboardData)
          
          // Update notifications with real data
          const updatedNotifications = [
            {
              id: 1,
              type: 'warning',
              title: 'Payment Overdue',
              message: `${dashboardData.projects.overdue || 0} projects have overdue payments`,
              time: 'Just now',
              icon: AlertTriangle
            },
            {
              id: 2,
              type: 'success',
              title: 'Project Completed',
              message: `${dashboardData.projects.completed || 0} projects completed successfully`,
              time: 'Just now',
              icon: CheckCircle
            },
            {
              id: 3,
              type: 'info',
              title: 'New User Registration',
              message: `${dashboardData.users.newThisMonth || 0} new users registered this month`,
              time: 'Just now',
              icon: Users
            },
            {
              id: 4,
              type: 'error',
              title: 'System Alert',
              message: `Server load: ${dashboardData.system.serverLoad || 0}%`,
              time: 'Just now',
              icon: Server
            }
          ]
          setNotifications(updatedNotifications)
        } else {
          throw new Error('Failed to load dashboard data')
        }
        
        // Fetch recent activities separately
        await fetchRecentActivities()
      } catch (err) {
        console.error('Error loading dashboard data:', err)
        setError(err.message || 'Failed to load dashboard data')
        // Set notifications with mock data on error
        setNotifications(mockNotifications)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
    
    // Set up interval to refresh activities every 30 seconds
    const activityInterval = setInterval(() => {
      fetchRecentActivities()
    }, 30000)
    
    return () => clearInterval(activityInterval)
  }, [])

  const handleQuickAction = (action) => {
    switch(action) {
      case 'users':
        navigate('/admin-project-management')
        break
      case 'projects':
        navigate('/admin-project-management')
        break
      case 'finance':
        navigate('/admin-finance-management')
        break
      case 'sales':
        navigate('/admin-sales-management')
        break
      case 'rewards':
        navigate('/admin-reward-management')
        break
      case 'leaderboard':
        navigate('/admin-leaderboard')
        break
      default:
        break
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Admin_navbar />
        <Admin_sidebar />
        <div className="ml-64 pt-20 p-8">
          <div className="max-w-7xl mx-auto">
            <Loading size="large" className="h-96" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Admin_navbar />
        <Admin_sidebar />
        <div className="ml-64 pt-20 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Dashboard</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <Button 
                onClick={async () => {
                  setIsLoading(true)
                  setError(null)
                  try {
                    // Fetch dashboard stats and finance statistics in parallel
                    const [dashboardResponse, financeResponseAll, financeResponseMonth] = await Promise.all([
                      adminDashboardService.getDashboardStats(),
                      adminFinanceService.getFinanceStatistics('all').catch(err => {
                        console.error('Error fetching finance statistics (all):', err)
                        return null
                      }),
                      adminFinanceService.getFinanceStatistics('month').catch(err => {
                        console.error('Error fetching finance statistics (month):', err)
                        return null
                      })
                    ])
                    
                    if (dashboardResponse.success && dashboardResponse.data) {
                      let dashboardData = { ...dashboardResponse.data }
                      
                      const financeData = financeResponseAll?.success && financeResponseAll?.data ? financeResponseAll.data : null
                      const financeDataMonth = financeResponseMonth?.success && financeResponseMonth?.data ? financeResponseMonth.data : null
                      
                      if (financeData) {
                        dashboardData.finance = {
                          totalRevenue: financeData.totalRevenue || 0,
                          monthlyRevenue: financeDataMonth?.totalRevenue || financeData.totalRevenue || 0,
                          outstandingPayments: financeData.pendingAmounts?.totalPendingReceivables || 0,
                          expenses: financeData.totalExpenses || 0,
                          profit: financeData.netProfit || 0,
                          profitMargin: parseFloat(financeData.profitMargin || 0),
                          growth: parseFloat(financeDataMonth?.revenueChange || financeData.revenueChange || 0)
                        }
                        
                        dashboardData.today = {
                          ...dashboardData.today,
                          earnings: financeData.todayEarnings || dashboardData.today.earnings || 0,
                          expenses: financeData.todayExpenses || dashboardData.today.expenses || 0,
                          sales: financeData.todayEarnings || dashboardData.today.sales || 0,
                          pendingAmount: financeData.pendingAmounts?.totalPendingReceivables || dashboardData.today.pendingAmount || 0,
                          profit: financeData.todayProfit || dashboardData.today.profit || 0,
                          loss: (financeData.todayExpenses || 0) > (financeData.todayEarnings || 0) 
                            ? (financeData.todayExpenses - financeData.todayEarnings) 
                            : 0
                        }
                      }
                      
                      setDashboardData(dashboardData)
                    }
                    
                    // Fetch recent activities
                    await fetchRecentActivities()
                  } catch (err) {
                    setError(err.message || 'Failed to load dashboard data')
                  } finally {
                    setIsLoading(false)
                  }
                }}
                variant="outline"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navbar */}
      <Admin_navbar />
      
      {/* Sidebar */}
      <Admin_sidebar />
      
      {/* Main Content */}
      <div className="ml-64 pt-20 p-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
          >
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                Dashboard Overview
              </h1>
              <p className="text-gray-600 text-lg">
                Welcome back! Here's what's happening with your business today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={async () => {
                  setIsLoading(true)
                  try {
                    // Fetch dashboard stats and finance statistics in parallel
                    // Fetch both all-time and monthly finance statistics
                    const [dashboardResponse, financeResponseAll, financeResponseMonth] = await Promise.all([
                      adminDashboardService.getDashboardStats(),
                      adminFinanceService.getFinanceStatistics('all').catch(err => {
                        console.error('Error fetching finance statistics (all):', err)
                        return null
                      }),
                      adminFinanceService.getFinanceStatistics('month').catch(err => {
                        console.error('Error fetching finance statistics (month):', err)
                        return null
                      })
                    ])
                    
                    if (dashboardResponse.success && dashboardResponse.data) {
                      let dashboardData = { ...dashboardResponse.data }
                      
                      // Override financial data with comprehensive finance statistics if available
                      const financeData = financeResponseAll?.success && financeResponseAll?.data ? financeResponseAll.data : null
                      const financeDataMonth = financeResponseMonth?.success && financeResponseMonth?.data ? financeResponseMonth.data : null
                      
                      if (financeData) {
                        dashboardData.finance = {
                          totalRevenue: financeData.totalRevenue || 0,
                          monthlyRevenue: financeDataMonth?.totalRevenue || financeData.totalRevenue || 0,
                          outstandingPayments: financeData.pendingAmounts?.totalPendingReceivables || 0,
                          expenses: financeData.totalExpenses || 0,
                          profit: financeData.netProfit || 0,
                          profitMargin: parseFloat(financeData.profitMargin || 0),
                          growth: parseFloat(financeDataMonth?.revenueChange || financeData.revenueChange || 0)
                        }
                        
                        dashboardData.today = {
                          ...dashboardData.today,
                          earnings: financeData.todayEarnings || dashboardData.today.earnings || 0,
                          expenses: financeData.todayExpenses || dashboardData.today.expenses || 0,
                          sales: financeData.todayEarnings || dashboardData.today.sales || 0,
                          pendingAmount: financeData.pendingAmounts?.totalPendingReceivables || dashboardData.today.pendingAmount || 0,
                          profit: financeData.todayProfit || dashboardData.today.profit || 0,
                          loss: (financeData.todayExpenses || 0) > (financeData.todayEarnings || 0) 
                            ? (financeData.todayExpenses - financeData.todayEarnings) 
                            : 0
                        }
                      }
                      
                      setDashboardData(dashboardData)
                    }
                    
                    // Refresh recent activities
                    await fetchRecentActivities()
                  } catch (err) {
                    console.error('Error refreshing dashboard:', err)
                    setError(err.message || 'Failed to refresh dashboard')
                  } finally {
                    setIsLoading(false)
                  }
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </motion.div>

          {/* Today's Financial Metrics Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            {/* Today Earnings */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-green-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-emerald-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-emerald-400/20 to-green-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium ${dashboardData.today.earningsGrowth >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {dashboardData.today.earningsGrowth >= 0 ? '+' : ''}{dashboardData.today.earningsGrowth?.toFixed(1) || 0}%
                    </p>
                    <p className="text-xs text-emerald-600">vs yesterday</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-emerald-700 mb-1">Today Earnings</p>
                  <p className="text-lg font-bold text-emerald-800">{formatCurrency(dashboardData.today.earnings)}</p>
                </div>
              </div>
            </div>

            {/* Today Expense */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 to-rose-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-red-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-red-400/20 to-rose-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium ${dashboardData.today.expensesGrowth >= 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                      {dashboardData.today.expensesGrowth >= 0 ? '+' : ''}{dashboardData.today.expensesGrowth?.toFixed(1) || 0}%
                    </p>
                    <p className="text-xs text-red-600">vs yesterday</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-red-700 mb-1">Today Expense</p>
                  <p className="text-lg font-bold text-red-800">{formatCurrency(dashboardData.today.expenses)}</p>
                </div>
              </div>
            </div>

            {/* Today Sales */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-blue-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <IndianRupee className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium ${dashboardData.today.salesGrowth >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      {dashboardData.today.salesGrowth >= 0 ? '+' : ''}{dashboardData.today.salesGrowth?.toFixed(1) || 0}%
                    </p>
                    <p className="text-xs text-blue-600">vs yesterday</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-700 mb-1">Today Sales</p>
                  <p className="text-lg font-bold text-blue-800">{formatCurrency(dashboardData.today.sales)}</p>
                </div>
              </div>
            </div>

            {/* Pending Amount */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-amber-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-orange-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-orange-400/20 to-amber-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <CreditCard className="h-4 w-4 text-orange-600" />
                  </div>
                  {dashboardData.today.pendingAmount > 0 && (
                    <div className="text-right">
                      <p className="text-xs font-medium text-orange-700">Yes</p>
                      <p className="text-xs text-orange-600">pending</p>
                    </div>
                  )}
                  {dashboardData.today.pendingAmount === 0 && (
                    <div className="text-right">
                      <p className="text-xs font-medium text-orange-700">No pending</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-orange-700 mb-1">Pending Amount</p>
                  <p className="text-lg font-bold text-orange-800">{formatCurrency(dashboardData.today.pendingAmount)}</p>
                </div>
              </div>
            </div>

            {/* Profit */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-teal-50 to-cyan-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-teal-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-teal-400/20 to-cyan-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-teal-500/10">
                    <Plus className="h-4 w-4 text-teal-600" />
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium ${dashboardData.today.profitGrowth >= 0 ? 'text-teal-700' : 'text-red-700'}`}>
                      {dashboardData.today.profitGrowth >= 0 ? '+' : ''}{dashboardData.today.profitGrowth?.toFixed(1) || 0}%
                    </p>
                    <p className="text-xs text-teal-600">vs yesterday</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-teal-700 mb-1">Profit</p>
                  <p className="text-lg font-bold text-teal-800">{formatCurrency(dashboardData.today.profit)}</p>
                </div>
              </div>
            </div>

            {/* Loss */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-50 to-pink-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-rose-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-rose-400/20 to-pink-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-rose-500/10">
                    <Minus className="h-4 w-4 text-rose-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-rose-700">
                      {dashboardData.today.lossGrowth !== undefined 
                        ? `${dashboardData.today.lossGrowth >= 0 ? '+' : ''}${dashboardData.today.lossGrowth?.toFixed(1) || 0}%`
                        : '0%'}
                    </p>
                    <p className="text-xs text-rose-600">vs yesterday</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-rose-700 mb-1">Loss</p>
                  <p className="text-lg font-bold text-rose-800">{formatCurrency(dashboardData.today.loss)}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Performance Metrics Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
          >
            {/* Monthly Revenue */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-md border border-emerald-200/50 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-100 to-green-100">
                  <DollarSign className="h-3 w-3 text-emerald-600" />
                </div>
                <div className="text-right">
                  <p className={`text-xs font-medium ${dashboardData.finance.growth >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {dashboardData.finance.growth >= 0 ? '+' : ''}{dashboardData.finance.growth?.toFixed(1) || 0}%
                  </p>
                  <p className="text-xs text-emerald-600">this month</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Monthly Revenue</p>
                <p className="text-lg font-bold text-emerald-700">{formatCurrency(dashboardData.finance.monthlyRevenue || dashboardData.finance.totalRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">Total earnings</p>
              </div>
            </div>

            {/* Converted Leads */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-md border border-orange-200/50 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100">
                  <Trophy className="h-3 w-3 text-orange-600" />
                </div>
                <div className="text-right">
                  <p className={`text-xs font-medium ${dashboardData.sales.growth >= 0 ? 'text-orange-700' : 'text-red-700'}`}>
                    {dashboardData.sales.growth >= 0 ? '+' : ''}{dashboardData.sales.growth?.toFixed(1) || 0}%
                  </p>
                  <p className="text-xs text-orange-600">this month</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Converted Leads</p>
                <p className="text-lg font-bold text-orange-700">{formatNumber(dashboardData.sales.converted)}</p>
                <p className="text-xs text-gray-500 mt-1">Total conversions</p>
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-md border border-blue-200/50 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                  <Target className="h-3 w-3 text-blue-600" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-blue-700">
                    {dashboardData.sales.conversionRate?.toFixed(2) || 0}%
                  </p>
                  <p className="text-xs text-blue-600">conversion</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Conversion Rate</p>
                <p className="text-lg font-bold text-blue-700">{dashboardData.sales.conversionRate?.toFixed(2) || 0}%</p>
                <p className="text-xs text-gray-500 mt-1">Lead to customer</p>
              </div>
            </div>

            {/* Overdue Projects */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-md border border-red-200/50 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-100 to-rose-100">
                  <AlertTriangle className="h-3 w-3 text-red-600" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-red-700">
                    {dashboardData.projects.overdue || 0}
                  </p>
                  <p className="text-xs text-red-600">projects</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Overdue Projects</p>
                <p className="text-lg font-bold text-red-700">{formatNumber(dashboardData.projects.overdue)}</p>
                <p className="text-xs text-gray-500 mt-1">Need attention</p>
              </div>
            </div>

            {/* Total Clients */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-md border border-indigo-200/50 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100">
                  <Users className="h-3 w-3 text-indigo-600" />
                </div>
                <div className="text-right">
                  <p className={`text-xs font-medium ${dashboardData.users.growth >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>
                    {dashboardData.users.growth >= 0 ? '+' : ''}{dashboardData.users.growth?.toFixed(1) || 0}%
                  </p>
                  <p className="text-xs text-indigo-600">this month</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Total Clients</p>
                <p className="text-lg font-bold text-indigo-700">{formatNumber(dashboardData.users.clients)}</p>
                <p className="text-xs text-gray-500 mt-1">Active clients</p>
              </div>
            </div>
          </motion.div>

          {/* Analytics Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Revenue Trend Chart */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Revenue Trend</h3>
                  <p className="text-sm text-gray-600">Monthly revenue growth</p>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100">
                  <LineChart className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 11 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        fontSize: '12px'
                      }}
                      formatter={(value) => [formatCurrency(value), 'Revenue']} 
                  />
                  <Area 
                    type="monotone" 
                      dataKey="revenue"
                    stroke="#10B981" 
                      strokeWidth={2}
                      fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
              </div>
            </div>

            {/* Project Status Distribution */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Project Status</h3>
                  <p className="text-sm text-gray-600">Current project distribution</p>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                  <PieChart className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="h-48 flex items-center">
                <div className="w-32 h-32 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={projectStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={45}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {projectStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          fontSize: '12px'
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 flex flex-col justify-center space-y-3 pl-6">
                  {projectStatusData.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full shadow-sm" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-600">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions & Recent Activity */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-200/50 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Quick Actions</h3>
                  <p className="text-sm text-gray-600">Access frequently used features</p>
                </div>
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100">
                  <Settings className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 flex-1">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickAction('users')}
                  className="group p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200 transition-all duration-300 border border-blue-200/50"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <ArrowRight className="h-3 w-3 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">Manage Users</h4>
                  <p className="text-xs text-blue-700">View and manage all users</p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickAction('projects')}
                  className="group p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-green-100 hover:from-emerald-100 hover:to-green-200 transition-all duration-300 border border-emerald-200/50"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                      <FolderOpen className="h-4 w-4 text-emerald-600" />
                    </div>
                    <ArrowRight className="h-3 w-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h4 className="text-sm font-semibold text-emerald-900 mb-1">View Projects</h4>
                  <p className="text-xs text-emerald-700">Monitor all projects</p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickAction('finance')}
                  className="group p-3 rounded-xl bg-gradient-to-br from-purple-50 to-violet-100 hover:from-purple-100 hover:to-violet-200 transition-all duration-300 border border-purple-200/50"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                      <IndianRupee className="h-4 w-4 text-purple-600" />
                    </div>
                    <ArrowRight className="h-3 w-3 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h4 className="text-sm font-semibold text-purple-900 mb-1">Financial Reports</h4>
                  <p className="text-xs text-purple-700">View financial analytics</p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickAction('sales')}
                  className="group p-3 rounded-xl bg-gradient-to-br from-orange-50 to-amber-100 hover:from-orange-100 hover:to-amber-200 transition-all duration-300 border border-orange-200/50"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                    </div>
                    <ArrowRight className="h-3 w-3 text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h4 className="text-sm font-semibold text-orange-900 mb-1">Sales Management</h4>
                  <p className="text-xs text-orange-700">Monitor sales performance</p>
                </motion.button>
              </div>
                </div>

            {/* Recent Activity & Notifications */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-200/50 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Recent Activity</h3>
                  <p className="text-sm text-gray-600">Latest updates and notifications</p>
                </div>
                <div className="p-2 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100">
                  <Bell className="h-5 w-5 text-rose-600" />
                </div>
              </div>
              <div className="space-y-3 flex-1">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => {
                    const iconColor = activity.color || 'blue'
                    return (
                      <motion.div
                        key={activity.id || `activity-${index}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="flex items-start space-x-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
                      >
                        <div className={`p-1.5 rounded-lg ${
                          iconColor === 'green' ? 'bg-emerald-100' :
                          iconColor === 'red' ? 'bg-red-100' :
                          iconColor === 'blue' ? 'bg-blue-100' :
                          iconColor === 'purple' ? 'bg-purple-100' :
                          'bg-gray-100'
                        }`}>
                          {getActivityIcon(activity.icon || 'activity', iconColor)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900">{activity.title}</h4>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{activity.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.time)}</p>
                        </div>
                      </motion.div>
                    )
                  })
                ) : (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    <div className="text-center">
                      <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No recent activities</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          </div>
        </div>
    </div>
  )
}

export default Admin_dashboard
