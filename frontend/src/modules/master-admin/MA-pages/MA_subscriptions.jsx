import React, { useState, useEffect } from 'react'
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
  DollarSign,
  Trash2,
  X
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog'
import { masterAdminSubscriptionService, masterAdminCompanyService, masterAdminPlanService } from '../MA-services'
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

const MA_subscriptions = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('subscriptions')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [subscriptions, setSubscriptions] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    revenue: 0
  })
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [companies, setCompanies] = useState([])
  const [formData, setFormData] = useState({
    company: '',
    plan: 'Starter',
    amount: '',
    users: '',
    billingCycle: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    autoRenew: true,
    notes: ''
  })

  // Plans Management state
  const [plans, setPlans] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false)
  const [isPlanSubmitting, setIsPlanSubmitting] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [planFormData, setPlanFormData] = useState({
    name: '',
    statement: '',
    price: '',
    period: '/month',
    includes: [''],
    extras: '',
    popular: false,
    isActive: true,
    order: 0
  })

  // Load subscriptions data
  const loadSubscriptions = async () => {
    setLoading(true)
    try {
      const [subscriptionsRes, statsRes] = await Promise.all([
        masterAdminSubscriptionService.getAllSubscriptions({ 
          search: searchQuery,
          status: filterStatus === 'all' ? undefined : filterStatus
        }),
        masterAdminSubscriptionService.getSubscriptionStatistics()
      ])

      if (subscriptionsRes.success && subscriptionsRes.data.subscriptions) {
        const formattedSubs = subscriptionsRes.data.subscriptions.map(sub => ({
          id: sub._id,
          company: sub.company?.name || 'Unknown',
          plan: sub.plan,
          status: sub.status,
          users: sub.users,
          amount: sub.amount,
          nextBilling: new Date(sub.nextBillingDate).toLocaleDateString(),
          startDate: new Date(sub.startDate).toLocaleDateString(),
          email: sub.company?.email || ''
        }))
        setSubscriptions(formattedSubs)
      }

      if (statsRes.success && statsRes.data) {
        setStats({
          total: statsRes.data.total || 0,
          active: statsRes.data.active || 0,
          suspended: statsRes.data.suspended || 0,
          revenue: statsRes.data.totalRevenue || 0
        })
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error)
      toast.error('Failed to load subscriptions', {
        title: 'Error',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  // Load companies for dropdown
  const loadCompanies = async () => {
    try {
      const response = await masterAdminCompanyService.getAllCompanies({ status: 'active' })
      if (response.success && response.data.companies) {
        setCompanies(response.data.companies)
      }
    } catch (error) {
      console.error('Error loading companies:', error)
    }
  }

  useEffect(() => {
    loadSubscriptions()
  }, [filterStatus])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        loadSubscriptions()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Load companies when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      loadCompanies()
    }
  }, [isDialogOpen])

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
    return matchesSearch
  })

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.company || !formData.plan || !formData.amount || !formData.users) {
      toast.error('Please fill in all required fields', {
        title: 'Validation Error',
        duration: 3000
      })
      return
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0', {
        title: 'Validation Error',
        duration: 3000
      })
      return
    }

    if (parseInt(formData.users) < 1) {
      toast.error('Number of users must be at least 1', {
        title: 'Validation Error',
        duration: 3000
      })
      return
    }

    setIsSubmitting(true)
    try {
      const subscriptionData = {
        company: formData.company,
        plan: formData.plan,
        amount: parseFloat(formData.amount),
        users: parseInt(formData.users),
        billingCycle: formData.billingCycle,
        startDate: formData.startDate,
        autoRenew: formData.autoRenew,
        notes: formData.notes || undefined
      }

      const response = await masterAdminSubscriptionService.createSubscription(subscriptionData)
      
      if (response.success) {
        toast.success('Subscription created successfully', {
          title: 'Success',
          duration: 3000
        })
        setIsDialogOpen(false)
        // Reset form
        setFormData({
          company: '',
          plan: 'Starter',
          amount: '',
          users: '',
          billingCycle: 'monthly',
          startDate: new Date().toISOString().split('T')[0],
          autoRenew: true,
          notes: ''
        })
        // Reload subscriptions
        loadSubscriptions()
      } else {
        toast.error(response.message || 'Failed to create subscription', {
          title: 'Error',
          duration: 4000
        })
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      toast.error(error.message || 'Failed to create subscription', {
        title: 'Error',
        duration: 4000
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle dialog close
  const handleDialogClose = () => {
    if (!isSubmitting) {
      setIsDialogOpen(false)
      // Reset form
      setFormData({
        company: '',
        plan: 'Starter',
        amount: '',
        users: '',
        billingCycle: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        autoRenew: true,
        notes: ''
      })
    }
  }

  // Load plans
  const loadPlans = async () => {
    setLoadingPlans(true)
    try {
      const response = await masterAdminPlanService.getAllPlans()
      if (response.success && response.data.plans) {
        setPlans(response.data.plans)
      }
    } catch (error) {
      console.error('Error loading plans:', error)
      toast.error('Failed to load plans', {
        title: 'Error',
        duration: 4000
      })
    } finally {
      setLoadingPlans(false)
    }
  }

  // Load plans when Plans Management tab is active
  useEffect(() => {
    if (activeTab === 'plans') {
      loadPlans()
    }
  }, [activeTab])

  // Handle plan input change
  const handlePlanInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setPlanFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Handle plan feature input change
  const handlePlanFeatureChange = (index, value) => {
    const newIncludes = [...planFormData.includes]
    newIncludes[index] = value
    setPlanFormData(prev => ({
      ...prev,
      includes: newIncludes
    }))
  }

  // Add plan feature
  const addPlanFeature = () => {
    setPlanFormData(prev => ({
      ...prev,
      includes: [...prev.includes, '']
    }))
  }

  // Remove plan feature
  const removePlanFeature = (index) => {
    const newIncludes = planFormData.includes.filter((_, i) => i !== index)
    setPlanFormData(prev => ({
      ...prev,
      includes: newIncludes.length > 0 ? newIncludes : ['']
    }))
  }

  // Open plan dialog for create
  const handleOpenPlanDialog = () => {
    setEditingPlan(null)
    setPlanFormData({
      name: '',
      statement: '',
      price: '',
      period: '/month',
      includes: [''],
      extras: '',
      popular: false,
      isActive: true,
      order: 0
    })
    setIsPlanDialogOpen(true)
  }

  // Open plan dialog for edit
  const handleEditPlan = (plan) => {
    setEditingPlan(plan)
    setPlanFormData({
      name: plan.name,
      statement: plan.statement,
      price: plan.price.toString(),
      period: plan.period,
      includes: plan.includes && plan.includes.length > 0 ? plan.includes : [''],
      extras: plan.extras || '',
      popular: plan.popular || false,
      isActive: plan.isActive !== undefined ? plan.isActive : true,
      order: plan.order || 0
    })
    setIsPlanDialogOpen(true)
  }

  // Handle plan form submission
  const handlePlanSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!planFormData.name || !planFormData.statement || !planFormData.price) {
      toast.error('Please fill in all required fields', {
        title: 'Validation Error',
        duration: 3000
      })
      return
    }

    if (parseFloat(planFormData.price) <= 0) {
      toast.error('Price must be greater than 0', {
        title: 'Validation Error',
        duration: 3000
      })
      return
    }

    const validIncludes = planFormData.includes.filter(inc => inc.trim() !== '')
    if (validIncludes.length === 0) {
      toast.error('Please add at least one feature', {
        title: 'Validation Error',
        duration: 3000
      })
      return
    }

    setIsPlanSubmitting(true)
    try {
      const planData = {
        name: planFormData.name.trim(),
        statement: planFormData.statement.trim(),
        price: parseFloat(planFormData.price),
        period: planFormData.period,
        includes: validIncludes,
        extras: planFormData.extras.trim() || '',
        popular: planFormData.popular,
        isActive: planFormData.isActive,
        order: parseInt(planFormData.order) || 0
      }

      let response
      if (editingPlan) {
        response = await masterAdminPlanService.updatePlan(editingPlan._id, planData)
      } else {
        response = await masterAdminPlanService.createPlan(planData)
      }
      
      if (response.success) {
        toast.success(`Plan ${editingPlan ? 'updated' : 'created'} successfully`, {
          title: 'Success',
          duration: 3000
        })
        setIsPlanDialogOpen(false)
        loadPlans()
      } else {
        toast.error(response.message || `Failed to ${editingPlan ? 'update' : 'create'} plan`, {
          title: 'Error',
          duration: 4000
        })
      }
    } catch (error) {
      console.error('Error saving plan:', error)
      toast.error(error.message || `Failed to ${editingPlan ? 'update' : 'create'} plan`, {
        title: 'Error',
        duration: 4000
      })
    } finally {
      setIsPlanSubmitting(false)
    }
  }

  // Handle plan delete
  const handleDeletePlan = async (plan) => {
    if (!window.confirm(`Are you sure you want to delete the plan "${plan.name}"?`)) {
      return
    }

    try {
      const response = await masterAdminPlanService.deletePlan(plan._id)
      if (response.success) {
        toast.success('Plan deleted successfully', {
          title: 'Success',
          duration: 3000
        })
        loadPlans()
      } else {
        toast.error(response.message || 'Failed to delete plan', {
          title: 'Error',
          duration: 4000
        })
      }
    } catch (error) {
      console.error('Error deleting plan:', error)
      toast.error(error.message || 'Failed to delete plan', {
        title: 'Error',
        duration: 4000
      })
    }
  }

  // Handle plan dialog close
  const handlePlanDialogClose = () => {
    if (!isPlanSubmitting) {
      setIsPlanDialogOpen(false)
      setEditingPlan(null)
      setPlanFormData({
        name: '',
        statement: '',
        price: '',
        period: '/month',
        includes: [''],
        extras: '',
        popular: false,
        isActive: true,
        order: 0
      })
    }
  }

  return (
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
                  Manage all platform subscriptions, billing, and subscription plans
                </p>
              </div>
              <div className="flex gap-3">
                {activeTab === 'subscriptions' ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={loadSubscriptions}
                      disabled={loading}
                      className="border-teal-200 bg-white text-teal-600 hover:bg-teal-50">
                      <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button
                      onClick={() => setIsDialogOpen(true)}
                      className="bg-teal-500 text-white hover:bg-teal-600">
                      <Plus className="mr-2 h-4 w-4" />
                      New Subscription
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={loadPlans}
                      disabled={loadingPlans}
                      className="border-teal-200 bg-white text-teal-600 hover:bg-teal-50">
                      <RefreshCw className={`mr-2 h-4 w-4 ${loadingPlans ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button
                      onClick={handleOpenPlanDialog}
                      disabled={plans.length >= 3}
                      className="bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed">
                      <Plus className="mr-2 h-4 w-4" />
                      New Plan
                    </Button>
                    {plans.length >= 3 && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="text-red-500">⚠</span>
                        Maximum 3 plans limit reached
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Tabs Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('subscriptions')}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'subscriptions'
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}>
                  <CreditCard className="h-4 w-4" />
                  <span>Subscriptions</span>
                </button>
                <button
                  onClick={() => setActiveTab('plans')}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'plans'
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}>
                  <Building2 className="h-4 w-4" />
                  <span>Plans Management</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Subscriptions Tab Content */}
          {activeTab === 'subscriptions' && (
            <>
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
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="py-12 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <RefreshCw className="h-5 w-5 animate-spin text-teal-600" />
                              <span className="text-slate-600">Loading subscriptions...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredSubscriptions.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-12 text-center">
                            <CreditCard className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                            <p className="text-lg font-medium text-slate-700">No subscriptions found</p>
                            <p className="text-sm text-slate-500 mt-2">Try adjusting your filters or add a new subscription</p>
                          </td>
                        </tr>
                      ) : (
                        filteredSubscriptions.map((subscription) => (
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
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          </>
          )}

          {/* Plans Management Tab Content */}
          {activeTab === 'plans' && (
            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}>
              <Card className="border-teal-100 bg-white shadow-sm">
                <CardHeader className="border-b border-teal-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-semibold text-slate-900">
                        Subscription Plans ({plans.length}/3)
                      </CardTitle>
                      <p className="text-xs text-slate-500 mt-1">
                        Maximum of 3 plans allowed. Delete an existing plan to add a new one.
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {loadingPlans ? (
                    <div className="py-12 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <RefreshCw className="h-5 w-5 animate-spin text-teal-600" />
                        <span className="text-slate-600">Loading plans...</span>
                      </div>
                    </div>
                  ) : plans.length === 0 ? (
                    <div className="py-12 text-center">
                      <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-slate-700">No plans found</p>
                      <p className="text-sm text-slate-500 mt-2">Create your first subscription plan to get started</p>
                    </div>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {plans.map((plan) => (
                        <div
                          key={plan._id}
                          className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${
                            plan.popular
                              ? 'border-teal-400 bg-gradient-to-br from-white via-teal-50/20 to-white shadow-xl shadow-teal-200/50 ring-2 ring-teal-400/20'
                              : 'border-teal-100 bg-white shadow-lg shadow-teal-100/50 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-100/70'
                          } ${!plan.isActive ? 'opacity-60' : ''}`}>
                          {/* Popular badge */}
                          {plan.popular && (
                            <div className="absolute right-0 top-0 z-10">
                              <div className="absolute -right-10 top-3 w-28 rotate-45 bg-teal-500 py-0.5 text-center text-[10px] font-bold text-white shadow-lg">
                                POPULAR
                              </div>
                            </div>
                          )}

                          <div className="relative z-10 p-6">
                            {/* Plan name and badge */}
                            <div className="mb-4">
                              <span className={`inline-block rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                plan.popular
                                  ? 'bg-teal-500 text-white'
                                  : 'bg-teal-100 text-teal-700'
                              }`}>
                                {plan.name}
                              </span>
                              {!plan.isActive && (
                                <span className="ml-2 text-xs font-semibold text-red-600">Inactive</span>
                              )}
                              <h3 className="mt-3 text-lg font-semibold text-slate-900">{plan.statement}</h3>
                            </div>

                            {/* Pricing */}
                            <div className="mb-4 border-b border-slate-200 pb-4">
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-teal-600">₹{plan.price.toLocaleString()}</span>
                                <span className="text-base text-slate-600">{plan.period}</span>
                              </div>
                              {plan.extras && (
                                <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                                  {plan.extras}
                                </p>
                              )}
                            </div>

                            {/* Features list */}
                            <div className="mb-4 space-y-2 min-h-[120px]">
                              {plan.includes && plan.includes.length > 0 ? (
                                plan.includes.map((item, idx) => (
                                  <div key={idx} className="flex items-start gap-2">
                                    <CheckCircle2 className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                                      plan.popular ? 'text-teal-500' : 'text-teal-400'
                                    }`} />
                                    <span className="text-xs text-slate-600 leading-relaxed">{item}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-slate-400">No features listed</p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPlan(plan)}
                                className="flex-1 text-teal-600 hover:text-teal-700 hover:bg-teal-50">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePlan(plan)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* New Subscription Dialog */}
          <Dialog open={isDialogOpen}>
            <DialogContent onClose={handleDialogClose} className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-slate-900">
                  Create New Subscription
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  Fill in the details below to create a new subscription for a company.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Company Selection */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Company <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-md border border-teal-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select a company</option>
                      {companies.map((company) => (
                        <option key={company._id} value={company._id}>
                          {company.name} {company.email ? `(${company.email})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Plan Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Plan <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="plan"
                      value={formData.plan}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-md border border-teal-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="Starter">Starter</option>
                      <option value="Professional">Professional</option>
                      <option value="Premium">Premium</option>
                    </select>
                  </div>

                  {/* Billing Cycle */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Billing Cycle
                    </label>
                    <select
                      name="billingCycle"
                      value={formData.billingCycle}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-teal-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Amount (INR) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>

                  {/* Number of Users */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Number of Users <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      name="users"
                      value={formData.users}
                      onChange={handleInputChange}
                      required
                      min="1"
                      placeholder="1"
                      className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>

                  {/* Auto Renew */}
                  <div className="sm:col-span-2 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="autoRenew"
                      id="autoRenew"
                      checked={formData.autoRenew}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-teal-300 text-teal-600 focus:ring-teal-500"
                    />
                    <label htmlFor="autoRenew" className="text-sm font-medium text-slate-700">
                      Auto Renew
                    </label>
                  </div>

                  {/* Notes */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      maxLength={1000}
                      placeholder="Add any additional notes about this subscription..."
                      className="w-full rounded-md border border-teal-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      {formData.notes.length}/1000 characters
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDialogClose}
                    disabled={isSubmitting}
                    className="border-teal-200 text-teal-600 hover:bg-teal-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-teal-500 text-white hover:bg-teal-600"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Subscription
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Plan Dialog */}
          <Dialog open={isPlanDialogOpen}>
            <DialogContent onClose={handlePlanDialogClose} className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-slate-900">
                  {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  {editingPlan ? 'Update the plan details below.' : 'Fill in the details below to create a new subscription plan.'}
                  {!editingPlan && plans.length >= 3 && (
                    <span className="block mt-2 text-red-600 font-medium">
                      ⚠ Maximum limit of 3 plans reached. Delete an existing plan to create a new one.
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handlePlanSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Plan Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Plan Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="name"
                      value={planFormData.name}
                      onChange={handlePlanInputChange}
                      required
                      placeholder="e.g., Starter, Professional"
                      className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Price (INR) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      name="price"
                      value={planFormData.price}
                      onChange={handlePlanInputChange}
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>

                  {/* Period */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Billing Period
                    </label>
                    <select
                      name="period"
                      value={planFormData.period}
                      onChange={handlePlanInputChange}
                      className="w-full rounded-md border border-teal-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="/month">/month</option>
                      <option value="/quarter">/quarter</option>
                      <option value="/year">/year</option>
                    </select>
                  </div>

                  {/* Order */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Display Order
                    </label>
                    <Input
                      type="number"
                      name="order"
                      value={planFormData.order}
                      onChange={handlePlanInputChange}
                      min="0"
                      placeholder="0"
                      className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>

                  {/* Statement */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description/Statement <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="statement"
                      value={planFormData.statement}
                      onChange={handlePlanInputChange}
                      required
                      placeholder="e.g., Perfect for small teams getting started with CRM"
                      className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>

                  {/* Extras */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Extras/Badge Text
                    </label>
                    <Input
                      type="text"
                      name="extras"
                      value={planFormData.extras}
                      onChange={handlePlanInputChange}
                      placeholder="e.g., Best for startups, Most popular"
                      className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>

                  {/* Features */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Features <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {planFormData.includes.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            type="text"
                            value={feature}
                            onChange={(e) => handlePlanFeatureChange(index, e.target.value)}
                            placeholder={`Feature ${index + 1}`}
                            className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                          />
                          {planFormData.includes.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePlanFeature(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addPlanFeature}
                        className="border-teal-200 text-teal-600 hover:bg-teal-50">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Feature
                      </Button>
                    </div>
                  </div>

                  {/* Popular */}
                  <div className="sm:col-span-2 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="popular"
                      id="popular"
                      checked={planFormData.popular}
                      onChange={handlePlanInputChange}
                      className="h-4 w-4 rounded border-teal-300 text-teal-600 focus:ring-teal-500"
                    />
                    <label htmlFor="popular" className="text-sm font-medium text-slate-700">
                      Mark as Popular
                    </label>
                  </div>

                  {/* Active */}
                  <div className="sm:col-span-2 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      id="isActive"
                      checked={planFormData.isActive}
                      onChange={handlePlanInputChange}
                      className="h-4 w-4 rounded border-teal-300 text-teal-600 focus:ring-teal-500"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                      Active (visible on pricing page)
                    </label>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePlanDialogClose}
                    disabled={isPlanSubmitting}
                    className="border-teal-200 text-teal-600 hover:bg-teal-50">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPlanSubmitting || (!editingPlan && plans.length >= 3)}
                    className="bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isPlanSubmitting ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        {editingPlan ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        {editingPlan ? 'Update Plan' : 'Create Plan'}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
  )
}

export default MA_subscriptions

