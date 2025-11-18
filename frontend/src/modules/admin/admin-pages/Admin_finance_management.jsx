import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Admin_navbar from '../admin-components/Admin_navbar'
import Admin_sidebar from '../admin-components/Admin_sidebar'
import Loading from '../../../components/ui/loading'
import { adminFinanceService } from '../admin-services/adminFinanceService'
import { useToast } from '../../../contexts/ToastContext'
import { 
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiCreditCard,
  FiFileText,
  FiUsers,
  FiCalendar,
  FiSearch,
  FiFilter,
  FiPlus,
  FiEdit,
  FiEye,
  FiTrash2,
  FiRefreshCw,
  FiBarChart,
  FiPieChart,
  FiActivity,
  FiTarget,
  FiAward,
  FiHome,
  FiX,
  FiClock,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiDownload
} from 'react-icons/fi'

const Admin_finance_management = () => {
  const { toast } = useToast()
  
  // State management
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('transactions')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [timeFilter, setTimeFilter] = useState('all')
  const [isTimeFilterOpen, setIsTimeFilterOpen] = useState(false)
  const [error, setError] = useState(null)
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [showAccountViewModal, setShowAccountViewModal] = useState(false)
  const [showAccountEditModal, setShowAccountEditModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [showBudgetViewModal, setShowBudgetViewModal] = useState(false)
  const [showBudgetEditModal, setShowBudgetEditModal] = useState(false)
  const [showBudgetSpendModal, setShowBudgetSpendModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [accountFormData, setAccountFormData] = useState({
    accountName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    accountType: 'current',
    isActive: true,
    description: ''
  })

  // Form data for different tabs
  const [transactionFormData, setTransactionFormData] = useState({
    type: 'incoming',
    category: '',
    amount: '',
    date: '',
    account: '',
    description: ''
  })

  // Accounts state
  const [accounts, setAccounts] = useState([])
  const [accountsLoading, setAccountsLoading] = useState(false)

  const [budgetFormData, setBudgetFormData] = useState({
    name: '',
    category: '',
    allocated: '',
    startDate: '',
    endDate: '',
    description: ''
  })


  const [expenseFormData, setExpenseFormData] = useState({
    category: '',
    amount: '',
    date: '',
    description: ''
  })

  const [budgetSpendFormData, setBudgetSpendFormData] = useState({
    amount: '',
    date: '',
    description: ''
  })

  // Finance statistics state - fetched from API
  const [statistics, setStatistics] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    pendingPayments: 0,
    activeProjects: 0,
    totalClients: 0,
    totalSales: 0,
    todayEarnings: 0,
    rewardMoney: 0,
    employeeSalary: 0,
    otherExpenses: 0,
    profitLoss: 0,
    revenueChange: '0',
    expensesChange: '0',
    profitChange: '0',
    // New breakdown fields
    revenueBreakdown: {
      paymentRevenue: 0,
      projectAdvanceRevenue: 0,
      projectInstallmentRevenue: 0,
      paymentReceiptRevenue: 0,
      transactionRevenue: 0
    },
    expenseBreakdown: {
      salaryExpenses: 0,
      recurringExpenses: 0,
      monthlyRecurringExpenses: {},
      projectExpenses: 0,
      incentiveExpenses: 0,
      rewardExpenses: 0,
      otherExpenses: 0
    },
    pendingAmounts: {
      pendingSalaries: 0,
      pendingRecurringExpenses: 0,
      pendingProjectOutstanding: 0,
      totalPendingReceivables: 0,
      totalPendingPayables: 0
    },
    todayExpenses: 0,
    todayProfit: 0,
    profitMargin: '0'
  })
  const [statisticsLoading, setStatisticsLoading] = useState(false)
  const [showAllStats, setShowAllStats] = useState(false)

  // Fetch finance statistics from API
  const fetchFinanceStatistics = async () => {
    try {
      setStatisticsLoading(true)
      const response = await adminFinanceService.getFinanceStatistics(timeFilter)
      
      if (response && response.success && response.data) {
        setStatistics({
          totalRevenue: response.data.totalRevenue || 0,
          totalExpenses: response.data.totalExpenses || 0,
          netProfit: response.data.netProfit || 0,
          pendingPayments: response.data.pendingPayments || 0,
          activeProjects: response.data.activeProjects || 0,
          totalClients: response.data.totalClients || 0,
          totalSales: response.data.totalSales || 0,
          todayEarnings: response.data.todayEarnings || 0,
          rewardMoney: response.data.rewardMoney || 0,
          employeeSalary: response.data.employeeSalary || 0,
          otherExpenses: response.data.otherExpenses || 0,
          profitLoss: response.data.profitLoss || 0,
          revenueChange: response.data.revenueChange || '0',
          expensesChange: response.data.expensesChange || '0',
          profitChange: response.data.profitChange || '0',
          // New breakdown fields
          revenueBreakdown: response.data.revenueBreakdown || {
            paymentRevenue: 0,
            projectAdvanceRevenue: 0,
            projectInstallmentRevenue: 0,
            paymentReceiptRevenue: 0,
            transactionRevenue: 0
          },
          expenseBreakdown: {
            salaryExpenses: response.data.expenseBreakdown?.salaryExpenses || 0,
            recurringExpenses: response.data.expenseBreakdown?.recurringExpenses || 0,
            monthlyRecurringExpenses: response.data.expenseBreakdown?.monthlyRecurringExpenses || {},
            projectExpenses: response.data.expenseBreakdown?.projectExpenses || 0,
            incentiveExpenses: response.data.expenseBreakdown?.incentiveExpenses || 0,
            rewardExpenses: response.data.expenseBreakdown?.rewardExpenses || 0,
            otherExpenses: response.data.expenseBreakdown?.otherExpenses || 0
          },
          pendingAmounts: response.data.pendingAmounts || {
            pendingSalaries: 0,
            pendingRecurringExpenses: 0,
            pendingProjectOutstanding: 0,
            totalPendingReceivables: 0,
            totalPendingPayables: 0
          },
          todayExpenses: response.data.todayExpenses || 0,
          todayProfit: response.data.todayProfit || 0,
          profitMargin: response.data.profitMargin || '0'
        })
      }
    } catch (err) {
      console.error('Error fetching finance statistics:', err)
      toast.error('Failed to load finance statistics')
    } finally {
      setStatisticsLoading(false)
    }
  }

  // Fetch statistics when component mounts or time filter changes
  useEffect(() => {
    fetchFinanceStatistics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter])

  // Time-based statistics (now using real API data)
  const getTimeBasedStats = () => {
    return {
      todayEarnings: statistics.todayEarnings,
      rewardMoney: statistics.expenseBreakdown?.rewardExpenses || 0, // Use paid reward expenses from breakdown
      employeeSalary: statistics.employeeSalary,
      otherExpenses: statistics.otherExpenses,
      profitLoss: statistics.profitLoss
    }
  }

  // Transactions state - fetched from API
  const [transactions, setTransactions] = useState([])
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [transactionsTotal, setTransactionsTotal] = useState(0)
  const [transactionsPages, setTransactionsPages] = useState(1)

  // Budgets state - fetched from API
  const [budgets, setBudgets] = useState([])
  const [budgetsLoading, setBudgetsLoading] = useState(false)
  const [budgetsTotal, setBudgetsTotal] = useState(0)
  const [budgetsPages, setBudgetsPages] = useState(1)


  // Expenses state - fetched from API
  const [expenses, setExpenses] = useState([])
  const [expensesLoading, setExpensesLoading] = useState(false)
  const [expensesTotal, setExpensesTotal] = useState(0)
  const [expensesPages, setExpensesPages] = useState(1)

  // Project Expenses state
  const [projectExpenses, setProjectExpenses] = useState([])
  const [projectExpensesLoading, setProjectExpensesLoading] = useState(false)
  const [projectExpensesTotal, setProjectExpensesTotal] = useState(0)
  const [projectExpensesPages, setProjectExpensesPages] = useState(1)
  const [projectExpenseFormData, setProjectExpenseFormData] = useState({
    projectId: '',
    name: '',
    category: '',
    amount: '',
    vendor: '',
    paymentMethod: 'Bank Transfer',
    expenseDate: new Date().toISOString().split('T')[0],
    description: ''
  })
  const [showProjectExpenseModal, setShowProjectExpenseModal] = useState(false)
  const [projectExpenseModalMode, setProjectExpenseModalMode] = useState('create') // 'create' or 'edit' or 'view'
  const [selectedProjectExpense, setSelectedProjectExpense] = useState(null)
  const [showDeleteProjectExpenseModal, setShowDeleteProjectExpenseModal] = useState(false)
  const [projectExpenseToDelete, setProjectExpenseToDelete] = useState(null)
  const [projectsList, setProjectsList] = useState([])

  // Fetch accounts from API
  const fetchAccounts = async () => {
    try {
      setAccountsLoading(true)
      const response = await adminFinanceService.getAccounts({ isActive: 'true' })
      if (response.success && response.data) {
        setAccounts(response.data)
      }
    } catch (err) {
      console.error('Error fetching accounts:', err)
      toast.error('Failed to load accounts')
    } finally {
      setAccountsLoading(false)
    }
  }

  // Fetch expenses from API
  const fetchExpenses = async () => {
    try {
      setExpensesLoading(true)
      setError(null)
      
      const params = {
        page: currentPage,
        limit: itemsPerPage
      }
      
      // Add filters
      if (selectedFilter !== 'all') {
        params.status = selectedFilter
      }
      if (searchTerm) {
        params.search = searchTerm
      }
      
      const response = await adminFinanceService.getExpenses(params)
      
      if (response.success && response.data) {
        setExpenses(response.data)
        setExpensesTotal(response.total || response.data.length)
        setExpensesPages(response.pages || 1)
      }
    } catch (err) {
      console.error('Error fetching expenses:', err)
      setError(err.message || 'Failed to fetch expenses')
      toast.error('Failed to load expenses')
    } finally {
      setExpensesLoading(false)
      setLoading(false)
    }
  }

  // Fetch project expenses from API
  const fetchProjectExpenses = async () => {
    try {
      setProjectExpensesLoading(true)
      setError(null)
      
      const params = {
        page: currentPage,
        limit: itemsPerPage
      }
      
      // Add filters
      if (selectedFilter !== 'all') {
        params.category = selectedFilter
      }
      if (searchTerm) {
        params.search = searchTerm
      }
      
      const response = await adminFinanceService.getProjectExpenses(params)
      
      if (response && response.success) {
        const expensesData = response.data || []
        setProjectExpenses(expensesData)
        setProjectExpensesTotal(response.total || expensesData.length || 0)
        setProjectExpensesPages(response.pages || Math.ceil((response.total || expensesData.length) / parseInt(itemsPerPage)) || 1)
      } else {
        console.error('Failed to fetch project expenses - response:', response)
        setProjectExpenses([])
        setProjectExpensesTotal(0)
        setProjectExpensesPages(1)
      }
    } catch (err) {
      console.error('Error fetching project expenses:', err)
      setError(err.message || 'Failed to fetch project expenses')
      toast.error('Failed to load project expenses')
    } finally {
      setProjectExpensesLoading(false)
      setLoading(false)
    }
  }

  // Fetch projects list for dropdown
  const fetchProjectsList = async () => {
    try {
      // Import adminProjectService dynamically to avoid circular dependencies
      const { adminProjectService } = await import('../admin-services/adminProjectService')
      const response = await adminProjectService.getActiveProjects({ limit: 1000 })
      if (response.success && response.data) {
        setProjectsList(response.data.map(project => {
          // Extract client name - prefer companyName, then name
          let clientName = null
          if (project.client) {
            if (typeof project.client === 'object') {
              clientName = project.client.companyName || project.client.name || null
            } else if (typeof project.client === 'string') {
              clientName = project.client
            }
          }
          
          return {
            value: project._id || project.id,
            label: project.name || 'Unnamed Project',
            client: project.client || null,
            clientName: clientName
          }
        }))
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
      toast.error('Failed to load projects')
    }
  }

  // Handle project selection change to auto-fill vendor
  const handleProjectChange = async (projectId) => {
    setProjectExpenseFormData(prev => ({...prev, projectId}))
    
    // Find the selected project and auto-fill vendor with client name
    const selectedProject = projectsList.find(p => p.value === projectId)
    if (selectedProject && selectedProject.clientName) {
      setProjectExpenseFormData(prev => ({
        ...prev,
        projectId,
        vendor: selectedProject.clientName
      }))
    } else if (projectId) {
      // If client info not in list, fetch project details
      try {
        const { adminProjectService } = await import('../admin-services/adminProjectService')
        const response = await adminProjectService.getProjectById(projectId)
        if (response.success && response.data) {
          const project = response.data
          // Extract client name - prefer companyName, then name
          let clientName = null
          if (project.client) {
            if (typeof project.client === 'object') {
              clientName = project.client.companyName || project.client.name || null
            } else if (typeof project.client === 'string') {
              clientName = project.client
            }
          }
          
          if (clientName) {
            setProjectExpenseFormData(prev => ({
              ...prev,
              projectId,
              vendor: clientName
            }))
          }
        }
      } catch (err) {
        console.error('Error fetching project details:', err)
      }
    }
  }

  // Fetch budgets from API
  const fetchBudgets = async () => {
    try {
      setBudgetsLoading(true)
      setError(null)
      
      const params = {
        page: currentPage,
        limit: itemsPerPage
      }
      
      // Add filters
      if (selectedFilter !== 'all') {
        params.status = selectedFilter
      }
      if (searchTerm) {
        params.search = searchTerm
      }
      
      const response = await adminFinanceService.getBudgets(params)
      
      if (response.success && response.data) {
        // Map backend fields to frontend fields
        const mappedBudgets = response.data.map(budget => ({
          ...budget,
          id: budget._id || budget.id,
          name: budget.budgetName || budget.name,
          category: budget.budgetCategory || budget.category,
          allocated: budget.allocatedAmount || budget.allocated,
          spent: budget.spentAmount || budget.spent || 0,
          remaining: budget.remainingAmount || budget.remaining,
          startDate: budget.startDate ? new Date(budget.startDate).toISOString().split('T')[0] : budget.startDate,
          endDate: budget.endDate ? new Date(budget.endDate).toISOString().split('T')[0] : budget.endDate,
          projects: budget.budgetProjects || budget.projects || []
        }))
        setBudgets(mappedBudgets)
        setBudgetsTotal(response.total || response.data.length)
        setBudgetsPages(response.pages || 1)
      }
    } catch (err) {
      console.error('Error fetching budgets:', err)
      setError(err.message || 'Failed to fetch budgets')
      toast.error('Failed to load budgets')
    } finally {
      setBudgetsLoading(false)
      setLoading(false)
    }
  }

  // Fetch transactions from API
  const fetchTransactions = async () => {
    try {
      setTransactionsLoading(true)
      setError(null)
      
      const params = {
        page: currentPage,
        limit: itemsPerPage
      }
      
      // Add filters
      if (transactionTypeFilter !== 'all') {
        params.type = transactionTypeFilter
      }
      if (selectedFilter !== 'all') {
        params.status = selectedFilter
      }
      if (searchTerm) {
        params.search = searchTerm
      }
      
      const response = await adminFinanceService.getTransactions(params)
      
      if (response.success && response.data) {
        setTransactions(response.data)
        setTransactionsTotal(response.total || response.data.length)
        setTransactionsPages(response.pages || Math.ceil((response.total || response.data.length) / itemsPerPage))
      }
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setError(err.message || 'Failed to fetch transactions')
      toast.error('Failed to load transactions')
    } finally {
      setTransactionsLoading(false)
      setLoading(false)
    }
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    if (activeTab === 'transactions' || activeTab === 'expenses' || activeTab === 'budgets' || activeTab === 'project-expenses') {
      setCurrentPage(1)
    }
  }, [transactionTypeFilter, selectedFilter, searchTerm, activeTab, itemsPerPage])

  // Load transactions when component mounts or filters change
  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions()
      fetchAccounts() // Fetch accounts when transactions tab is active
    } else if (activeTab === 'expenses') {
      fetchExpenses()
    } else if (activeTab === 'budgets') {
      fetchBudgets()
    } else if (activeTab === 'project-expenses') {
      fetchProjectExpenses()
      fetchProjectsList() // Fetch projects list for dropdown
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage, transactionTypeFilter, selectedFilter, searchTerm, itemsPerPage])

  // Fetch accounts when component mounts
  useEffect(() => {
    fetchAccounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  // Helper functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'active':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type) => {
    return type === 'incoming' ? 'text-green-600' : 'text-red-600'
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Project Expense CRUD Handlers
  const handleCreateProjectExpense = () => {
    setProjectExpenseFormData({
      projectId: '',
      name: '',
      category: '',
      amount: '',
      vendor: '',
      paymentMethod: 'Bank Transfer',
      expenseDate: new Date().toISOString().split('T')[0],
      description: ''
    })
    setProjectExpenseModalMode('create')
    setSelectedProjectExpense(null)
    setShowProjectExpenseModal(true)
  }

  const handleEditProjectExpense = (expense) => {
    setProjectExpenseFormData({
      projectId: expense.project?._id || expense.projectId || '',
      name: expense.name || '',
      category: expense.category || '',
      amount: expense.amount || '',
      vendor: expense.vendor || '',
      paymentMethod: expense.paymentMethod || 'Bank Transfer',
      expenseDate: expense.expenseDate ? new Date(expense.expenseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      description: expense.description || ''
    })
    setProjectExpenseModalMode('edit')
    setSelectedProjectExpense(expense)
    setShowProjectExpenseModal(true)
  }

  const handleViewProjectExpense = (expense) => {
    setProjectExpenseFormData({
      projectId: expense.project?._id || expense.projectId || '',
      name: expense.name || '',
      category: expense.category || '',
      amount: expense.amount || '',
      vendor: expense.vendor || '',
      paymentMethod: expense.paymentMethod || 'Bank Transfer',
      expenseDate: expense.expenseDate ? new Date(expense.expenseDate).toISOString().split('T')[0] : '',
      description: expense.description || ''
    })
    setProjectExpenseModalMode('view')
    setSelectedProjectExpense(expense)
    setShowProjectExpenseModal(true)
  }

  const handleDeleteProjectExpense = (expense) => {
    setProjectExpenseToDelete(expense)
    setShowDeleteProjectExpenseModal(true)
  }

  const confirmDeleteProjectExpense = async () => {
    if (!projectExpenseToDelete) return

    try {
      const expenseId = projectExpenseToDelete._id || projectExpenseToDelete.id
      const response = await adminFinanceService.deleteProjectExpense(expenseId)
      if (response.success) {
        toast.success('Project expense deleted successfully')
        setShowDeleteProjectExpenseModal(false)
        setProjectExpenseToDelete(null)
        await fetchProjectExpenses()
        fetchFinanceStatistics() // Refresh statistics
      } else {
        toast.error(response.message || 'Failed to delete project expense')
      }
    } catch (err) {
      console.error('Error deleting project expense:', err)
      toast.error(err.message || 'Failed to delete project expense')
    }
  }

  const handleSaveProjectExpense = async () => {
    // Validation
    if (!projectExpenseFormData.projectId || !projectExpenseFormData.name || 
        !projectExpenseFormData.category || !projectExpenseFormData.amount || 
        !projectExpenseFormData.expenseDate) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      let response
      if (projectExpenseModalMode === 'create') {
        response = await adminFinanceService.createProjectExpense(projectExpenseFormData)
      } else {
        response = await adminFinanceService.updateProjectExpense(
          selectedProjectExpense._id || selectedProjectExpense.id,
          projectExpenseFormData
        )
      }

      if (response.success) {
        toast.success(`Project expense ${projectExpenseModalMode === 'create' ? 'created' : 'updated'} successfully`)
        setShowProjectExpenseModal(false)
        // Reset form
        setProjectExpenseFormData({
          projectId: '',
          name: '',
          category: '',
          amount: '',
          vendor: '',
          paymentMethod: 'Bank Transfer',
          expenseDate: new Date().toISOString().split('T')[0],
          description: ''
        })
        setSelectedProjectExpense(null)
        // Always refresh project expenses data after create/update
        await fetchProjectExpenses()
        fetchFinanceStatistics() // Refresh statistics
      } else {
        toast.error(response.message || `Failed to ${projectExpenseModalMode === 'create' ? 'create' : 'update'} project expense`)
      }
    } catch (err) {
      console.error(`Error ${projectExpenseModalMode === 'create' ? 'creating' : 'updating'} project expense:`, err)
      toast.error(err.message || `Failed to ${projectExpenseModalMode === 'create' ? 'create' : 'update'} project expense`)
    }
  }

  // Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'transactions':
        return transactions.map(t => ({
          ...t,
          id: t._id || t.id,
          type: t.transactionType || t.type,
          date: t.transactionDate || t.date || t.createdAt
        }))
      case 'budgets':
        return budgets.map(b => ({
          ...b,
          id: b._id || b.id
        }))
      case 'expenses':
        return expenses.map(e => ({
          ...e,
          id: e._id || e.id,
          date: e.transactionDate || e.date || e.createdAt
        }))
      case 'project-expenses':
        return projectExpenses.map(e => ({
          ...e,
          id: e._id || e.id,
          date: e.expenseDate || e.createdAt
        }))
      case 'accounts':
        return accounts.map(a => ({
          ...a,
          id: a._id || a.id
        }))
      default:
        return transactions
    }
  }

  // Filter data based on search and filter criteria
  // Note: Transactions, expenses, and budgets are filtered on the backend, so we skip client-side filtering for them
  const filteredData = useMemo(() => {
    const data = getCurrentData()
    
    // For transactions, expenses, budgets, and project-expenses, backend handles filtering, so return data as-is
    if (activeTab === 'transactions' || activeTab === 'expenses' || activeTab === 'budgets' || activeTab === 'project-expenses') {
      return data
    }
    
    // For other tabs (still using mock data), apply client-side filtering
    return data.filter(item => {
      const matchesSearch = Object.values(item).some(value =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
      
      let matchesFilter = true
      if (selectedFilter !== 'all') {
        if (activeTab === 'accounts') {
          matchesFilter = item.isActive === (selectedFilter === 'active')
        }
      }
      
      return matchesSearch && matchesFilter
    })
  }, [activeTab, searchTerm, selectedFilter, transactionTypeFilter, transactions, expenses, budgets, projectExpenses])

  // Pagination
  const paginatedData = useMemo(() => {
    // For transactions, expenses, budgets, and project-expenses, backend handles pagination, so return data as-is
    if (activeTab === 'transactions' || activeTab === 'expenses' || activeTab === 'budgets' || activeTab === 'project-expenses') {
      return filteredData
    }
    // For other tabs, apply client-side pagination
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredData.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredData, currentPage, itemsPerPage, activeTab])

  const totalPages = activeTab === 'transactions' 
    ? transactionsPages 
    : activeTab === 'expenses'
    ? expensesPages
    : activeTab === 'budgets'
    ? budgetsPages
    : activeTab === 'project-expenses'
    ? projectExpensesPages
    : Math.ceil(filteredData.length / itemsPerPage)

  // Management functions
  const handleCreate = () => {
    setSelectedItem(null)
    setShowCreateModal(true)
  }

  const handleEdit = (item) => {
    if (activeTab === 'budgets') {
      handleEditBudget(item)
    } else if (activeTab === 'transactions') {
      handleEditTransaction(item)
    } else {
      setSelectedItem(item)
      setShowEditModal(true)
    }
  }

  const handleView = (item) => {
    if (activeTab === 'budgets') {
      handleViewBudget(item)
    } else if (activeTab === 'transactions') {
      handleViewTransaction(item)
    } else {
      setSelectedItem(item)
      setShowViewModal(true)
    }
  }

  // Transaction-specific handlers
  const handleViewTransaction = (transaction) => {
    setSelectedItem(transaction)
    setShowViewModal(true)
  }

  const handleEditTransaction = async (transaction) => {
    setSelectedItem(transaction)
    
    // Ensure accounts are loaded before opening edit modal
    if (accounts.length === 0) {
      await fetchAccounts()
    }
    
    setTransactionFormData({
      type: transaction.transactionType || transaction.type || 'incoming',
      category: transaction.category || '',
      amount: transaction.amount || '',
      date: transaction.transactionDate || transaction.date || transaction.createdAt ? new Date(transaction.transactionDate || transaction.date || transaction.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      account: transaction.account?._id || transaction.account?.id || transaction.account || '',
      description: transaction.description || ''
    })
    setShowTransactionModal(true)
  }

  // Budget-specific handlers
  const handleViewBudget = (budget) => {
    setSelectedItem(budget)
    setShowBudgetViewModal(true)
  }

  const handleEditBudget = (budget) => {
    setSelectedItem(budget)
    setBudgetFormData({
      name: budget.name || budget.budgetName || '',
      category: budget.category || budget.budgetCategory || '',
      allocated: budget.allocated || budget.allocatedAmount || '',
      startDate: budget.startDate ? (typeof budget.startDate === 'string' ? budget.startDate : new Date(budget.startDate).toISOString().split('T')[0]) : '',
      endDate: budget.endDate ? (typeof budget.endDate === 'string' ? budget.endDate : new Date(budget.endDate).toISOString().split('T')[0]) : '',
      description: budget.description || ''
    })
    setShowBudgetEditModal(true)
  }

  const handleSpendBudget = (budget) => {
    setSelectedItem(budget)
    setBudgetSpendFormData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    })
    setShowBudgetSpendModal(true)
  }

  const handleDelete = (item) => {
    setSelectedItem(item)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (deleteConfirm === 'DELETE') {
      // Handle delete logic here
      console.log('Deleting item:', selectedItem)
      setShowDeleteModal(false)
      setDeleteConfirm('')
      setSelectedItem(null)
    }
  }

  const handleSave = (formData) => {
    // Handle save logic here
    console.log('Saving data:', formData)
    setShowCreateModal(false)
    setShowEditModal(false)
    setSelectedItem(null)
  }

  const closeModals = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setShowViewModal(false)
    setShowDeleteModal(false)
    setShowAccountModal(false)
    setShowAccountViewModal(false)
    setShowAccountEditModal(false)
    setShowTransactionModal(false)
    setShowBudgetModal(false)
    setShowBudgetViewModal(false)
    setShowBudgetEditModal(false)
    setShowBudgetSpendModal(false)
    setShowExpenseModal(false)
    setShowProjectExpenseModal(false)
    setShowDeleteProjectExpenseModal(false)
    setProjectExpenseToDelete(null)
    setSelectedItem(null)
    setDeleteConfirm('')
    setAccountFormData({
      accountName: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branchName: '',
      accountType: 'current',
      isActive: true,
      description: ''
    })
    setTransactionFormData({
      type: 'incoming',
      category: '',
      amount: '',
      date: '',
      account: '',
      description: ''
    })
    setBudgetFormData({
      name: '',
      category: '',
      allocated: '',
      startDate: '',
      endDate: '',
      description: ''
    })
    setExpenseFormData({
      category: '',
      amount: '',
      date: '',
      description: ''
    })
  }

  const handleCreateAccount = () => {
    setAccountFormData({
      accountName: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branchName: '',
      accountType: 'current',
      isActive: true,
      description: ''
    })
    setShowAccountModal(true)
  }

  const handleSaveAccount = async () => {
    if (!accountFormData.accountName || !accountFormData.bankName || !accountFormData.accountNumber) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      const response = await adminFinanceService.createAccount(accountFormData)
      
      if (response && response.success) {
        toast.success(response.message || 'Account created successfully')
        setShowAccountModal(false)
        closeModals()
        // Refresh accounts list
        await fetchAccounts()
      } else {
        toast.error(response?.message || 'Failed to create account')
      }
    } catch (err) {
      console.error('Error creating account:', err)
      toast.error(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleViewAccount = (account) => {
    setSelectedItem(account)
    setShowAccountViewModal(true)
  }

  const handleEditAccount = (account) => {
    setSelectedItem(account)
    setAccountFormData({
      accountName: account.accountName,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      ifscCode: account.ifscCode,
      branchName: account.branchName,
      accountType: account.accountType,
      isActive: account.isActive,
      description: account.description
    })
    setShowAccountEditModal(true)
  }

  const handleUpdateAccount = async () => {
    if (!accountFormData.accountName || !accountFormData.bankName || !accountFormData.accountNumber) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      const accountId = selectedItem._id || selectedItem.id
      const response = await adminFinanceService.updateAccount(accountId, accountFormData)
      
      if (response && response.success) {
        toast.success(response.message || 'Account updated successfully')
        setShowAccountEditModal(false)
        closeModals()
        // Refresh accounts list
        await fetchAccounts()
      } else {
        toast.error(response?.message || 'Failed to update account')
      }
    } catch (err) {
      console.error('Error updating account:', err)
      toast.error(err.message || 'Failed to update account')
    } finally {
      setLoading(false)
    }
  }

  // Handler functions for different tabs
  const handleCreateTransaction = () => {
    setSelectedItem(null)
    setTransactionFormData({
      type: 'incoming',
      category: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      account: '',
      description: ''
    })
    setShowTransactionModal(true)
  }

  const handleCreateBudget = () => {
    setBudgetFormData({
      name: '',
      category: '',
      allocated: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      description: ''
    })
    setShowBudgetModal(true)
  }


  const handleCreateExpense = () => {
    setExpenseFormData({
      category: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    })
    setShowExpenseModal(true)
  }

  const handleSaveTransaction = async () => {
    if (!transactionFormData.category || !transactionFormData.amount || !transactionFormData.date) {
      toast.error('Please fill in all required fields')
      return
    }

    // For incoming transactions, account is required
    if (transactionFormData.type === 'incoming' && !transactionFormData.account) {
      toast.error('Please select an account for incoming transactions')
      return
    }

    try {
      setLoading(true)
      
      const transactionData = {
        type: transactionFormData.type,
        category: transactionFormData.category,
        amount: parseFloat(transactionFormData.amount),
        date: transactionFormData.date,
        description: transactionFormData.description || ''
      }

      // Add account only for incoming transactions
      if (transactionFormData.type === 'incoming' && transactionFormData.account) {
        transactionData.account = transactionFormData.account
      }

      let response
      if (selectedItem && (selectedItem._id || selectedItem.id)) {
        // Update existing transaction
        const transactionId = selectedItem._id || selectedItem.id
        console.log('Updating transaction with data:', transactionData)
        response = await adminFinanceService.updateTransaction(transactionId, transactionData)
        console.log('Transaction update response:', response)
      } else {
        // Create new transaction
        console.log('Creating transaction with data:', transactionData)
        response = await adminFinanceService.createTransaction(transactionData)
        console.log('Transaction creation response:', response)
      }
      
      if (response && response.success) {
        toast.success(response.message || (selectedItem ? 'Transaction updated successfully' : 'Transaction created successfully'))
        setShowTransactionModal(false)
        closeModals()
        // Refresh transactions list
        await fetchTransactions()
        // Refresh statistics
        await fetchFinanceStatistics()
      } else {
        toast.error(response?.message || 'Failed to save transaction')
      }
    } catch (err) {
      console.error('Error saving transaction:', err)
      toast.error(err.message || 'Failed to save transaction')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBudget = async () => {
    if (!budgetFormData.name || !budgetFormData.category || !budgetFormData.allocated || !budgetFormData.startDate || !budgetFormData.endDate) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      
      const budgetData = {
        name: budgetFormData.name,
        category: budgetFormData.category,
        allocated: parseFloat(budgetFormData.allocated),
        startDate: budgetFormData.startDate,
        endDate: budgetFormData.endDate,
        description: budgetFormData.description || ''
      }

      console.log('Creating budget with data:', budgetData)
      const response = await adminFinanceService.createBudget(budgetData)
      console.log('Budget creation response:', response)
      
      if (response && response.success) {
        toast.success(response.message || 'Budget created successfully')
        setShowBudgetModal(false)
        closeModals()
        // Refresh budgets list
        await fetchBudgets()
      } else {
        toast.error(response?.message || 'Failed to create budget')
      }
    } catch (err) {
      console.error('Error creating budget:', err)
      toast.error(err.message || 'Failed to create budget')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBudget = async () => {
    if (!budgetFormData.name || !budgetFormData.category || !budgetFormData.allocated || !budgetFormData.startDate || !budgetFormData.endDate) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!selectedItem || !selectedItem._id && !selectedItem.id) {
      toast.error('Budget not selected')
      return
    }

    try {
      setLoading(true)
      
      const budgetData = {
        name: budgetFormData.name,
        category: budgetFormData.category,
        allocated: parseFloat(budgetFormData.allocated),
        startDate: budgetFormData.startDate,
        endDate: budgetFormData.endDate,
        description: budgetFormData.description || '',
        status: selectedItem.status || 'active'
      }

      const budgetId = selectedItem._id || selectedItem.id
      const response = await adminFinanceService.updateBudget(budgetId, budgetData)
      
      if (response && response.success) {
        toast.success(response.message || 'Budget updated successfully')
        setShowBudgetEditModal(false)
        closeModals()
        // Refresh budgets list
        await fetchBudgets()
      } else {
        toast.error(response?.message || 'Failed to update budget')
      }
    } catch (err) {
      console.error('Error updating budget:', err)
      toast.error(err.message || 'Failed to update budget')
    } finally {
      setLoading(false)
    }
  }

  const handleSpendFromBudget = async () => {
    if (!budgetSpendFormData.amount || !budgetSpendFormData.date) {
      toast.error('Please fill in amount and date')
      return
    }

    if (!selectedItem || !selectedItem._id && !selectedItem.id) {
      toast.error('Budget not selected')
      return
    }

    const spendAmount = parseFloat(budgetSpendFormData.amount)
    if (spendAmount <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }

    try {
      setLoading(true)
      
      // Create an outgoing transaction with the budget's category
      const budgetCategory = selectedItem.category || selectedItem.budgetCategory
      const expenseData = {
        category: budgetCategory,
        amount: spendAmount,
        date: budgetSpendFormData.date,
        description: budgetSpendFormData.description || `Budget spend for ${selectedItem.name || selectedItem.budgetName}`
      }

      // Create the expense (which is an outgoing transaction)
      const expenseResponse = await adminFinanceService.createExpense(expenseData)
      
      if (expenseResponse && expenseResponse.success) {
        toast.success(`₹${spendAmount.toLocaleString()} spent from budget successfully`)
        setShowBudgetSpendModal(false)
        closeModals()
        // Refresh budgets list to update spent amount
        await fetchBudgets()
      } else {
        toast.error(expenseResponse?.message || 'Failed to record budget spend')
      }
    } catch (err) {
      console.error('Error spending from budget:', err)
      toast.error(err.message || 'Failed to record budget spend')
    } finally {
      setLoading(false)
    }
  }


  const handleSaveExpense = async () => {
    if (!expenseFormData.category || !expenseFormData.amount || !expenseFormData.date) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      
      const expenseData = {
        category: expenseFormData.category,
        amount: parseFloat(expenseFormData.amount),
        date: expenseFormData.date,
        description: expenseFormData.description || ''
      }

      console.log('Creating expense with data:', expenseData)
      const response = await adminFinanceService.createExpense(expenseData)
      console.log('Expense creation response:', response)
      
      if (response && response.success) {
        toast.success(response.message || 'Expense created successfully')
        setShowExpenseModal(false)
        closeModals()
        // Refresh expenses list
        await fetchExpenses()
      } else {
        toast.error(response?.message || 'Failed to create expense')
      }
    } catch (err) {
      console.error('Error creating expense:', err)
      toast.error(err.message || 'Failed to create expense')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Admin_navbar />
      
      {/* Sidebar */}
      <Admin_sidebar />
      
      {/* Main Content */}
      <div className="ml-64 pt-20 p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Finance Management
            </h1>
            <p className="text-gray-600">
                  Comprehensive financial oversight and management dashboard
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Time Filter Combobox */}
                <div className="relative">
                  <button
                    onClick={() => setIsTimeFilterOpen(!isTimeFilterOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-gray-400 transition-colors duration-200 shadow-sm text-sm font-medium text-gray-700 min-w-[140px] justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <FiCalendar className="h-4 w-4 text-gray-500" />
                      <span>
                        {timeFilter === 'all' ? 'All Time' : 
                         timeFilter === 'today' ? 'Today' : 
                         timeFilter === 'week' ? 'This Week' : 
                         timeFilter === 'month' ? 'This Month' : 
                         timeFilter === 'year' ? 'This Year' : 'All Time'}
                      </span>
                    </span>
                    <FiChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isTimeFilterOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isTimeFilterOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsTimeFilterOpen(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        {[
                          { value: 'all', label: 'All Time' },
                          { value: 'today', label: 'Today' },
                          { value: 'week', label: 'This Week' },
                          { value: 'month', label: 'This Month' },
                          { value: 'year', label: 'This Year' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setTimeFilter(option.value)
                              setIsTimeFilterOpen(false)
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                              timeFilter === option.value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {timeFilter === option.value && (
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                            )}
                            <span>{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Refresh Button */}
                <button
                  onClick={() => {
                    fetchFinanceStatistics() // Always refresh statistics
                    if (activeTab === 'transactions') {
                      fetchTransactions()
                    } else if (activeTab === 'expenses') {
                      fetchExpenses()
                    } else if (activeTab === 'budgets') {
                      fetchBudgets()
                    }
                  }}
                  disabled={loading || statisticsLoading || (activeTab === 'transactions' && transactionsLoading) || (activeTab === 'expenses' && expensesLoading) || (activeTab === 'budgets' && budgetsLoading)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiRefreshCw className={`text-sm ${(loading || statisticsLoading || transactionsLoading || expensesLoading || budgetsLoading) ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Loading State */}
          {statisticsLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loading size="medium" />
            </div>
          ) : (
          <>
          {/* PRIMARY KPIs - Hero Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5"
          >
            {/* Total Revenue - Hero Card */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-green-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <FiTrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-green-700">Total</p>
                    <p className="text-xs text-green-600">revenue</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-green-700 mb-1">Total Revenue</p>
                  <p className="text-xl font-bold text-green-800 mb-1">{formatCurrency(statistics.totalRevenue)}</p>
                  <p className={`text-xs font-semibold ${parseFloat(statistics.revenueChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {parseFloat(statistics.revenueChange) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(statistics.revenueChange))}%
                  </p>
                </div>
              </div>
            </div>

            {/* Total Expenses - Hero Card */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 to-rose-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-red-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-red-400/20 to-rose-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <FiTrendingDown className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-red-700">Total</p>
                    <p className="text-xs text-red-600">expenses</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-red-700 mb-1">Total Expenses</p>
                  <p className="text-xl font-bold text-red-800 mb-1">{formatCurrency(statistics.totalExpenses)}</p>
                  <p className={`text-xs font-semibold ${parseFloat(statistics.expensesChange) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {parseFloat(statistics.expensesChange) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(statistics.expensesChange))}%
                  </p>
                </div>
              </div>
            </div>

            {/* Net Profit - Hero Card */}
            <div className={`group relative overflow-hidden rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border ${
              statistics.netProfit >= 0 
                ? 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200/50' 
                : 'bg-gradient-to-br from-red-50 to-rose-100 border-red-200/50'
            }`}>
              <div className={`absolute top-0 right-0 w-12 h-12 rounded-full -translate-y-6 translate-x-6 ${
                statistics.netProfit >= 0 
                  ? 'bg-gradient-to-br from-blue-400/20 to-indigo-500/20' 
                  : 'bg-gradient-to-br from-red-400/20 to-rose-500/20'
              }`}></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${
                    statistics.netProfit >= 0 
                      ? 'bg-blue-500/10' 
                      : 'bg-red-500/10'
                  }`}>
                    {statistics.netProfit >= 0 ? (
                      <FiTrendingUp className={`h-4 w-4 ${statistics.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
                    ) : (
                      <FiTrendingDown className={`h-4 w-4 text-red-600`} />
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium ${statistics.netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>Net</p>
                    <p className={`text-xs ${statistics.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>profit</p>
                  </div>
                </div>
                <div>
                  <p className={`text-xs font-medium mb-1 ${statistics.netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>Net Profit</p>
                  <p className={`text-xl font-bold mb-1 ${statistics.netProfit >= 0 ? 'text-blue-800' : 'text-red-800'}`}>{formatCurrency(statistics.netProfit)}</p>
                  <p className={`text-xs font-semibold ${parseFloat(statistics.profitChange) >= 0 ? (statistics.netProfit >= 0 ? 'text-blue-600' : 'text-red-600') : 'text-red-600'}`}>
                    {parseFloat(statistics.profitChange) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(statistics.profitChange))}%
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ALL STATISTICS IN COMPACT GRID - Single Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-6"
          >
            {/* 1. Total Sales */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-indigo-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-purple-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-purple-400/20 to-indigo-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-purple-600">₹</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-purple-700">Total</p>
                    <p className="text-xs text-purple-600">sales</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-purple-700 mb-1">Total Sales</p>
                  <p className="text-lg font-bold text-purple-800">{formatCurrency(statistics.totalSales || 0)}</p>
                </div>
              </div>
            </div>

            {/* 2. Pending Receivables */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-green-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <FiTrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-green-700">Pending</p>
                    <p className="text-xs text-green-600">receivables</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-green-700 mb-1">Pending Receivables</p>
                  <p className="text-lg font-bold text-green-800">{formatCurrency(statistics.pendingAmounts?.totalPendingReceivables || 0)}</p>
                </div>
              </div>
            </div>

            {/* 3. Today Earnings */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-green-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-emerald-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-emerald-400/20 to-green-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-emerald-600">₹</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-emerald-700">Today</p>
                    <p className="text-xs text-emerald-600">earnings</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-emerald-700 mb-1">Today Earnings</p>
                  <p className="text-lg font-bold text-emerald-800">{formatCurrency(getTimeBasedStats().todayEarnings)}</p>
                </div>
              </div>
            </div>

            {/* 3. Today Profit */}
            <div className={`group relative overflow-hidden rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border ${
              (statistics.todayProfit || 0) >= 0 
                ? 'bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-200/50' 
                : 'bg-gradient-to-br from-red-50 to-rose-100 border-red-200/50'
            }`}>
              <div className={`absolute top-0 right-0 w-12 h-12 rounded-full -translate-y-6 translate-x-6 ${
                (statistics.todayProfit || 0) >= 0 
                  ? 'bg-gradient-to-br from-teal-400/20 to-cyan-500/20' 
                  : 'bg-gradient-to-br from-red-400/20 to-rose-500/20'
              }`}></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${
                    (statistics.todayProfit || 0) >= 0 
                      ? 'bg-teal-500/10' 
                      : 'bg-red-500/10'
                  }`}>
                    {(statistics.todayProfit || 0) >= 0 ? (
                      <FiTrendingUp className={`h-4 w-4 text-teal-600`} />
                    ) : (
                      <FiTrendingDown className={`h-4 w-4 text-red-600`} />
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium ${
                      (statistics.todayProfit || 0) >= 0 
                        ? 'text-teal-700' 
                        : 'text-red-700'
                    }`}>
                      Today
                    </p>
                    <p className={`text-xs ${
                      (statistics.todayProfit || 0) >= 0 
                        ? 'text-teal-600' 
                        : 'text-red-600'
                    }`}>
                      profit
                    </p>
                  </div>
                </div>
                <div>
                  <p className={`text-xs font-medium mb-1 ${
                    (statistics.todayProfit || 0) >= 0 
                      ? 'text-teal-700' 
                      : 'text-red-700'
                  }`}>
                    Today Profit
                  </p>
                  <p className={`text-lg font-bold ${
                    (statistics.todayProfit || 0) >= 0 
                      ? 'text-teal-800' 
                      : 'text-red-800'
                  }`}>
                    {formatCurrency(Math.abs(statistics.todayProfit || 0))}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Sales Incentives */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-yellow-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-amber-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-amber-400/20 to-yellow-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <FiTarget className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-amber-700">Sales</p>
                    <p className="text-xs text-amber-600">incentives</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-amber-700 mb-1">Sales Incentives (Paid)</p>
                  <p className="text-lg font-bold text-amber-800">{formatCurrency(statistics.expenseBreakdown?.incentiveExpenses || 0)}</p>
                </div>
              </div>
            </div>

            {/* 4. Reward Money */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-violet-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-purple-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-purple-400/20 to-violet-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <FiAward className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-purple-700">Rewards</p>
                    <p className="text-xs text-purple-600">bonuses</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-purple-700 mb-1">Reward Money (Paid)</p>
                  <p className="text-lg font-bold text-purple-800">{formatCurrency(statistics.expenseBreakdown?.rewardExpenses || 0)}</p>
                </div>
              </div>
            </div>

            {/* 7. Project Advances */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-teal-50 to-cyan-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-teal-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-teal-400/20 to-cyan-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-teal-500/10">
                    <FiHome className="h-4 w-4 text-teal-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-teal-700">Project</p>
                    <p className="text-xs text-teal-600">advances</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-teal-700 mb-1">Project Advances</p>
                  <p className="text-lg font-bold text-teal-800">{formatCurrency(statistics.revenueBreakdown?.projectAdvanceRevenue || 0)}</p>
                </div>
              </div>
            </div>

            {/* 8. Employee Salary */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-amber-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-orange-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-orange-400/20 to-amber-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <FiUsers className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-orange-700">Monthly</p>
                    <p className="text-xs text-orange-600">payroll</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-orange-700 mb-1">Employee Salary</p>
                  <p className="text-lg font-bold text-orange-800">{formatCurrency(getTimeBasedStats().employeeSalary)}</p>
                </div>
              </div>
            </div>

            {/* 9. Pending Salaries */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-amber-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-orange-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-orange-400/20 to-amber-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <FiUsers className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-orange-700">Pending</p>
                    <p className="text-xs text-orange-600">salaries</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-orange-700 mb-1">Pending Salaries</p>
                  <p className="text-lg font-bold text-orange-800">{formatCurrency(statistics.pendingAmounts?.pendingSalaries || 0)}</p>
                </div>
              </div>
            </div>

            {/* 12. Today Expenses */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-50 to-red-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-rose-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-rose-400/20 to-red-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-rose-500/10">
                    <FiCalendar className="h-4 w-4 text-rose-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-rose-700">Today</p>
                    <p className="text-xs text-rose-600">expenses</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-rose-700 mb-1">Today Expenses</p>
                  <p className="text-lg font-bold text-rose-800">{formatCurrency(statistics.todayExpenses || 0)}</p>
                </div>
              </div>
            </div>

            {/* 13. Recurring Expenses */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 to-rose-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-red-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-red-400/20 to-rose-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <FiCalendar className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-red-700">Recurring</p>
                    <p className="text-xs text-red-600">expenses</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-red-700 mb-1">Recurring Expenses</p>
                  <p className="text-lg font-bold text-red-800">{formatCurrency(statistics.expenseBreakdown?.recurringExpenses || 0)}</p>
                </div>
              </div>
            </div>

            {/* 14. Pending Payables */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 to-rose-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-red-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-red-400/20 to-rose-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <FiTrendingDown className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-red-700">Pending</p>
                    <p className="text-xs text-red-600">payables</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-red-700 mb-1">Pending Payables</p>
                  <p className="text-lg font-bold text-red-800">{formatCurrency(statistics.pendingAmounts?.totalPendingPayables || 0)}</p>
                </div>
              </div>
            </div>

            {/* 15. Project Expenses Total */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-blue-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <FiFileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-blue-700">Project</p>
                    <p className="text-xs text-blue-600">expenses</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-700 mb-1">Project Expenses</p>
                  <p className="text-lg font-bold text-blue-800">{formatCurrency(statistics.expenseBreakdown?.projectExpenses || 0)}</p>
                </div>
              </div>
            </div>

            {/* 16. Other Expenses */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-50 to-pink-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-rose-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-rose-400/20 to-pink-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-rose-500/10">
                    <FiFileText className="h-4 w-4 text-rose-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-rose-700">Misc</p>
                    <p className="text-xs text-rose-600">expenses</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-rose-700 mb-1">Other Expenses</p>
                  <p className="text-lg font-bold text-rose-800">{formatCurrency(getTimeBasedStats().otherExpenses)}</p>
                </div>
              </div>
            </div>
          </motion.div>

          </>
          )}

          {/* Navigation Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'transactions', label: 'Transactions', icon: FiActivity },
                  { id: 'budgets', label: 'Budgets', icon: FiTarget },
                  { id: 'expenses', label: 'Expenses', icon: FiTrendingDown },
                  { id: 'project-expenses', label: 'Project Expenses', icon: FiFileText },
                  { id: 'accounts', label: 'Accounts', icon: FiCreditCard }
                ].map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="text-sm" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Add Buttons and Transaction Type Tabs */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Transaction Type Tabs - Only show for transactions tab */}
            {activeTab === 'transactions' && (
              <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setTransactionTypeFilter('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    transactionTypeFilter === 'all'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTransactionTypeFilter('incoming')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    transactionTypeFilter === 'incoming'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Incoming
                </button>
                <button
                  onClick={() => setTransactionTypeFilter('outgoing')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    transactionTypeFilter === 'outgoing'
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Outgoing
                </button>
              </div>
            )}
            
            {/* Add Buttons */}
            <div className="flex justify-end">
              {activeTab === 'transactions' && (
                <button
                  onClick={handleCreateTransaction}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  <FiPlus className="text-sm" />
                  <span>Add Transaction</span>
                </button>
              )}
              {activeTab === 'budgets' && (
                <button
                  onClick={handleCreateBudget}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  <FiPlus className="text-sm" />
                  <span>Add Budget</span>
                </button>
              )}
              {activeTab === 'expenses' && (
                <button
                  onClick={handleCreateExpense}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  <FiPlus className="text-sm" />
                  <span>Add Expense</span>
                </button>
              )}
              {activeTab === 'project-expenses' && (
                <button
                  onClick={handleCreateProjectExpense}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  <FiPlus className="text-sm" />
                  <span>Add Project Expense</span>
                </button>
              )}
              {activeTab === 'accounts' && (
                <button
                  onClick={handleCreateAccount}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  <FiPlus className="text-sm" />
                  <span>Add Account</span>
                </button>
              )}
            </div>
          </div>

          {/* Search and Filter */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <FiFilter className="text-gray-400" />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                {activeTab === 'transactions' && (
                  <>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </>
                )}
                {activeTab === 'budgets' && (
                  <>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </>
                )}
                {activeTab === 'expenses' && (
                  <>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </>
                )}
                {activeTab === 'accounts' && (
                  <>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </>
                )}
                {activeTab === 'project-expenses' && (
                  <>
                    <option value="all">All Categories</option>
                    <option value="domain">Domain</option>
                    <option value="server">Server</option>
                    <option value="api">API Service</option>
                    <option value="hosting">Hosting</option>
                    <option value="ssl">SSL Certificate</option>
                    <option value="other">Other</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Content Grid */}
          {(transactionsLoading && activeTab === 'transactions') || (expensesLoading && activeTab === 'expenses') || (budgetsLoading && activeTab === 'budgets') || (projectExpensesLoading && activeTab === 'project-expenses') ? (
            <div className="flex justify-center items-center py-12">
              <Loading size="medium" />
            </div>
          ) : error && (activeTab === 'transactions' || activeTab === 'expenses' || activeTab === 'budgets' || activeTab === 'project-expenses') ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => {
                  if (activeTab === 'transactions') fetchTransactions()
                  else if (activeTab === 'expenses') fetchExpenses()
                  else if (activeTab === 'budgets') fetchBudgets()
                  else if (activeTab === 'project-expenses') fetchProjectExpenses()
                }}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : paginatedData.length === 0 && activeTab === 'transactions' ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-600">No transactions found</p>
              <button
                onClick={handleCreateTransaction}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Transaction
              </button>
            </div>
          ) : paginatedData.length === 0 && activeTab === 'expenses' ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-600">No expenses found</p>
              <button
                onClick={handleCreateExpense}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Expense
              </button>
            </div>
          ) : paginatedData.length === 0 && activeTab === 'budgets' ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-600">No budgets found</p>
              <button
                onClick={handleCreateBudget}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Budget
              </button>
            </div>
          ) : paginatedData.length === 0 && activeTab === 'project-expenses' ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-600">No project expenses found</p>
              <button
                onClick={handleCreateProjectExpense}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Project Expense
              </button>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedData.map((item, index) => (
              <motion.div
                key={item._id || item.id || `item-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
              >
                {/* Transaction Card */}
                {activeTab === 'transactions' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${getTypeColor(item.transactionType || item.type)}`}>
                        {(item.transactionType || item.type) === 'incoming' ? '+' : '-'}{formatCurrency(item.amount)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{item.category}</h3>
                      <p className="text-xs text-gray-600 mt-1">{item.description || 'No description'}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {item.account?.accountName || item.vendor || 'N/A'}
                      </span>
                      <span>{formatDate(item.transactionDate || item.date || item.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleView(item)}
                        className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                      >
                        <FiEye className="inline mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="flex-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
                      >
                        <FiEdit className="inline mr-1" />
                        Edit
                      </button>
                    </div>
                  </div>
                )}

                {/* Budget Card */}
                {activeTab === 'budgets' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Spent</span>
                        <span>{formatCurrency(item.spent || 0)} / {formatCurrency(item.allocated)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(100, ((item.spent || 0) / item.allocated) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <p>Remaining: {formatCurrency(item.remaining)}</p>
                      <p>{formatDate(item.startDate)} - {formatDate(item.endDate)}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleView(item)}
                        className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                      >
                        <FiEye className="inline mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="flex-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
                      >
                        <FiEdit className="inline mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleSpendBudget(item)}
                        className="flex-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                        title="Record expense from this budget"
                      >
                        <span className="inline mr-1">₹</span>
                        Spend
                      </button>
                    </div>
                  </div>
                )}

                {/* Project Expense Card */}
                {activeTab === 'project-expenses' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-red-600">
                        -{formatCurrency(item.amount)}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {item.category}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
                      <p className="text-xs text-gray-600 mt-1">
                        Project: {item.project?.name || 'N/A'}
                      </p>
                      {item.vendor && (
                        <p className="text-xs text-gray-500 mt-1">Vendor: {item.vendor}</p>
                      )}
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Payment: {item.paymentMethod || 'N/A'}</span>
                      <span>{formatDate(item.expenseDate || item.date || item.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewProjectExpense(item)}
                        className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                      >
                        <FiEye className="inline mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleEditProjectExpense(item)}
                        className="flex-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
                      >
                        <FiEdit className="inline mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProjectExpense(item)}
                        className="flex-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                      >
                        <FiTrash2 className="inline mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* Expense Card */}
                {activeTab === 'expenses' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-red-600 text-sm">{formatCurrency(item.amount)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{item.category}</h3>
                      <p className="text-xs text-gray-600 mt-1">{item.description || 'No description'}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{item.vendor || item.employee?.name || 'N/A'}</span>
                      <span>{formatDate(item.transactionDate || item.date || item.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleView(item)}
                        className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                      >
                        <FiEye className="inline mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="flex-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
                      >
                        <FiEdit className="inline mr-1" />
                        Edit
                      </button>
                    </div>
                  </div>
                )}

                {/* Account Card - Light Color Credit Card Style */}
                {activeTab === 'accounts' && (
                  <div className={`relative rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden -m-4 ${
                    item.accountType === 'current' 
                      ? 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200'
                      : item.accountType === 'savings'
                      ? 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200'
                      : item.accountType === 'business'
                      ? 'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200'
                      : 'bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200'
                  }`}>
                    {/* Card Content */}
                    <div className="p-3">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-6 h-6 rounded flex items-center justify-center ${
                            item.accountType === 'current' 
                              ? 'bg-blue-200 text-blue-700'
                              : item.accountType === 'savings'
                              ? 'bg-green-200 text-green-700'
                              : item.accountType === 'business'
                              ? 'bg-purple-200 text-purple-700'
                              : 'bg-orange-200 text-orange-700'
                          }`}>
                            <FiCreditCard className="w-3 h-3" />
                          </div>
                          <p className="text-xs font-medium text-gray-700 truncate">{item.bankName}</p>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          item.isActive 
                            ? 'bg-green-200 text-green-800' 
                            : 'bg-red-200 text-red-800'
                        }`}>
                          {item.isActive ? 'A' : 'I'}
                        </span>
                      </div>

                      {/* Account Name & Type */}
                      <div className="mb-3">
                        <h3 className="text-sm font-bold mb-1 truncate text-gray-800">{item.accountName}</h3>
                        <p className="text-xs text-gray-600 capitalize">{item.accountType}</p>
                      </div>

                      {/* Account Number */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Account</p>
                        <p className="text-sm font-mono tracking-wide text-gray-800">{item.accountNumber}</p>
                      </div>

                      {/* Bottom Info */}
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <p className="text-gray-500">IFSC</p>
                          <p className="font-mono text-gray-700">{item.ifscCode}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-500">Branch</p>
                          <p className="truncate max-w-20 text-gray-700">{item.branchName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="bg-white p-2 border-t border-gray-100">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleViewAccount(item)}
                          className="flex-1 px-2 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center justify-center space-x-1 text-xs"
                        >
                          <FiEye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleEditAccount(item)}
                          className="flex-1 px-2 py-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors flex items-center justify-center space-x-1 text-xs"
                        >
                          <FiEdit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          )}

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Results Info */}
                <div className="flex items-center gap-4 text-sm text-gray-700">
                  <span>
                    {activeTab === 'transactions' ? (
                      <>Showing <span className="font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-semibold">{Math.min(currentPage * itemsPerPage, transactionsTotal)}</span> of <span className="font-semibold">{transactionsTotal}</span> transactions</>
                    ) : activeTab === 'expenses' ? (
                      <>Showing <span className="font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-semibold">{Math.min(currentPage * itemsPerPage, expensesTotal)}</span> of <span className="font-semibold">{expensesTotal}</span> expenses</>
                    ) : activeTab === 'budgets' ? (
                      <>Showing <span className="font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-semibold">{Math.min(currentPage * itemsPerPage, budgetsTotal)}</span> of <span className="font-semibold">{budgetsTotal}</span> budgets</>
                    ) : (
                      <>Showing <span className="font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of <span className="font-semibold">{filteredData.length}</span> results</>
                    )}
                  </span>
                  
                  {/* Items Per Page Selector */}
                  {activeTab === 'transactions' && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Show:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value))
                          setCurrentPage(1)
                        }}
                        className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                      <span className="text-gray-500">per page</span>
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-2">
                  {/* First Page */}
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    title="First page"
                  >
                    <FiChevronLeft className="h-4 w-4" />
                  </button>
                  
                  {/* Previous Page */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {(() => {
                      const pages = []
                      const maxVisiblePages = 5
                      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
                      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
                      
                      if (endPage - startPage < maxVisiblePages - 1) {
                        startPage = Math.max(1, endPage - maxVisiblePages + 1)
                      }

                      // First page
                      if (startPage > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => setCurrentPage(1)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                          >
                            1
                          </button>
                        )
                        if (startPage > 2) {
                          pages.push(
                            <span key="ellipsis-start" className="px-2 text-gray-500">
                              ...
                            </span>
                          )
                        }
                      }

                      // Visible page numbers
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i)}
                            className={`px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                              currentPage === i
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {i}
                          </button>
                        )
                      }

                      // Last page
                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pages.push(
                            <span key="ellipsis-end" className="px-2 text-gray-500">
                              ...
                            </span>
                          )
                        }
                        pages.push(
                          <button
                            key={totalPages}
                            onClick={() => setCurrentPage(totalPages)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                          >
                            {totalPages}
                          </button>
                        )
                      }

                      return pages
                    })()}
                  </div>

                  {/* Next Page */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Next
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    title="Last page"
                  >
                    <FiChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Jump to Page */}
              {totalPages > 10 && (
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-center gap-2">
                  <span className="text-sm text-gray-600">Go to page:</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value)
                      if (page >= 1 && page <= totalPages) {
                        setCurrentPage(page)
                      }
                    }}
                    className="w-20 px-3 py-1.5 border border-gray-300 rounded-md text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-sm text-gray-600">of {totalPages}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Account Creation Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Add New Bank Account</h3>
              <button
                onClick={closeModals}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveAccount(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Name *</label>
                  <input
                    type="text"
                    value={accountFormData.accountName}
                    onChange={(e) => setAccountFormData({...accountFormData, accountName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter account name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name *</label>
                  <input
                    type="text"
                    value={accountFormData.bankName}
                    onChange={(e) => setAccountFormData({...accountFormData, bankName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter bank name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Number *</label>
                  <input
                    type="text"
                    value={accountFormData.accountNumber}
                    onChange={(e) => setAccountFormData({...accountFormData, accountNumber: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter account number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code *</label>
                  <input
                    type="text"
                    value={accountFormData.ifscCode}
                    onChange={(e) => setAccountFormData({...accountFormData, ifscCode: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter IFSC code"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name</label>
                  <input
                    type="text"
                    value={accountFormData.branchName}
                    onChange={(e) => setAccountFormData({...accountFormData, branchName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter branch name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                  <select
                    value={accountFormData.accountType}
                    onChange={(e) => setAccountFormData({...accountFormData, accountType: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="current">Current Account</option>
                    <option value="savings">Savings Account</option>
                    <option value="business">Business Account</option>
                    <option value="corporate">Corporate Account</option>
                  </select>
                </div>
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={accountFormData.description}
                  onChange={(e) => setAccountFormData({...accountFormData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter account description"
                />
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={accountFormData.isActive}
                    onChange={(e) => setAccountFormData({...accountFormData, isActive: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active Account</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <FiPlus className="h-4 w-4" />
                  <span>Add Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account View Modal */}
      {showAccountViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Account Details</h3>
              <button
                onClick={closeModals}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Account Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedItem.accountName}</h4>
                  <p className="text-sm text-gray-600">{selectedItem.bankName}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedItem.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selectedItem.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Account Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <p className="text-lg font-mono bg-gray-50 p-3 rounded-lg">{selectedItem.accountNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                    <p className="text-lg font-mono bg-gray-50 p-3 rounded-lg">{selectedItem.ifscCode}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                    <p className="text-lg bg-gray-50 p-3 rounded-lg capitalize">{selectedItem.accountType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                    <p className="text-lg bg-gray-50 p-3 rounded-lg">{selectedItem.branchName}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedItem.description}</p>
              </div>

              {/* Account Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{formatDate(selectedItem.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Used</label>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{formatDate(selectedItem.lastUsed)}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={closeModals}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowAccountViewModal(false)
                    handleEditAccount(selectedItem)
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <FiEdit className="h-4 w-4" />
                  <span>Edit Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Edit Modal */}
      {showAccountEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Edit Account</h3>
              <button
                onClick={closeModals}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleUpdateAccount(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Name *</label>
                  <input
                    type="text"
                    value={accountFormData.accountName}
                    onChange={(e) => setAccountFormData({...accountFormData, accountName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter account name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name *</label>
                  <input
                    type="text"
                    value={accountFormData.bankName}
                    onChange={(e) => setAccountFormData({...accountFormData, bankName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter bank name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Number *</label>
                  <input
                    type="text"
                    value={accountFormData.accountNumber}
                    onChange={(e) => setAccountFormData({...accountFormData, accountNumber: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter account number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code *</label>
                  <input
                    type="text"
                    value={accountFormData.ifscCode}
                    onChange={(e) => setAccountFormData({...accountFormData, ifscCode: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter IFSC code"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name</label>
                  <input
                    type="text"
                    value={accountFormData.branchName}
                    onChange={(e) => setAccountFormData({...accountFormData, branchName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter branch name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                  <select
                    value={accountFormData.accountType}
                    onChange={(e) => setAccountFormData({...accountFormData, accountType: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="current">Current Account</option>
                    <option value="savings">Savings Account</option>
                    <option value="business">Business Account</option>
                    <option value="corporate">Corporate Account</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={accountFormData.description}
                  onChange={(e) => setAccountFormData({...accountFormData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter account description"
                />
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={accountFormData.isActive}
                    onChange={(e) => setAccountFormData({...accountFormData, isActive: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active Account</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <FiEdit className="h-4 w-4" />
                  <span>Update Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction View Modal */}
      {showViewModal && selectedItem && activeTab === 'transactions' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Transaction Details</h3>
              <button
                onClick={closeModals}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Transaction Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">{selectedItem.category}</h4>
                  <p className={`text-2xl font-bold mt-2 ${getTypeColor(selectedItem.transactionType || selectedItem.type)}`}>
                    {(selectedItem.transactionType || selectedItem.type) === 'incoming' ? '+' : '-'}{formatCurrency(selectedItem.amount)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedItem.status)}`}>
                  {selectedItem.status}
                </span>
              </div>

              {/* Transaction Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                  <p className={`text-lg font-semibold ${getTypeColor(selectedItem.transactionType || selectedItem.type)}`}>
                    {(selectedItem.transactionType || selectedItem.type) === 'incoming' ? 'Incoming' : 'Outgoing'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <p className="text-lg bg-gray-50 p-3 rounded-lg">{selectedItem.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <p className={`text-lg font-bold bg-gray-50 p-3 rounded-lg ${getTypeColor(selectedItem.transactionType || selectedItem.type)}`}>
                    {formatCurrency(selectedItem.amount)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <p className="text-lg bg-gray-50 p-3 rounded-lg">
                    {formatDate(selectedItem.transactionDate || selectedItem.date || selectedItem.createdAt)}
                  </p>
                </div>
                {selectedItem.account && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                    <p className="text-lg bg-gray-50 p-3 rounded-lg">
                      {selectedItem.account?.accountName || selectedItem.accountName || 'N/A'}
                    </p>
                  </div>
                )}
                {selectedItem.paymentMethod && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <p className="text-lg bg-gray-50 p-3 rounded-lg">{selectedItem.paymentMethod}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedItem.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedItem.description}</p>
                </div>
              )}

              {/* Additional Info */}
              {(selectedItem.client || selectedItem.project || selectedItem.employee) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedItem.client && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedItem.client?.name || selectedItem.client}</p>
                    </div>
                  )}
                  {selectedItem.project && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedItem.project?.name || selectedItem.project}</p>
                    </div>
                  )}
                  {selectedItem.employee && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedItem.employee?.name || selectedItem.employee}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Transaction Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedItem.createdAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{formatDate(selectedItem.createdAt)}</p>
                  </div>
                )}
                {selectedItem.updatedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{formatDate(selectedItem.updatedAt)}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={closeModals}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    handleEditTransaction(selectedItem)
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <FiEdit className="h-4 w-4" />
                  <span>Edit Transaction</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Creation/Edit Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {selectedItem ? 'Edit Transaction' : 'Add New Transaction'}
              </h3>
              <button
                onClick={closeModals}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={async (e) => { 
              e.preventDefault(); 
              await handleSaveTransaction(); 
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type *</label>
                  <select
                    value={transactionFormData.type}
                    onChange={(e) => {
                      const newType = e.target.value
                      setTransactionFormData({
                        ...transactionFormData, 
                        type: newType,
                        account: newType === 'outgoing' ? '' : transactionFormData.account // Clear account if switching to outgoing
                      })
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="incoming">Incoming</option>
                    <option value="outgoing">Outgoing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <input
                    type="text"
                    value={transactionFormData.category}
                    onChange={(e) => setTransactionFormData({...transactionFormData, category: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter category (e.g., Client Payment, Salary, etc.)"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={transactionFormData.amount}
                    onChange={(e) => setTransactionFormData({...transactionFormData, amount: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={transactionFormData.date}
                    onChange={(e) => setTransactionFormData({...transactionFormData, date: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Account dropdown - only show for incoming transactions */}
              {transactionFormData.type === 'incoming' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account *</label>
                  {accountsLoading ? (
                    <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500">
                      Loading accounts...
                    </div>
                  ) : accounts.length === 0 ? (
                    <div className="w-full px-4 py-3 border border-red-300 rounded-xl bg-red-50 text-red-600 text-sm">
                      No active accounts found. Please create an account first.
                    </div>
                  ) : (
                    <select
                      value={transactionFormData.account}
                      onChange={(e) => setTransactionFormData({...transactionFormData, account: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select an account</option>
                      {accounts.map((account) => (
                        <option key={account._id || account.id} value={account._id || account.id}>
                          {account.accountName} - {account.bankName} ({account.accountNumber})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={transactionFormData.description}
                  onChange={(e) => setTransactionFormData({...transactionFormData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter transaction description"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  {selectedItem ? (
                    <>
                      <FiEdit className="h-4 w-4" />
                      <span>Update Transaction</span>
                    </>
                  ) : (
                    <>
                      <FiPlus className="h-4 w-4" />
                      <span>Add Transaction</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Creation Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Add New Budget</h3>
              <button
                onClick={closeModals}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveBudget(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget Name *</label>
                  <input
                    type="text"
                    value={budgetFormData.name}
                    onChange={(e) => setBudgetFormData({...budgetFormData, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter budget name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <input
                    type="text"
                    value={budgetFormData.category}
                    onChange={(e) => setBudgetFormData({...budgetFormData, category: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter category"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allocated Amount *</label>
                <input
                  type="number"
                  value={budgetFormData.allocated}
                  onChange={(e) => setBudgetFormData({...budgetFormData, allocated: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter allocated amount"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={budgetFormData.startDate}
                    onChange={(e) => setBudgetFormData({...budgetFormData, startDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={budgetFormData.endDate}
                    onChange={(e) => setBudgetFormData({...budgetFormData, endDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={budgetFormData.description}
                  onChange={(e) => setBudgetFormData({...budgetFormData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter budget description"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <FiPlus className="h-4 w-4" />
                  <span>Add Budget</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget View Modal */}
      {showBudgetViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Budget Details</h3>
              <button
                onClick={closeModals}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget Name</label>
                <p className="text-lg bg-gray-50 p-3 rounded-lg">{selectedItem.name || selectedItem.budgetName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <p className="text-lg bg-gray-50 p-3 rounded-lg">{selectedItem.category || selectedItem.budgetCategory}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <p className={`text-lg p-3 rounded-lg ${getStatusColor(selectedItem.status)}`}>
                    {selectedItem.status || 'active'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Allocated</label>
                  <p className="text-lg font-semibold bg-blue-50 p-3 rounded-lg text-blue-700">
                    {formatCurrency(selectedItem.allocated || selectedItem.allocatedAmount)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Spent</label>
                  <p className="text-lg font-semibold bg-red-50 p-3 rounded-lg text-red-700">
                    {formatCurrency(selectedItem.spent || selectedItem.spentAmount || 0)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Remaining</label>
                  <p className="text-lg font-semibold bg-green-50 p-3 rounded-lg text-green-700">
                    {formatCurrency(selectedItem.remaining || selectedItem.remainingAmount)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Progress</label>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${
                      ((selectedItem.spent || selectedItem.spentAmount || 0) / (selectedItem.allocated || selectedItem.allocatedAmount)) > 0.9
                        ? 'bg-red-600'
                        : ((selectedItem.spent || selectedItem.spentAmount || 0) / (selectedItem.allocated || selectedItem.allocatedAmount)) > 0.7
                        ? 'bg-yellow-600'
                        : 'bg-blue-600'
                    }`}
                    style={{
                      width: `${Math.min(100, ((selectedItem.spent || selectedItem.spentAmount || 0) / (selectedItem.allocated || selectedItem.allocatedAmount)) * 100)}%`
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((selectedItem.spent || selectedItem.spentAmount || 0) / (selectedItem.allocated || selectedItem.allocatedAmount) * 100).toFixed(1)}% used
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <p className="text-lg bg-gray-50 p-3 rounded-lg">
                    {formatDate(selectedItem.startDate)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <p className="text-lg bg-gray-50 p-3 rounded-lg">
                    {formatDate(selectedItem.endDate)}
                  </p>
                </div>
              </div>

              {selectedItem.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedItem.description}</p>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBudgetViewModal(false)
                    handleSpendBudget(selectedItem)
                  }}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <span className="text-lg">₹</span>
                  <span>Record Spend</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Edit Modal */}
      {showBudgetEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Edit Budget</h3>
              <button
                onClick={closeModals}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleUpdateBudget(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget Name *</label>
                  <input
                    type="text"
                    value={budgetFormData.name}
                    onChange={(e) => setBudgetFormData({...budgetFormData, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter budget name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <input
                    type="text"
                    value={budgetFormData.category}
                    onChange={(e) => setBudgetFormData({...budgetFormData, category: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter category"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allocated Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={budgetFormData.allocated}
                  onChange={(e) => setBudgetFormData({...budgetFormData, allocated: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter allocated amount"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={budgetFormData.startDate}
                    onChange={(e) => setBudgetFormData({...budgetFormData, startDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                  <input
                    type="date"
                    value={budgetFormData.endDate}
                    onChange={(e) => setBudgetFormData({...budgetFormData, endDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={budgetFormData.description}
                  onChange={(e) => setBudgetFormData({...budgetFormData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter budget description"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <FiEdit className="h-4 w-4" />
                  <span>Update Budget</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Spend Modal */}
      {showBudgetSpendModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Record Budget Spend</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Budget: {selectedItem.name || selectedItem.budgetName}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Remaining: {formatCurrency(selectedItem.remaining || selectedItem.remainingAmount)}
                </p>
              </div>
              <button
                onClick={closeModals}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSpendFromBudget(); }} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Recording a spend will create an outgoing transaction with category "{selectedItem.category || selectedItem.budgetCategory}" 
                  and automatically update the budget's spent amount.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedItem.remaining || selectedItem.remainingAmount}
                  value={budgetSpendFormData.amount}
                  onChange={(e) => setBudgetSpendFormData({...budgetSpendFormData, amount: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter amount to spend"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {formatCurrency(selectedItem.remaining || selectedItem.remainingAmount)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  value={budgetSpendFormData.date}
                  onChange={(e) => setBudgetSpendFormData({...budgetSpendFormData, date: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={budgetSpendFormData.description}
                  onChange={(e) => setBudgetSpendFormData({...budgetSpendFormData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter description for this spend"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <span className="text-lg">₹</span>
                  <span>Record Spend</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Creation Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Add New Expense</h3>
              <button
                onClick={closeModals}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => { 
              e.preventDefault(); 
              handleSaveExpense(); 
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <input
                    type="text"
                    value={expenseFormData.category}
                    onChange={(e) => setExpenseFormData({...expenseFormData, category: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter category (e.g., Salaries, Rent, Software, etc.)"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={expenseFormData.amount}
                    onChange={(e) => setExpenseFormData({...expenseFormData, amount: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter amount"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  value={expenseFormData.date}
                  onChange={(e) => setExpenseFormData({...expenseFormData, date: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={expenseFormData.description}
                  onChange={(e) => setExpenseFormData({...expenseFormData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter expense description"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <FiPlus className="h-4 w-4" />
                  <span>Add Expense</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Expense Modal */}
      {showProjectExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {projectExpenseModalMode === 'create' ? 'Add New Project Expense' : 
                 projectExpenseModalMode === 'edit' ? 'Edit Project Expense' : 
                 'View Project Expense'}
              </h3>
              <button
                onClick={() => setShowProjectExpenseModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => { 
              e.preventDefault(); 
              if (projectExpenseModalMode !== 'view') {
                handleSaveProjectExpense(); 
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project *</label>
                <select
                  value={projectExpenseFormData.projectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={projectExpenseModalMode === 'view'}
                >
                  <option value="">Select a project</option>
                  {projectsList.map(project => (
                    <option key={project.value} value={project.value}>{project.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={projectExpenseFormData.name}
                    onChange={(e) => setProjectExpenseFormData({...projectExpenseFormData, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Domain Purchase, Server Hosting"
                    required
                    disabled={projectExpenseModalMode === 'view'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={projectExpenseFormData.category}
                    onChange={(e) => setProjectExpenseFormData({...projectExpenseFormData, category: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={projectExpenseModalMode === 'view'}
                  >
                    <option value="">Select category</option>
                    <option value="domain">Domain</option>
                    <option value="server">Server</option>
                    <option value="api">API Service</option>
                    <option value="hosting">Hosting</option>
                    <option value="ssl">SSL Certificate</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={projectExpenseFormData.amount}
                    onChange={(e) => setProjectExpenseFormData({...projectExpenseFormData, amount: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter amount"
                    required
                    disabled={projectExpenseModalMode === 'view'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expense Date *</label>
                  <input
                    type="date"
                    value={projectExpenseFormData.expenseDate}
                    onChange={(e) => setProjectExpenseFormData({...projectExpenseFormData, expenseDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={projectExpenseModalMode === 'view'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
                  <input
                    type="text"
                    value={projectExpenseFormData.vendor}
                    onChange={(e) => setProjectExpenseFormData({...projectExpenseFormData, vendor: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Vendor/provider name"
                    disabled={projectExpenseModalMode === 'view'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                  <select
                    value={projectExpenseFormData.paymentMethod}
                    onChange={(e) => setProjectExpenseFormData({...projectExpenseFormData, paymentMethod: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={projectExpenseModalMode === 'view'}
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={projectExpenseFormData.description}
                  onChange={(e) => setProjectExpenseFormData({...projectExpenseFormData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter additional notes or description"
                  disabled={projectExpenseModalMode === 'view'}
                />
              </div>

              {projectExpenseModalMode !== 'view' && (
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowProjectExpenseModal(false)}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <FiPlus className="h-4 w-4" />
                    <span>{projectExpenseModalMode === 'create' ? 'Add Project Expense' : 'Update Project Expense'}</span>
                  </button>
                </div>
              )}
              {projectExpenseModalMode === 'view' && (
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowProjectExpenseModal(false)}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditProjectExpense(selectedProjectExpense)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <FiEdit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Expense Confirmation Modal */}
      {showDeleteProjectExpenseModal && projectExpenseToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Delete Project Expense</h3>
              <button
                onClick={() => {
                  setShowDeleteProjectExpenseModal(false)
                  setProjectExpenseToDelete(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete this project expense? This action cannot be undone.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Name:</span>
                    <span className="ml-2 text-gray-900">{projectExpenseToDelete.name}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Project:</span>
                    <span className="ml-2 text-gray-900">{projectExpenseToDelete.project?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Amount:</span>
                    <span className="ml-2 text-gray-900 font-semibold">{formatCurrency(projectExpenseToDelete.amount)}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Category:</span>
                    <span className="ml-2 text-gray-900 capitalize">{projectExpenseToDelete.category}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteProjectExpenseModal(false)
                  setProjectExpenseToDelete(null)
                }}
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProjectExpense}
                className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <FiTrash2 className="h-4 w-4" />
                <span>Delete Expense</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin_finance_management
