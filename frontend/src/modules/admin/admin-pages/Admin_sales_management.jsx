
import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiRefreshCw, 
  FiSearch, 
  FiFilter,
  FiEye, 
  FiEdit3, 
  FiTrash2, 
  FiPlus,
  FiUsers,
  FiUser,
  FiHome,
  FiTrendingUp,
  FiCreditCard,
  FiTarget,
  FiCalendar,
  FiPhone,
  FiMail,
  FiCheckCircle,
  FiAlertCircle,
  FiAlertTriangle,
  FiClock,
  FiStar,
  FiBarChart,
  FiPieChart,
  FiActivity,
  FiUpload,
  FiFile,
  FiX,
  FiDollarSign
} from 'react-icons/fi'
import Admin_navbar from '../admin-components/Admin_navbar'
import Admin_sidebar from '../admin-components/Admin_sidebar'
import Loading from '../../../components/ui/loading'
import { useToast } from '../../../contexts/ToastContext'
import { adminSalesService } from '../admin-services'

const Admin_sales_management = () => {
  // Toast context
  const { toast } = useToast()
  
  // Helper function to safely render values (prevent object rendering)
  const safeRender = (value, fallback = '') => {
    if (value === null || value === undefined) return fallback
    if (typeof value === 'object') return fallback
    return String(value)
  }
  
  // State management
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('leads')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)
  
  // Data states (replacing mock data)
  const [statistics, setStatistics] = useState(null)
  const [leadCategories, setLeadCategories] = useState([])
  const [leads, setLeads] = useState([])
  const [totalLeadsCount, setTotalLeadsCount] = useState(0) // Total count from API
  const [allLeads, setAllLeads] = useState([]) // All leads for statistics
  const [totalAllLeadsCount, setTotalAllLeadsCount] = useState(0) // Total count of all leads from API
  const [assignedLeads, setAssignedLeads] = useState([]) // Assigned leads for category performance
  const [salesTeam, setSalesTeam] = useState([])
  const [clients, setClients] = useState([])
  
  // Loading states for different data types
  const [loadingStatistics, setLoadingStatistics] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [loadingSalesTeam, setLoadingSalesTeam] = useState(false)
  const [loadingClients, setLoadingClients] = useState(false)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState(false)
  const [loadingTarget, setLoadingTarget] = useState(false)
  const [loadingIncentive, setLoadingIncentive] = useState(false)
  const [deletingMember, setDeletingMember] = useState(false)
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAddLeadModal, setShowAddLeadModal] = useState(false)
  const [showBulkLeadModal, setShowBulkLeadModal] = useState(false)
  const [showTargetModal, setShowTargetModal] = useState(false)
  const [showAssignLeadModal, setShowAssignLeadModal] = useState(false)
  const [showLeadListModal, setShowLeadListModal] = useState(false)
  const [showIncentiveModal, setShowIncentiveModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showCategoryEditModal, setShowCategoryEditModal] = useState(false)
  const [showCategoryDeleteModal, setShowCategoryDeleteModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [modalType, setModalType] = useState('')
  const [selectedLeadCategory, setSelectedLeadCategory] = useState('')
  const [selectedLeadCategoryData, setSelectedLeadCategoryData] = useState([])
  const [loadingMemberDetails, setLoadingMemberDetails] = useState(false)
  
  // Form states
  const [leadNumber, setLeadNumber] = useState('')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [targetAmount, setTargetAmount] = useState('')
  const [leadsToAssign, setLeadsToAssign] = useState('')
  const [incentiveAmount, setIncentiveAmount] = useState('')
  const [distributingLeads, setDistributingLeads] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')
  const [categoryColor, setCategoryColor] = useState('#3B82F6')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [assignCategoryFilter, setAssignCategoryFilter] = useState('all')
  const [leadsPerCategory, setLeadsPerCategory] = useState({})

  // Data loading functions
  const loadStatistics = async () => {
    try {
      setLoadingStatistics(true)
      const response = await adminSalesService.getSalesOverview('all')
      
      if (response.success) {
        setStatistics(response.data)
      }
    } catch (error) {
      console.error('Error loading statistics:', error)
      toast.error('Failed to load statistics')
    } finally {
      setLoadingStatistics(false)
    }
  }

  const loadCategories = async () => {
    try {
      setLoadingCategories(true)
      const response = await adminSalesService.getAllLeadCategories()
      if (response.success) {
        setLeadCategories(response.data)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setLoadingCategories(false)
    }
  }

  const loadLeads = async () => {
    try {
      setLoadingLeads(true)
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        status: selectedFilter !== 'all' ? selectedFilter : undefined,
        assignedTo: 'unassigned' // Only show unassigned leads for admin
      }
      
      const response = await adminSalesService.getAllLeads(params)
      
      if (response.success) {
        setLeads(response.data || [])
        // Store total count from API response (accurate unassigned leads count)
        setTotalLeadsCount(response.total || 0)
      }
    } catch (error) {
      console.error('Error loading leads:', error)
      toast.error('Failed to load leads')
    } finally {
      setLoadingLeads(false)
    }
  }

  // Load all unassigned leads for statistics
  const loadAllLeads = async () => {
    try {
      const params = {
        page: 1,
        limit: 1000, // Load more leads for statistics
        search: searchTerm,
        status: selectedFilter !== 'all' ? selectedFilter : undefined,
        assignedTo: 'unassigned' // Only get unassigned leads
      }
      
      
      const response = await adminSalesService.getAllLeads(params)
      
      
      if (response.success) {
        setAllLeads(response.data || [])
        // Store total count from API response
        setTotalAllLeadsCount(response.total || 0)
      }
    } catch (error) {
      console.error('Error loading all leads:', error)
      // Don't show toast error for this as it's background loading
    }
  }

  // Load assigned leads for category performance (leads being worked on by sales employees)
  const loadAssignedLeads = async () => {
    try {
      const params = {
        page: 1,
        limit: 1000, // Load more leads for statistics
        search: searchTerm,
        status: selectedFilter !== 'all' ? selectedFilter : undefined,
        assignedTo: 'assigned' // Only get assigned leads
      }
      
      
      const response = await adminSalesService.getAllLeads(params)
      
      
      if (response.success) {
        setAssignedLeads(response.data)
      }
    } catch (error) {
      console.error('Error loading assigned leads:', error)
      // Don't show toast error for this as it's background loading
    }
  }

  const loadSalesTeam = async () => {
    try {
      setLoadingSalesTeam(true)
      const response = await adminSalesService.getAllSalesTeam()
      if (response.success) {
        const members = response.data || []
        if (members.length > 0) {
          const detailedMembers = await Promise.all(
            members.map(async (member) => {
              try {
                const detailRes = await adminSalesService.getSalesTeamMember(member.id || member._id)
                if (detailRes?.success && detailRes.data) {
                  return {
                    ...member,
                    ...detailRes.data
                  }
                }
              } catch (detailError) {
                console.error('Error fetching sales team member details:', detailError)
              }
              return member
            })
          )
          setSalesTeam(detailedMembers)
        } else {
          setSalesTeam([])
        }
      }
    } catch (error) {
      console.error('Error loading sales team:', error)
      toast.error('Failed to load sales team')
    } finally {
      setLoadingSalesTeam(false)
    }
  }

  const loadClients = async () => {
    try {
      setLoadingClients(true)
      const response = await adminSalesService.getAllClients()
      if (response.success) {
        setClients(response.data)
      }
    } catch (error) {
      console.error('Error loading clients:', error)
      toast.error('Failed to load clients')
    } finally {
      setLoadingClients(false)
    }
  }

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        await Promise.all([
          loadStatistics(),
          loadCategories(),
          loadLeads(),
          loadAllLeads(), // Load all unassigned leads for statistics
          loadAssignedLeads() // Load assigned leads for category performance
        ])
      } catch (error) {
        console.error('Error loading initial data:', error)
        toast.error('Failed to load initial data')
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Load leads when filters change
  useEffect(() => {
    if (!loading) {
      loadLeads()
    }
  }, [currentPage, searchTerm, selectedFilter])

  // Load sales team when switching to sales team tab
  useEffect(() => {
    if (activeTab === 'sales-team' && salesTeam.length === 0) {
      loadSalesTeam()
    }
  }, [activeTab])

  // Load clients when switching to clients tab
  useEffect(() => {
    if (activeTab === 'clients' && clients.length === 0) {
      loadClients()
    }
  }, [activeTab])

 
  


  // Category Performance Calculations
  const categoryPerformance = useMemo(() => {
    return leadCategories.map((category, index) => {
      const categoryLeads = assignedLeads.filter(lead => lead.category && (lead.category._id || lead.category.id) === (category._id || category.id))
      const totalLeads = categoryLeads.length
      
      // Calculate conversion rates based on lead status
      const convertedLeads = categoryLeads.filter(lead => 
        lead.status === 'converted' || lead.status === 'client' || lead.status === 'closed'
      ).length
      
      const hotLeads = categoryLeads.filter(lead => lead.status === 'hot' || lead.priority === 'high').length
      const warmLeads = categoryLeads.filter(lead => lead.status === 'warm' || lead.priority === 'medium').length
      const coldLeads = categoryLeads.filter(lead => lead.status === 'cold' || lead.priority === 'low').length
      const lostLeads = categoryLeads.filter(lead => lead.status === 'lost' || lead.status === 'notInterested').length
      
      // Calculate revenue
      const totalRevenue = categoryLeads.reduce((sum, lead) => sum + (lead.value || 0), 0)
      const convertedRevenue = categoryLeads
        .filter(lead => lead.status === 'converted' || lead.status === 'client' || lead.status === 'closed')
        .reduce((sum, lead) => sum + (lead.value || 0), 0)
      
      // Calculate conversion rate
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0
      
      // Calculate average deal value
      const avgDealValue = convertedLeads > 0 ? convertedRevenue / convertedLeads : 0
      
      // Calculate response rate (leads with recent contact)
      const recentContactLeads = categoryLeads.filter(lead => {
        const lastContact = new Date(lead.lastContact)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        return lastContact >= thirtyDaysAgo
      }).length
      
      const responseRate = totalLeads > 0 ? (recentContactLeads / totalLeads) * 100 : 0
      
      return {
        ...category,
        totalLeads,
        convertedLeads,
        hotLeads,
        warmLeads,
        coldLeads,
        lostLeads,
        totalRevenue,
        convertedRevenue,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgDealValue: Math.round(avgDealValue),
        responseRate: Math.round(responseRate * 100) / 100,
        unassignedLeads: categoryLeads.filter(lead => lead.assignedTo === 'Unassigned').length
      }
    })
  }, [assignedLeads, leadCategories])

  // Overall performance metrics
  const overallPerformance = useMemo(() => {
    // Total Leads uses totalLeadsCount from loadLeads API (accurate unassigned count)
    const totalLeads = totalLeadsCount > 0 ? totalLeadsCount : (statistics?.leads?.unassigned || 0)
    
    // Other metrics based on unassigned leads only
    const totalConverted = allLeads.filter(lead => 
      lead.status === 'converted' || lead.status === 'client' || lead.status === 'closed'
    ).length
    const totalRevenue = allLeads.reduce((sum, lead) => sum + (lead.value || 0), 0)
    const convertedRevenue = allLeads
      .filter(lead => lead.status === 'converted' || lead.status === 'client' || lead.status === 'closed')
      .reduce((sum, lead) => sum + (lead.value || 0), 0)
    
    const result = {
      totalLeads, // Unassigned leads only from statistics API
      totalConverted, // From unassigned leads
      totalRevenue, // From unassigned leads
      convertedRevenue, // From unassigned leads
      overallConversionRate: allLeads.length > 0 ? Math.round((totalConverted / allLeads.length) * 100 * 100) / 100 : 0,
      avgDealValue: totalConverted > 0 ? Math.round(convertedRevenue / totalConverted) : 0
    }
    
    return result
  }, [totalLeadsCount, statistics, allLeads])

  // Category Performance metrics (for assigned leads only)
  const categoryPerformanceMetrics = useMemo(() => {
    // All metrics based on assigned leads for category performance
    const totalLeads = assignedLeads.length
    const totalConverted = assignedLeads.filter(lead => 
      lead.status === 'converted' || lead.status === 'client' || lead.status === 'closed'
    ).length
    const totalRevenue = assignedLeads.reduce((sum, lead) => sum + (lead.value || 0), 0)
    const convertedRevenue = assignedLeads
      .filter(lead => lead.status === 'converted' || lead.status === 'client' || lead.status === 'closed')
      .reduce((sum, lead) => sum + (lead.value || 0), 0)
    
    const result = {
      totalLeads, // Assigned leads only
      totalConverted, // From assigned leads
      totalRevenue, // From assigned leads
      convertedRevenue, // From assigned leads
      overallConversionRate: totalLeads > 0 ? Math.round((totalConverted / totalLeads) * 100 * 100) / 100 : 0,
      avgDealValue: totalConverted > 0 ? Math.round(convertedRevenue / totalConverted) : 0
    }
    
    return result
  }, [assignedLeads])

  // Load data function
  const loadData = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Reset filter when switching tabs
  useEffect(() => {
    setSelectedFilter('all')
    setSearchTerm('')
    setCurrentPage(1)
    setSelectedCategory('')
  }, [activeTab])

  // Helper functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'hot': return 'bg-red-100 text-red-800 border-red-200'
      case 'connected': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'new': return 'bg-green-100 text-green-800 border-green-200'
      case 'converted': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'lost': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return '₹0'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
    } catch (error) {
      return 'N/A'
    }
  }

  // Format phone number with +91 prefix
  const formatPhoneNumber = (phone) => {
    if (!phone) return 'N/A'
    // If phone is already formatted with country code, return as is
    if (phone.startsWith('+')) return phone
    // Add +91 prefix for Indian numbers
    return `+91 ${phone}`
  }

  const getLeadDisplayValue = (lead) => {
    const candidates = [
      lead?.value,
      lead?.leadProfile?.conversionData?.totalCost,
      lead?.leadProfile?.estimatedCost
    ]
    const numeric = candidates.find((val) => typeof val === 'number' && !Number.isNaN(val))
    return numeric || 0
  }

  const pickFirstString = (...values) => {
    for (const value of values) {
      const rendered = safeRender(value, '').trim()
      if (rendered) return rendered
    }
    return ''
  }

  const getLeadDisplayName = (lead) => {
    return pickFirstString(
      lead?.name,
      lead?.leadProfile?.name,
      lead?.client?.name,
      lead?.contactName,
      lead?.clientDetails?.name
    ) || 'N/A'
  }

  const getLeadDisplayCompany = (lead) => {
    return pickFirstString(
      lead?.company,
      lead?.leadProfile?.businessName,
      lead?.client?.companyName,
      lead?.clientDetails?.company
    ) || 'N/A'
  }

  const getLeadDisplayEmail = (lead) => {
    return pickFirstString(
      lead?.email,
      lead?.leadProfile?.email,
      lead?.client?.email,
      lead?.contactEmail
    ) || 'N/A'
  }

  const getLeadDisplayPhone = (lead) => {
    return pickFirstString(
      lead?.phone,
      lead?.leadProfile?.phone,
      lead?.client?.phoneNumber,
      lead?.client?.phone
    )
  }

  // Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'leads': return leads
      case 'sales-team': return salesTeam
      case 'clients': return clients
      default: return leads
    }
  }

  // Filter data based on search and filter criteria
  const filteredData = useMemo(() => {
    const data = getCurrentData()
    return data.filter(item => {
      const matchesSearch = Object.values(item).some(value => 
        value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
      
      let matchesFilter = true
      if (selectedFilter !== 'all') {
        if (activeTab === 'leads') {
          // Handle date-based filters for leads
          if (selectedFilter === 'today' || selectedFilter === 'week' || selectedFilter === 'month') {
            const itemDate = new Date(item.lastContact)
            const today = new Date()
            const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
            const startOfWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000))
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
            
            switch (selectedFilter) {
              case 'today':
                matchesFilter = itemDate >= startOfToday
                break
              case 'week':
                matchesFilter = itemDate >= startOfWeek
                break
              case 'month':
                matchesFilter = itemDate >= startOfMonth
                break
              default:
                matchesFilter = true
            }
          } else {
            // Handle status-based filters
        matchesFilter = item.status === selectedFilter || item.priority === selectedFilter
          }
        } else {
          matchesFilter = item.status === selectedFilter || item.priority === selectedFilter
        }
      }

      // Handle category filter for leads
      let matchesCategory = true
      if (activeTab === 'leads' && selectedCategory) {
        matchesCategory = item.category && (item.category._id || item.category.id) === selectedCategory
      }
      
      return matchesSearch && matchesFilter && matchesCategory
    })
  }, [activeTab, searchTerm, selectedFilter, selectedCategory, leads, salesTeam, clients])

  // Pagination
  const paginatedData = useMemo(() => {
    // For leads tab, data is already paginated from server - don't slice again
    if (activeTab === 'leads') {
      let sortedData = [...filteredData]
      
      // Sort leads by date (newest first) when on leads tab
      sortedData.sort((a, b) => new Date(b.lastContact || b.createdAt) - new Date(a.lastContact || a.createdAt))
      
      return sortedData // Return already paginated data from server
    }
    
    // For other tabs, do client-side pagination
    let sortedData = [...filteredData]
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedData.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredData, currentPage, itemsPerPage, activeTab])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  
  // Get total count for display - use API total for leads tab, filteredData length for others
  const displayTotal = activeTab === 'leads' ? totalLeadsCount : filteredData.length
  
  // Calculate total pages using API total for leads tab
  const displayTotalPages = activeTab === 'leads' && totalLeadsCount > 0 
    ? Math.ceil(totalLeadsCount / itemsPerPage) 
    : totalPages

  // Management functions
  const handleCreate = (type) => {
    setModalType(type)
    setSelectedItem(null)
    setShowCreateModal(true)
  }

  const handleEdit = (item, type) => {
    setModalType(type)
    setSelectedItem(item)
    setShowEditModal(true)
  }

  // Transform backend leadBreakdown array to frontend object format
  const transformLeadBreakdown = (leadBreakdownArray) => {
    if (!leadBreakdownArray || !Array.isArray(leadBreakdownArray)) {
      return {}
    }
    
    // Create reverse mapping from backend status to frontend key
    const backendToFrontendMap = {
      'new': 'new',
      'connected': 'contacted',
      'not_picked': 'notPicked',
      'followup': 'todayFollowUp',
      'quotation_sent': 'quotationSent',
      'dq_sent': 'dqSent',
      'app_client': 'appClient',
      'web': 'web',
      'converted': 'converted',
      'lost': 'lost',
      'not_interested': 'notInterested',
      'hot': 'hotLead',
      'demo_requested': 'demoSent',
      // 'app' and 'taxi' might need special handling - using app_client for app
      'app': 'appClient'
    }
    
    const breakdownObj = {}
    
    leadBreakdownArray.forEach(item => {
      if (item._id) {
        const backendStatus = item._id
        const frontendKey = backendToFrontendMap[backendStatus] || backendStatus
        
        // If multiple items map to same frontend key (like app_client and app), sum them
        if (breakdownObj[frontendKey]) {
          breakdownObj[frontendKey] += (item.count || 0)
        } else {
          breakdownObj[frontendKey] = item.count || 0
        }
      }
    })
    
    return breakdownObj
  }

  const handleView = async (item, type) => {
    setModalType(type)
    setSelectedItem(item)
    setShowViewModal(true)
    
    // If viewing a sales team member, fetch detailed data including leadBreakdown
    if (type === 'sales-team' && (item._id || item.id)) {
      try {
        setLoadingMemberDetails(true)
        const memberId = item._id || item.id
        const response = await adminSalesService.getSalesTeamMember(memberId)
        let memberLeads = []
        try {
          const leadsResponse = await adminSalesService.getLeadsForMember(memberId, { limit: 500 })
          if (leadsResponse?.success && Array.isArray(leadsResponse.data)) {
            memberLeads = leadsResponse.data
          }
        } catch (leadError) {
          console.error('Error fetching member leads:', leadError)
        }
        
        if (response && response.success && response.data) {
          const transformedLeadBreakdown = transformLeadBreakdown(response.data.leadBreakdown)
          
          setSelectedItem({
            ...item,
            ...response.data,
            leadBreakdown: transformedLeadBreakdown,
            leads: memberLeads
          })
        }
      } catch (error) {
        console.error('Error fetching member details:', error)
        toast.error('Failed to load member details')
        // Continue with existing item data if fetch fails
      } finally {
        setLoadingMemberDetails(false)
      }
    }
  }

  const handleDelete = (item, type) => {
    setModalType(type)
    setSelectedItem(item)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    try {
      if (modalType === 'lead') {
        const leadId = selectedItem._id || selectedItem.id
        const response = await adminSalesService.deleteLead(leadId)
        if (response.success) {
          toast.success('Lead deleted successfully')
          await loadLeads() // Refresh leads list
          await loadAllLeads() // Refresh all leads for statistics
          await loadAssignedLeads() // Refresh assigned leads for category performance
          await loadStatistics() // Refresh statistics
        } else {
          toast.error(response.message || 'Failed to delete lead')
        }
      } else if (modalType === 'category') {
        const categoryId = selectedItem._id || selectedItem.id
        const response = await adminSalesService.deleteLeadCategory(categoryId)
        if (response.success) {
          toast.success('Category deleted successfully')
          await loadCategories() // Refresh categories list
          await loadLeads() // Refresh leads list
          await loadAllLeads() // Refresh all leads for statistics
          await loadAssignedLeads() // Refresh assigned leads for category performance
        } else {
          toast.error(response.message || 'Failed to delete category')
        }
      } else if (modalType === 'sales-team') {
        setDeletingMember(true)
        const memberId = selectedItem._id || selectedItem.id
        const response = await adminSalesService.deleteSalesMember(memberId)
        if (response.success) {
          toast.success('Sales team member deleted successfully')
          await loadSalesTeam() // Refresh sales team list
          await loadStatistics() // Refresh statistics
        } else {
          toast.error(response.message || 'Failed to delete sales team member')
        }
        setDeletingMember(false)
      }
      
    setShowDeleteModal(false)
    setSelectedItem(null)
    } catch (error) {
      console.error('Error deleting item:', error)
      
      // Handle specific error cases
      if (error.message && error.message.includes('not found')) {
        toast.error('Item not found. It may have been deleted already.')
      } else if (error.message && error.message.includes('network')) {
        toast.error('Network error. Please check your connection and try again')
      } else if (error.message && error.message.includes('unauthorized')) {
        toast.error('You are not authorized to perform this action')
      } else {
        toast.error(error.message || 'Failed to delete item')
      }
      
      setShowDeleteModal(false)
      setSelectedItem(null)
      setDeletingMember(false)
    }
  }

  const handleSave = async (formData) => {
    try {
      if (showEditModal && selectedItem) {
        // Update existing lead
        const response = await adminSalesService.updateLead(selectedItem._id || selectedItem.id, formData)
        if (response.success) {
          toast.success('Lead updated successfully')
          await loadLeads() // Refresh leads list
          await loadAllLeads() // Refresh all leads for statistics
          await loadAssignedLeads() // Refresh assigned leads for category performance
          await loadStatistics() // Refresh statistics
        } else {
          toast.error(response.message || 'Failed to update lead')
        }
      } else {
        // Create new lead
        const response = await adminSalesService.createLead(formData)
        if (response.success) {
          toast.success('Lead created successfully')
          await loadLeads() // Refresh leads list
          await loadAllLeads() // Refresh all leads for statistics
          await loadAssignedLeads() // Refresh assigned leads for category performance
          await loadStatistics() // Refresh statistics
        } else {
          toast.error(response.message || 'Failed to create lead')
        }
      }
      
    setShowCreateModal(false)
    setShowEditModal(false)
    setSelectedItem(null)
    } catch (error) {
      console.error('Error saving lead:', error)
      
      // Handle specific error cases
      if (error.message && error.message.includes('already exists')) {
        toast.error('A lead with this phone number already exists')
      } else if (error.message && error.message.includes('validation')) {
        toast.error('Please check your input and try again')
      } else if (error.message && error.message.includes('network')) {
        toast.error('Network error. Please check your connection and try again')
      } else if (error.message && error.message.includes('unauthorized')) {
        toast.error('You are not authorized to perform this action')
      } else {
        toast.error(error.message || 'Failed to save lead. Please try again')
      }
    }
  }

  const closeModals = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setShowViewModal(false)
    setShowDeleteModal(false)
    setShowAddLeadModal(false)
    setShowBulkLeadModal(false)
    setShowTargetModal(false)
    setShowAssignLeadModal(false)
    setShowLeadListModal(false)
    setShowIncentiveModal(false)
    setShowCategoryModal(false)
    setShowCategoryEditModal(false)
    setShowCategoryDeleteModal(false)
    setSelectedItem(null)
    setLeadNumber('')
    setUploadedFile(null)
    setUploadProgress(0)
    setTargetAmount('')
    setLeadsToAssign('')
    setIncentiveAmount('')
    setDistributingLeads(false)
    setLoadingTarget(false)
    setLoadingIncentive(false)
    setDeletingMember(false)
    setSelectedLeadCategory('')
    setSelectedLeadCategoryData([])
    setCategoryName('')
    setCategoryDescription('')
    setCategoryColor('#3B82F6')
    setSelectedCategory('')
    setAssignCategoryFilter('all')
    setLeadsPerCategory({})
    setCreatingCategory(false)
    setDeletingCategory(false)
  }

  // Close only the lead list modal while keeping view details modal open
  const closeLeadListModal = () => {
    setShowLeadListModal(false)
    setSelectedLeadCategory('')
    setSelectedLeadCategoryData([])
  }

  // Status mapping - frontend key to backend value
  const statusMap = {
    'new': 'new',
    'contacted': 'connected',
    'notPicked': 'not_picked',
    'todayFollowUp': 'followup',
    'quotationSent': 'quotation_sent',
    'dqSent': 'dq_sent',
    'appClient': 'app_client',
    'web': 'web',
    'converted': 'converted',
    'lost': 'lost',
    'notInterested': 'not_interested',
    'hotLead': 'hot',
    'demoSent': 'demo_requested',
    'app': 'app_client', // app likely means app_client
    'taxi': 'web' // taxi might be categorized as web or could be separate
  }

  // Map frontend status keys to backend status values
  const mapStatusKeyToBackendStatus = (statusKey) => {
    return statusMap[statusKey] || statusKey
  }

  // Handle lead category click - fetch real leads from API
  const handleLeadCategoryClick = async (categoryKey, member) => {
    try {
      console.log('Lead category clicked:', categoryKey, member, selectedItem)
      
      // Use selectedItem if available, otherwise use member parameter
      const targetMember = selectedItem || member
      if (!targetMember) {
        toast.error('Member information not available')
        return
      }
      
      const memberId = targetMember._id || targetMember.id
      if (!memberId) {
        toast.error('Member ID not found')
        return
      }
      
      // Map frontend status key to backend status
      const backendStatus = mapStatusKeyToBackendStatus(categoryKey)
      
      // Set loading state
      setLoadingLeads(true)
      setShowLeadListModal(true)
      setSelectedLeadCategory(categoryKey)
      
      // Fetch leads filtered by status and assignedTo
      const params = {
        status: backendStatus,
        assignedTo: memberId,
        page: 1,
        limit: 100 // Get up to 100 leads for this status
      }
      
      console.log('Fetching leads with params:', params)
      const response = await adminSalesService.getAllLeads(params)
      console.log('Leads response:', response)
      
      if (response && response.success && response.data) {
        setSelectedLeadCategoryData(response.data || [])
        if ((response.data || []).length === 0) {
          toast.info(`No leads found for ${categoryKey} status`)
        }
      } else {
        toast.error('Failed to load leads')
        setSelectedLeadCategoryData([])
      }
    } catch (error) {
      console.error('Error fetching leads by status:', error)
      toast.error(error.message || 'Failed to load leads')
      setSelectedLeadCategoryData([])
    } finally {
      setLoadingLeads(false)
    }
  }

  // Handle category card click in view details modal
  const handleCategoryCardClick = (category, member) => {
    // Get leads assigned to this member in this category
    const categoryLeads = leads.filter(lead => 
      lead.assignedTo === member.name && lead.category && (lead.category._id || lead.category.id) === (category._id || category.id)
    )
    
    if (categoryLeads.length > 0) {
      setSelectedLeadCategory(category.name)
      setSelectedLeadCategoryData(categoryLeads)
      setShowLeadListModal(true)
    }
  }

  // Generate mock leads for a specific category
  const generateMockLeadsForCategory = (category, count, assignedTo) => {
    const categoryLabels = {
      new: 'New Lead',
      contacted: 'Contacted',
      notPicked: 'Not Picked',
      todayFollowUp: 'Today Follow Up',
      quotationSent: 'Quotation Sent',
      dqSent: 'D&Q Sent',
      appClient: 'App Client',
      web: 'Web',
      converted: 'Converted',
      lost: 'Lost',
      notInterested: 'Not Interested',
      hotLead: 'Hot Lead',
      demoSent: 'Demo Sent',
      app: 'App',
      taxi: 'Taxi'
    }

    return Array.from({ length: count }, (_, index) => ({
      id: Date.now() + index,
      name: `Lead ${index + 1}`,
      phone: `+91 98765${String(43210 + index).padStart(5, '0')}`,
      email: `lead${index + 1}@example.com`,
      company: 'Unknown Company',
      status: category,
      priority: category === 'hotLead' ? 'high' : category === 'lost' || category === 'notInterested' ? 'low' : 'medium',
      source: 'manual',
      value: 0,
      lastContact: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      nextFollowUp: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignedTo: assignedTo,
      notes: `${categoryLabels[category]} - Assigned to ${assignedTo}`,
      category: categoryLabels[category]
    }))
  }

  // Handle single lead addition
  const handleAddLead = async () => {
    // Validation
    if (!leadNumber.trim()) {
      toast.error('Phone number is required')
      return
    }
    
    if (!selectedCategory) {
      toast.error('Please select a category')
      return
    }
    
    // Validate phone number format
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/
    if (!phoneRegex.test(leadNumber.trim())) {
      toast.error('Please enter a valid phone number')
      return
    }
    
    try {
    
    // Get selected category details
      const selectedCategoryData = leadCategories.find(cat => 
        (cat._id || cat.id) === selectedCategory
      )
      
      if (!selectedCategoryData) {
        toast.error('Selected category not found')
        return
      }
      
      // Create lead data for API
      const leadData = {
        phone: leadNumber.trim(),
        category: selectedCategory,
        priority: 'medium',
        source: 'manual',
        notes: 'Manually added lead'
      }
      
      const response = await adminSalesService.createLead(leadData)
      
      if (response.success) {
        toast.success('Lead added successfully')
        await loadLeads() // Refresh leads list
        await loadStatistics() // Refresh statistics
        setShowAddLeadModal(false)
        setLeadNumber('')
        setSelectedCategory('')
      } else {
        // Handle specific error cases
        if (response.message && response.message.includes('already exists')) {
          toast.error('A lead with this phone number already exists')
        } else if (response.message && response.message.includes('validation')) {
          toast.error('Please check your input and try again')
        } else {
          toast.error(response.message || 'Failed to add lead')
        }
      }
    } catch (error) {
      console.error('Error adding lead:', error)
      
      // Handle specific error cases
      if (error.message && error.message.includes('already exists')) {
        toast.error('A lead with this phone number already exists')
      } else if (error.message && error.message.includes('validation')) {
        toast.error('Please check your input and try again')
      } else if (error.message && error.message.includes('network')) {
        toast.error('Network error. Please check your connection and try again')
      } else if (error.message && error.message.includes('unauthorized')) {
        toast.error('You are not authorized to perform this action')
      } else {
        toast.error(error.message || 'Failed to add lead. Please try again')
      }
    }
  }

  // Handle bulk lead upload
  const handleBulkUpload = async () => {
    // Validation
    if (!uploadedFile) {
      toast.error('Please select a file to upload')
      return
    }
    
    if (!selectedCategory) {
      toast.error('Please select a category')
      return
    }
    
    try {
    setUploadProgress(0)
      
      // Show file processing message
      toast.info(`Processing ${uploadedFile.name}...`)
      
      // Parse file to extract phone numbers
      const phoneNumbers = await adminSalesService.parseFileForBulkUpload(uploadedFile)
      
      if (phoneNumbers.length === 0) {
        toast.error('No valid phone numbers found in file. Please check format.')
        return
      }
      
      // Show info toast with count
      toast.info(`Found ${phoneNumbers.length} valid phone numbers`)
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
        }
        return prev + 10
      })
    }, 200)
      
      // Call API to create bulk leads
      const response = await adminSalesService.createBulkLeads(
        phoneNumbers, 
        selectedCategory, 
        'medium'
      )
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      if (response.success) {
        // Success messages
        if (response.data.created > 0) {
          toast.success(`${response.data.created} leads uploaded successfully`)
        }
        
        if (response.data.skipped > 0) {
          toast.warning(`${response.data.skipped} leads were skipped due to errors`)
          // Log detailed errors for debugging
          if (response.data.errors && response.data.errors.length > 0) {
            // Show first few errors in console for debugging
            const firstErrors = response.data.errors.slice(0, 5)
          }
        }
        
        // Refresh data
        await Promise.all([
          loadLeads(),
          loadStatistics(),
          loadCategories()
        ])
        
        // Close modal and reset form
        closeModals()
      } else {
        // Handle specific backend error cases
        if (response.message && response.message.includes('already exists')) {
          toast.error('Some leads already exist in the system')
        } else if (response.message && response.message.includes('validation')) {
          toast.error('Invalid phone number format in file')
        } else if (response.message && response.message.includes('category')) {
          toast.error('Invalid category selected')
        } else if (response.message && response.message.includes('limit')) {
          toast.error('Too many leads in file. Maximum 1000 leads allowed')
        } else {
          toast.error(response.message || 'Failed to upload leads')
        }
      }
    } catch (error) {
      console.error('Error uploading bulk leads:', error)
      
      // Handle specific error cases
      if (error.message && error.message.includes('Excel')) {
        toast.error('Failed to parse Excel file. Please check file format and try again')
      } else if (error.message && error.message.includes('CSV')) {
        toast.error('Failed to parse CSV file. Please check file format and try again')
      } else if (error.message && error.message.includes('text')) {
        toast.error('Failed to parse text file. Please check file format and try again')
      } else if (error.message && error.message.includes('file format')) {
        toast.error('Invalid file format. Please upload Excel (.xlsx), CSV (.csv), or Text (.txt) files')
      } else if (error.message && error.message.includes('network')) {
        toast.error('Network error. Please check your connection and try again')
      } else if (error.message && error.message.includes('unauthorized')) {
        toast.error('You are not authorized to perform this action')
      } else if (error.message && error.message.includes('Failed to load Excel parser')) {
        toast.error('Excel parser not available. Please try uploading as CSV or text file')
      } else {
        toast.error(error.message || 'Failed to upload leads. Please try again')
      }
    } finally {
      setUploadProgress(0)
    }
  }

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['.xlsx', '.xls', '.csv', '.txt']
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
      
      if (!allowedTypes.includes(fileExtension)) {
        toast.error('Invalid file type. Please upload Excel (.xlsx, .xls), CSV (.csv), or Text (.txt) files')
        event.target.value = '' // Clear the input
        return
      }
      
      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024 // 10MB in bytes
      if (file.size > maxSize) {
        toast.error('File size too large. Maximum file size is 10MB')
        event.target.value = '' // Clear the input
        return
      }
      
      setUploadedFile(file)
      toast.success(`File "${file.name}" selected successfully`)
    }
  }

  // Handle target editing
  const handleEditTarget = (member) => {
    setSelectedItem(member)
    setTargetAmount((member.salesTarget || 0).toString())
    setShowTargetModal(true)
  }

  const handleSaveTarget = async () => {
    if (!targetAmount || !selectedItem) {
      toast.error('Please enter a valid target amount')
      return
    }
    
    const newTarget = parseFloat(targetAmount)
    if (isNaN(newTarget) || newTarget < 0) {
      toast.error('Please enter a valid target amount')
      return
    }

    try {
      setLoadingTarget(true)
      const memberId = selectedItem._id || selectedItem.id
      const response = await adminSalesService.setSalesTarget(memberId, newTarget)
      
      if (response.success) {
        toast.success('Target set successfully')
        await loadSalesTeam()
        await loadStatistics()
        setShowTargetModal(false)
        setSelectedItem(null)
        setTargetAmount('')
      } else {
        toast.error(response.message || 'Failed to set target')
      }
    } catch (error) {
      console.error('Error setting target:', error)
      toast.error(error.message || 'Failed to set target')
    } finally {
      setLoadingTarget(false)
    }
  }

  // Handle lead assignment
  const handleAssignLead = (member) => {
    setSelectedItem(member)
    setLeadsToAssign('')
    setAssignCategoryFilter('all')
    
    // Calculate employee statistics from assignedLeads
    const employeeLeads = assignedLeads.filter(lead => {
      if (!lead.assignedTo) return false
      // Handle populated assignedTo object (from getAllLeads API)
      if (typeof lead.assignedTo === 'object' && lead.assignedTo._id) {
        return lead.assignedTo._id.toString() === member._id.toString()
      }
      // Handle unpopulated assignedTo (ObjectId string)
      return lead.assignedTo.toString() === member._id.toString()
    })
    const employeeConverted = employeeLeads.filter(lead => 
      lead.status === 'converted' || lead.status === 'client' || lead.status === 'closed'
    ).length
    
    // Update member performance stats if not already set correctly
    if (!member.performance || member.performance.totalLeads !== employeeLeads.length || member.performance.convertedLeads !== employeeConverted) {
      member.performance = {
        ...member.performance,
        totalLeads: employeeLeads.length,
        convertedLeads: employeeConverted
      }
    }
    
    // Calculate leads per category - use allLeads instead of paginated leads
    const unassignedLeads = allLeads.filter(lead => !lead.assignedTo || lead.assignedTo === null || lead.assignedTo === 'Unassigned')
    const categoryBreakdown = {}
    
    leadCategories.forEach(category => {
      const categoryLeads = unassignedLeads.filter(lead => lead.category && (lead.category._id || lead.category.id) === (category._id || category.id))
      categoryBreakdown[category._id || category.id] = {
        name: category.name,
        icon: category.icon,
        color: category.color,
        count: categoryLeads.length
      }
    })
    
    setLeadsPerCategory(categoryBreakdown)
    setShowAssignLeadModal(true)
  }

  // Handle incentive editing
  const handleEditIncentive = (member) => {
    setSelectedItem(member)
    setIncentiveAmount((member.incentivePerClient || 0).toString())
    setShowIncentiveModal(true)
  }

  const handleSaveIncentive = async () => {
    if (!incentiveAmount || !selectedItem) {
      toast.error('Please enter a valid incentive amount')
      return
    }
    
    const newIncentive = parseFloat(incentiveAmount)
    if (isNaN(newIncentive) || newIncentive < 0) {
      toast.error('Please enter a valid incentive amount')
      return
    }

    try {
      setLoadingIncentive(true)
      const memberId = selectedItem._id || selectedItem.id
      const response = await adminSalesService.setIncentive(memberId, newIncentive)
      
      if (response.success) {
        toast.success('Per-conversion incentive amount set successfully')
        await loadSalesTeam()
        await loadStatistics()
        setShowIncentiveModal(false)
        setSelectedItem(null)
        setIncentiveAmount('')
      } else {
        toast.error(response.message || 'Failed to set incentive')
      }
    } catch (error) {
      console.error('Error setting incentive:', error)
      toast.error(error.message || 'Failed to set incentive')
    } finally {
      setLoadingIncentive(false)
    }
  }

  const handleSaveLeadAssignment = async () => {
    if (!leadsToAssign || !selectedItem) return
    
    const numberOfLeads = parseInt(leadsToAssign)
    if (isNaN(numberOfLeads) || numberOfLeads <= 0) {
      toast.error('Please enter a valid number of leads')
      return
    }

    // Calculate available leads - use allLeads instead of paginated leads
    const categoryId = assignCategoryFilter === 'all' ? 'all' : assignCategoryFilter
    const unassignedLeads = allLeads.filter(lead => !lead.assignedTo || lead.assignedTo === null || lead.assignedTo === 'Unassigned')
    
    let availableLeads
    if (categoryId === 'all') {
      availableLeads = unassignedLeads.length
    } else {
      availableLeads = unassignedLeads.filter(lead => 
        lead.category && (lead.category._id || lead.category.id) === categoryId
      ).length
    }

    // Validate requested count
    if (numberOfLeads > availableLeads) {
      toast.error(`Only ${availableLeads} leads available. Please enter a lower number.`)
      return
    }

    try {
      setDistributingLeads(true)
      const salesMemberId = selectedItem._id || selectedItem.id
      
      const response = await adminSalesService.distributeLeads(salesMemberId, numberOfLeads, categoryId)
      
      if (response.success) {
        toast.success(`${response.data.leadsDistributed} leads distributed successfully`)
        await Promise.all([
          loadLeads(),
          loadAllLeads(), // Refresh all leads for statistics
          loadAssignedLeads(), // Refresh assigned leads for category performance
          loadSalesTeam(),
          loadStatistics()
        ])
    closeModals()
      } else {
        toast.error(response.message || 'Failed to distribute leads')
      }
    } catch (error) {
      console.error('Error distributing leads:', error)
      
      // Enhanced error messages
      if (error.message && error.message.includes('No unassigned leads')) {
        toast.error('No unassigned leads available for distribution')
      } else if (error.message && error.message.includes('not found')) {
        toast.error('Sales team member not found')
      } else if (error.message && error.message.includes('network')) {
        toast.error('Network error. Please check your connection')
      } else {
        toast.error(error.message || 'Failed to distribute leads')
      }
    } finally {
      setDistributingLeads(false)
    }
  }

  // Category management functions
  const handleCreateCategory = async () => {
    // Validation
    if (!categoryName.trim()) {
      toast.error('Category name is required')
      return
    }

    if (categoryName.trim().length < 2) {
      toast.error('Category name must be at least 2 characters long')
      return
    }
    
    if (categoryName.trim().length > 50) {
      toast.error('Category name cannot exceed 50 characters')
      return
    }
    
    if (!categoryColor || !categoryColor.match(/^#[0-9A-F]{6}$/i)) {
      toast.error('Please select a valid color')
      return
    }
    
    if (creatingCategory) return // Prevent multiple submissions
    
    try {
      setCreatingCategory(true)
      const categoryData = {
        name: categoryName.trim(),
        description: categoryDescription.trim(),
        color: categoryColor,
        icon: '📋' // Default icon
      }
      
      const response = await adminSalesService.createLeadCategory(categoryData)
      
      if (response.success) {
        toast.success('Category created successfully')
        await loadCategories() // Refresh categories list
    closeModals()
      } else {
        // Handle specific error cases
        if (response.message && response.message.includes('already exists')) {
          toast.error('A category with this name already exists')
        } else if (response.message && response.message.includes('validation')) {
          toast.error('Please check your input and try again')
        } else {
          toast.error(response.message || 'Failed to create category')
        }
      }
    } catch (error) {
      console.error('Error creating category:', error)
      
      // Handle specific error cases
      if (error.message && error.message.includes('already exists')) {
        toast.error('A category with this name already exists')
      } else if (error.message && error.message.includes('validation')) {
        toast.error('Please check your input and try again')
      } else if (error.message && error.message.includes('network')) {
        toast.error('Network error. Please check your connection and try again')
      } else if (error.message && error.message.includes('unauthorized')) {
        toast.error('You are not authorized to perform this action')
      } else {
        toast.error(error.message || 'Failed to create category. Please try again')
      }
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleEditCategory = (category) => {
    setSelectedItem(category)
    setCategoryName(category.name)
    setCategoryDescription(category.description)
    setCategoryColor(category.color)
    setShowCategoryEditModal(true)
  }

  const handleUpdateCategory = async () => {
    // Validation
    if (!categoryName.trim()) {
      toast.error('Category name is required')
      return
    }
    
    if (categoryName.trim().length < 2) {
      toast.error('Category name must be at least 2 characters long')
      return
    }
    
    if (categoryName.trim().length > 50) {
      toast.error('Category name cannot exceed 50 characters')
      return
    }
    
    if (!categoryColor || !categoryColor.match(/^#[0-9A-F]{6}$/i)) {
      toast.error('Please select a valid color')
      return
    }
    
    if (!selectedItem) {
      toast.error('No category selected for update')
      return
    }
    
    try {
      const categoryData = {
        name: categoryName.trim(),
        description: categoryDescription.trim(),
            color: categoryColor 
          }
      
      const response = await adminSalesService.updateLeadCategory(selectedItem._id || selectedItem.id, categoryData)
      if (response.success) {
        toast.success('Category updated successfully')
        await loadCategories() // Refresh categories list
    closeModals()
      } else {
        // Handle specific error cases
        if (response.message && response.message.includes('already exists')) {
          toast.error('A category with this name already exists')
        } else if (response.message && response.message.includes('not found')) {
          toast.error('Category not found. It may have been deleted')
        } else {
          toast.error(response.message || 'Failed to update category')
        }
      }
    } catch (error) {
      console.error('Error updating category:', error)
      
      // Handle specific error cases
      if (error.message && error.message.includes('already exists')) {
        toast.error('A category with this name already exists')
      } else if (error.message && error.message.includes('not found')) {
        toast.error('Category not found. It may have been deleted')
      } else if (error.message && error.message.includes('network')) {
        toast.error('Network error. Please check your connection and try again')
      } else if (error.message && error.message.includes('unauthorized')) {
        toast.error('You are not authorized to perform this action')
      } else {
        toast.error(error.message || 'Failed to update category. Please try again')
      }
    }
  }

  const handleDeleteCategory = async (category) => {
    if (deletingCategory) return // Prevent multiple deletions
    
    try {
      // Set the category to delete and show confirmation modal
      setSelectedItem(category)
      setShowCategoryDeleteModal(true)
    } catch (error) {
      console.error('Error preparing category deletion:', error)
      toast.error('Error preparing category deletion')
    }
  }

  const confirmDeleteCategory = async () => {
    if (!selectedItem || deletingCategory) return
    
    try {
      setDeletingCategory(true)
      
      const categoryId = selectedItem._id || selectedItem.id;
      if (!categoryId) {
        toast.error('Category ID not found');
        return;
      }
      
      const response = await adminSalesService.deleteLeadCategory(categoryId)
      
      if (response.success) {
        toast.success('Category deleted successfully')
        await loadCategories() // Refresh categories list
        await loadLeads() // Refresh leads list
        setShowCategoryDeleteModal(false)
        setSelectedItem(null)
      } else {
        // Handle specific error cases
        if (response.message && response.message.includes('associated leads')) {
          toast.error('Cannot delete category because it has associated leads. Please reassign or delete the leads first.')
        } else if (response.message && response.message.includes('not found')) {
          toast.error('Category not found. It may have already been deleted.')
        } else {
          toast.error(response.message || 'Failed to delete category')
        }
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      
      // Handle specific error cases
      if (error.message && error.message.includes('associated leads')) {
        toast.error('Cannot delete category because it has associated leads. Please reassign or delete the leads first.')
      } else if (error.message && error.message.includes('not found')) {
        toast.error('Category not found. It may have already been deleted.')
      } else if (error.message && error.message.includes('network')) {
        toast.error('Network error. Please check your connection and try again')
      } else if (error.message && error.message.includes('unauthorized')) {
        toast.error('You are not authorized to perform this action')
      } else {
        toast.error(error.message || 'Failed to delete category. Please try again')
      }
    } finally {
      setDeletingCategory(false)
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
      <div className="ml-64 pt-20 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Sales Management
                </h1>
                <p className="text-gray-600">
                  Monitor sales performance, leads, and sales team activities.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowAddLeadModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <FiPlus className="h-4 w-4" />
                  <span>Add Lead</span>
                </button>
                <button
                  onClick={() => setShowBulkLeadModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiUpload className="h-4 w-4" />
                  <span>Add Bulk Lead</span>
                </button>
              <button
                onClick={loadData}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiRefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              </div>
            </div>
          </div>

          {/* Statistics Cards - Row 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4"
          >
            {/* Total Leads */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-blue-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <FiUsers className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-blue-700">+{statistics?.leads?.new || 0}</p>
                    <p className="text-xs text-blue-600">this month</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-700 mb-1">Total Leads</p>
                  <p className="text-lg font-bold text-blue-800">
                    {totalLeadsCount > 0 ? totalLeadsCount : (statistics?.leads?.unassigned ?? 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Sales */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-green-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-emerald-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-emerald-400/20 to-green-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <FiCreditCard className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-emerald-700">{statistics?.sales?.conversion || 0}%</p>
                    <p className="text-xs text-emerald-600">conversion</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-emerald-700 mb-1">Total Sales</p>
                  <p className="text-lg font-bold text-emerald-800">
                    {loadingStatistics ? '...' : formatCurrency(statistics?.sales?.total || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Earnings Collected */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-violet-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-purple-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-purple-400/20 to-violet-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <FiTrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-purple-700">{formatCurrency(statistics?.earnings?.pending || 0)}</p>
                    <p className="text-xs text-purple-600">pending</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-purple-700 mb-1">Earnings Collected</p>
                  <p className="text-lg font-bold text-purple-800">{formatCurrency(statistics?.earnings?.collected || 0)}</p>
                </div>
              </div>
            </div>

            {/* Sales Team */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-amber-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-orange-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-orange-400/20 to-amber-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <FiUser className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-orange-700">{statistics?.team?.performance || 0}%</p>
                    <p className="text-xs text-orange-600">performance</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-orange-700 mb-1">Sales Team</p>
                  <p className="text-lg font-bold text-orange-800">{statistics?.team?.total || 0}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Statistics Cards - Row 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
          >
            {/* New Leads */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-green-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <FiPlus className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-green-700">Fresh</p>
                    <p className="text-xs text-green-600">prospects</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-green-700 mb-1">New Leads</p>
                  <p className="text-lg font-bold text-green-800">{statistics?.leads?.new || 0}</p>
                </div>
              </div>
            </div>

            {/* Connected Leads */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50 to-blue-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-indigo-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-indigo-400/20 to-blue-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10">
                    <FiPhone className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-indigo-700">In contact</p>
                    <p className="text-xs text-indigo-600">active</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-indigo-700 mb-1">Connected</p>
                  <p className="text-lg font-bold text-indigo-800">{statistics?.leads?.connected || 0}</p>
                </div>
              </div>
            </div>

            {/* Hot Leads */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-50 to-pink-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-rose-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-rose-400/20 to-pink-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-rose-500/10">
                    <FiStar className="h-4 w-4 text-rose-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-rose-700">High priority</p>
                    <p className="text-xs text-rose-600">urgent</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-rose-700 mb-1">Hot Leads</p>
                  <p className="text-lg font-bold text-rose-800">{statistics?.leads?.hot || 0}</p>
                </div>
              </div>
            </div>

            {/* Total Clients */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-teal-50 to-cyan-100 p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-teal-200/50">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-teal-400/20 to-cyan-500/20 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-teal-500/10">
                    <FiHome className="h-4 w-4 text-teal-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-teal-700">{statistics?.clients?.retention || 0}%</p>
                    <p className="text-xs text-teal-600">retention</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-teal-700 mb-1">Total Clients</p>
                  <p className="text-lg font-bold text-teal-800">{statistics?.clients?.total || 0}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'leads', label: 'Leads', icon: FiUsers },
                { key: 'sales-team', label: 'Sales Team', icon: FiUser },
                { key: 'clients', label: 'Clients', icon: FiHome },
                { key: 'category-performance', label: 'Category Performance', icon: FiTrendingUp }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Search and Filter */}
            <div className="p-6 border-b border-gray-200">
               <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="w-full lg:w-80 relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                     placeholder={activeTab === 'leads' ? 'Search phone numbers...' : `Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                 <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                   {activeTab === 'leads' ? (
                     <>
                       <div className="relative w-full sm:w-48">
                         <select
                           value={selectedFilter}
                           onChange={(e) => setSelectedFilter(e.target.value)}
                           className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white appearance-none cursor-pointer hover:border-gray-400 transition-colors shadow-sm"
                         >
                           <option value="all">📋 All Leads</option>
                           <option value="today">📅 Today</option>
                           <option value="week">📊 This Week</option>
                           <option value="month">📈 This Month</option>
                           <option value="hot">🔥 Hot Leads</option>
                           <option value="connected">🤝 Connected</option>
                           <option value="new">🆕 New Leads</option>
                           <option value="converted">✅ Converted</option>
                           <option value="lost">❌ Lost</option>
                         </select>
                         <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                           <FiFilter className="h-4 w-4 text-gray-400" />
                         </div>
                       </div>
                       <div className="relative w-full sm:w-48">
                         <select
                           value={selectedCategory}
                           onChange={(e) => setSelectedCategory(e.target.value)}
                           className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white appearance-none cursor-pointer hover:border-gray-400 transition-colors shadow-sm"
                         >
                           <option value="">🏷️ All Categories</option>
                           {leadCategories.map((category, index) => (
                             <option key={category._id || category.id || `category-${index}`} value={category._id || category.id}>
                               {safeRender(category.icon, '📋')} {safeRender(category.name, 'Category')}
                             </option>
                           ))}
                         </select>
                         <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                           <FiTarget className="h-4 w-4 text-gray-400" />
                         </div>
                       </div>
                     </>
                   ) : (
                     <div className="relative w-full sm:w-48">
                       <select
                         value={selectedFilter}
                         onChange={(e) => setSelectedFilter(e.target.value)}
                         className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white appearance-none cursor-pointer hover:border-gray-400 transition-colors shadow-sm"
                       >
                         <option value="all">All Status</option>
                         {activeTab === 'sales-team' && (
                           <>
                             <option value="active">Active</option>
                             <option value="inactive">Inactive</option>
                           </>
                         )}
                         {activeTab === 'clients' && (
                           <>
                             <option value="active">Active</option>
                             <option value="inactive">Inactive</option>
                           </>
                         )}
                       </select>
                       <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                         <FiFilter className="h-4 w-4 text-gray-400" />
                       </div>
                     </div>
                   )}
                 </div>
               </div>
             </div>

            {/* Content based on active tab */}
            <div className="p-6">
              {activeTab === 'leads' && (
                <div className="space-y-6">
                  {/* Leads Management Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Lead Management</h3>
                        <p className="text-gray-600 text-sm mt-1">Organize and manage your leads with categories</p>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => setShowCategoryModal(true)}
                          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                        >
                          <FiTarget className="h-4 w-4" />
                          <span>Manage Categories</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Category Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {leadCategories.map((category, index) => (
                        <div key={category._id || category.id || `category-${index}`} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                              style={{ backgroundColor: category.color }}
                            >
                              {safeRender(category.icon, '📋')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">{category.name}</div>
                              <div className="text-xs text-gray-500">{category.leadCount} leads</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Leads List */}
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">All Leads</h3>
                        <div className="text-sm text-gray-500">
                          {activeTab === 'leads' ? totalLeadsCount : filteredData.length} leads found
                        </div>
                        </div>
                      </div>
                      
                    <div className="divide-y divide-gray-200">
                      {paginatedData.length > 0 ? paginatedData.map((lead, index) => (
                        <div key={lead._id || lead.id || `lead-${index}`} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">{index + 1 + ((currentPage - 1) * itemsPerPage)}</span>
                        </div>
                              <div>
                                <div className="text-lg font-semibold text-gray-900 font-mono">
                                  {formatPhoneNumber(lead?.phone)}
                      </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span>Added: {formatDate(lead?.createdAt)}</span>
                        </div>
                        </div>
                      </div>
                      
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${getStatusColor(lead?.status || 'new')}`}>
                                {lead?.status || 'new'}
                              </span>
                              {lead?.category && (
                                <span 
                                  className="inline-flex px-2 py-1 text-xs font-bold rounded-full text-white"
                                  style={{ backgroundColor: lead.category?.color || '#6B7280' }}
                                >
                                  {safeRender(lead.category?.icon, '📋')} {safeRender(lead.category?.name, 'N/A')}
                                </span>
                              )}
                          <button 
                            onClick={() => handleDelete(lead, 'lead')}
                                className="text-gray-400 hover:text-red-600 p-2 rounded hover:bg-red-50 transition-all duration-200"
                                title="Delete Lead"
                          >
                                <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                      <FiUsers className="h-12 w-12 mb-4 text-gray-300" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Leads Found</h3>
                      <p className="text-sm text-gray-600 text-center max-w-md">
                        No leads are available at the moment. Leads will appear here once they are added to the system.
                      </p>
                    </div>
                  )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'sales-team' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {paginatedData.length > 0 ? paginatedData.map((member, index) => (
                    <div key={member._id || member.id || `member-${index}`} className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all duration-200 hover:scale-105 group">
                      {/* Header Section */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                          {member?.avatar || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 truncate">{member?.name || 'Unknown Member'}</h3>
                          <p className="text-xs text-gray-600 font-medium">{member?.position || 'Sales Rep'}</p>
                          <span className={`inline-flex px-1.5 py-0.5 text-xs font-bold rounded-full border mt-1 ${getStatusColor(member?.status || 'active')}`}>
                            {member?.status || 'active'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-blue-50 rounded-lg p-2">
                          <div className="text-xs text-blue-600 font-medium mb-1">Leads</div>
                          <div className="text-xs font-bold text-blue-800">
                            {member?.performance?.totalLeads || 0}
                          </div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-2">
                          <div className="text-xs text-purple-600 font-medium mb-1">Converted</div>
                          <div className="text-xs font-bold text-purple-800">
                            {member?.performance?.convertedLeads || 0}
                          </div>
                        </div>
                      </div>
                      
                      {/* Revenue Metrics */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-orange-50 rounded-lg p-2">
                          <div className="text-xs text-orange-600 font-medium mb-1">Revenue</div>
                          <div className="text-xs font-bold text-orange-800">
                            {formatCurrency(member?.performance?.totalValue || 0)}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="text-xs text-gray-600 font-medium mb-1">Target</div>
                          <div className="text-xs font-bold text-gray-800">
                            {formatCurrency(member?.salesTarget || 0)}
                          </div>
                        </div>
                      </div>

                      {/* Incentive Metrics */}
                      <div className="bg-green-50 rounded-lg p-2 mb-2">
                        <div className="text-xs text-green-600 font-medium mb-1">Per Conversion</div>
                        <div className="text-xs font-bold text-green-800">
                          {formatCurrency(member?.incentivePerClient || 0)}
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2 mb-3">
                        <div className="text-xs text-blue-600 font-medium mb-1">Total Earned</div>
                        <div className="text-xs font-bold text-blue-800">
                          {formatCurrency(member?.currentIncentive || 0)}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-center pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-1">
                          <button 
                            onClick={() => handleView(member, 'sales-team')}
                            className="text-gray-400 hover:text-primary p-1.5 rounded hover:bg-primary/10 transition-all duration-200 group-hover:text-primary"
                            title="View Details"
                          >
                            <FiEye className="h-3 w-3" />
                          </button>
                          <button 
                            onClick={() => handleEditTarget(member)}
                            className="text-gray-400 hover:text-orange-600 p-1.5 rounded hover:bg-orange-50 transition-all duration-200 group-hover:text-orange-600"
                            title="Edit Target"
                          >
                            <FiTarget className="h-3 w-3" />
                          </button>
                          <button 
                            onClick={() => handleAssignLead(member)}
                            className="text-gray-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 transition-all duration-200 group-hover:text-blue-600"
                            title="Assign Leads"
                          >
                            <FiUsers className="h-3 w-3" />
                          </button>
                          <button 
                            onClick={() => handleEditIncentive(member)}
                            className="text-gray-400 hover:text-green-600 p-1.5 rounded hover:bg-green-50 transition-all duration-200 group-hover:text-green-600"
                            title="Set Incentive"
                          >
                            <FiCreditCard className="h-3 w-3" />
                          </button>
                          <button 
                            onClick={() => handleDelete(member, 'sales-team')}
                            className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-all duration-200 group-hover:text-red-600"
                            title="Delete Member"
                          >
                            <FiTrash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                      <FiUser className="h-12 w-12 mb-4 text-gray-300" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sales Team Found</h3>
                      <p className="text-sm text-gray-600 text-center max-w-md">
                        No sales team members are available at the moment. Sales team members will appear here once they are added to the system.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'clients' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {paginatedData.length > 0 ? paginatedData.map((client) => (
                    <div key={client.id} className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all duration-200 hover:scale-105 group">
                      {/* Header Section */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                          {client?.avatar || 'C'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 truncate">{client?.name || 'Unknown Client'}</h3>
                          <p className="text-xs text-gray-600 font-medium">{client?.contactPerson || 'N/A'}</p>
                          <span className={`inline-flex px-1.5 py-0.5 text-xs font-bold rounded-full border mt-1 ${getStatusColor(client?.status || 'active')}`}>
                            {client?.status || 'active'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Revenue Highlight */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-green-700">Total Spent</span>
                          <span className="text-sm font-bold text-green-600">{formatCurrency(client?.totalSpent || 0)}</span>
                        </div>
                      </div>
                      
                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-blue-50 rounded-lg p-2">
                          <div className="text-xs text-blue-600 font-medium mb-1">Projects</div>
                          <div className="text-xs font-bold text-blue-800">{client?.projectsCompleted || 0}</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-2">
                          <div className="text-xs text-purple-600 font-medium mb-1">Industry</div>
                          <div className="text-xs font-bold text-purple-800">{client?.industry || 'N/A'}</div>
                        </div>
                      </div>
                      
                      {/* Location & Contact Info */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-orange-50 rounded-lg p-2">
                          <div className="text-xs text-orange-600 font-medium mb-1">Location</div>
                          <div className="text-xs font-bold text-orange-800">{client?.location || 'N/A'}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="text-xs text-gray-600 font-medium mb-1">Joined</div>
                          <div className="text-xs font-bold text-gray-800">{formatDate(client?.joinDate || new Date())}</div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-1">
                          <button 
                            onClick={() => handleView(client, 'clients')}
                            className="text-gray-400 hover:text-primary p-1.5 rounded hover:bg-primary/10 transition-all duration-200 group-hover:text-primary"
                            title="View Details"
                          >
                            <FiEye className="h-3 w-3" />
                          </button>
                          <button 
                            onClick={() => handleEdit(client, 'clients')}
                            className="text-gray-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 transition-all duration-200 group-hover:text-blue-600"
                            title="Edit Client"
                          >
                            <FiEdit3 className="h-3 w-3" />
                          </button>
                          <button 
                            onClick={() => handleDelete(client, 'clients')}
                            className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-all duration-200 group-hover:text-red-600"
                            title="Delete Client"
                          >
                            <FiTrash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="text-xs text-gray-400 font-medium">
                          {formatDate(client?.lastContact || new Date())}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                      <FiHome className="h-12 w-12 mb-4 text-gray-300" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Clients Found</h3>
                      <p className="text-sm text-gray-600 text-center max-w-md">
                        No clients are available at the moment. Clients will appear here once they are added to the system.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'category-performance' && (
                <div className="space-y-6">
                  {/* Overall Performance Header */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Category Performance Breakdown</h3>
                        <p className="text-gray-600 text-sm mt-1">Analyze lead conversion rates and performance by category</p>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">{categoryPerformance.length}</span> categories analyzed
                      </div>
                    </div>
                    
                    {/* Overall Performance Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FiUsers className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Total Leads</div>
                            <div className="text-lg font-bold text-gray-900">{categoryPerformanceMetrics.totalLeads}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <FiCheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Converted</div>
                            <div className="text-lg font-bold text-gray-900">{categoryPerformanceMetrics.totalConverted}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <FiTrendingUp className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Conversion Rate</div>
                            <div className="text-lg font-bold text-gray-900">{categoryPerformanceMetrics.overallConversionRate}%</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <FiCreditCard className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Avg Deal Value</div>
                            <div className="text-lg font-bold text-gray-900">{formatCurrency(categoryPerformanceMetrics.avgDealValue)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category Performance Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {categoryPerformance.map((category, index) => (
                      <div key={category._id || category.id || `category-${index}`} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 hover:scale-105">
                        {/* Category Header */}
                        <div className="flex items-center space-x-2 mb-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 truncate">{category.name}</h4>
                            <p className="text-xs text-gray-600 truncate">{category.description}</p>
                          </div>
                        </div>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-blue-50 rounded-lg p-2">
                            <div className="text-xs text-blue-600 font-medium mb-1">Total Leads</div>
                            <div className="text-lg font-bold text-blue-800">{category.totalLeads}</div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2">
                            <div className="text-xs text-green-600 font-medium mb-1">Converted</div>
                            <div className="text-lg font-bold text-green-800">{category.convertedLeads}</div>
                          </div>
                        </div>

                        {/* Conversion Rate */}
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3 mb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-purple-600 font-medium">Conversion Rate</div>
                              <div className="text-lg font-bold text-purple-800">{category.conversionRate}%</div>
                            </div>
                            <div className="w-12 h-12 relative">
                              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                  className="text-gray-200"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  fill="none"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                  className="text-purple-600"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeDasharray={`${category.conversionRate}, 100`}
                                  fill="none"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Total Revenue */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <FiCreditCard className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-green-600 font-medium">Total Revenue</div>
                              <div className="text-sm font-bold text-green-800 truncate">{formatCurrency(category.totalRevenue)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, displayTotal)} of {displayTotal} {activeTab}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {displayTotalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, displayTotalPages))}
                    disabled={currentPage === displayTotalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"
            onClick={closeModals}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
              <p className="text-gray-600 mb-4">
                {modalType === 'sales-team' 
                  ? `Are you sure you want to delete "${selectedItem?.name}" from the sales team? This action cannot be undone.`
                  : `Are you sure you want to delete this ${modalType}? This action cannot be undone.`
                }
              </p>
              {modalType === 'sales-team' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> If this sales team member has assigned leads, you'll need to reassign or delete them first.
                  </p>
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeModals}
                  disabled={deletingMember}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deletingMember}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {deletingMember ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Add Lead Modal */}
        {showAddLeadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeModals}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Add New Lead</h3>
                  <p className="text-gray-600 text-sm mt-1">Enter the lead number to create a new lead</p>
                </div>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Lead Number
                  </label>
                  <input
                    type="text"
                    value={leadNumber}
                    onChange={(e) => setLeadNumber(e.target.value)}
                    placeholder="Enter lead number (e.g., +91 9876543210)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the phone number or contact number of the lead
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    required
                  >
                    <option value="">Select a category</option>
                    {leadCategories.map((category, index) => (
                      <option key={category._id || category.id || `category-${index}`} value={category._id || category.id}>
                        {safeRender(category.icon, '📋')} {safeRender(category.name, 'Category')}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose a category to organize this lead
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLead}
                  disabled={!leadNumber.trim()}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <FiPlus className="h-4 w-4" />
                  <span>Add Lead</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Bulk Lead Upload Modal */}
        {showBulkLeadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeModals}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Bulk Lead Upload</h3>
                  <p className="text-gray-600 text-sm mt-1">Upload a file containing phone numbers (one per line)</p>
                </div>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* File Upload Section */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Upload File
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center space-y-3"
                    >
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <FiUpload className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {uploadedFile ? uploadedFile.name : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Excel (.xlsx, .xls), CSV (.csv), or Text (.txt) files with phone numbers
                        </p>
                      </div>
                    </label>
                  </div>
                  
                  {uploadedFile && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FiFile className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">{uploadedFile.name}</span>
                        <span className="text-xs text-green-600">
                          ({(uploadedFile.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Assign Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    required
                  >
                    <option value="">Select a category</option>
                    {leadCategories.map((category, index) => (
                      <option key={category._id || category.id || `category-${index}`} value={category._id || category.id}>
                        {safeRender(category.icon, '📋')} {safeRender(category.name, 'Category')}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    Choose a category to assign to all leads in this upload
                  </p>
                </div>

                {/* File Format Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">File Format Requirements</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• File should contain only phone numbers (one per line)</li>
                    <li>• Each line represents one lead number</li>
                    <li>• Phone numbers can be 10 digits (9755620716) or with country code (+91 9755620716)</li>
                    <li>• System will automatically handle country code normalization</li>
                    <li>• Supported formats: Excel (.xlsx, .xls), CSV (.csv), or Text (.txt)</li>
                    <li>• Maximum file size: 10MB</li>
                  </ul>
                  <div className="mt-3 p-2 bg-white rounded border border-blue-300">
                    <p className="text-xs text-blue-700 font-medium mb-1">Example formats (all valid):</p>
                    <div className="text-xs text-blue-600 font-mono">
                      9755620716<br/>
                      +91 9755620717<br/>
                      919755620718
                    </div>
                  </div>
                </div>

                {/* Upload Progress */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">Processing file...</span>
                      <span className="text-gray-500">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {uploadProgress === 100 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FiCheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Successfully uploaded and processed leads!
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={!uploadedFile || uploadProgress > 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {uploadProgress > 0 ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                  <FiUpload className="h-4 w-4" />
                  <span>Upload & Process</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Sales Team View Details Modal */}
        {showViewModal && modalType === 'sales-team' && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeModals}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-4 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Sales Team Member Details</h3>
                  <p className="text-gray-600 text-xs mt-1">{selectedItem.name}</p>
                </div>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {/* Member Overview */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                      {selectedItem.avatar}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900">{selectedItem.name}</h4>
                      <p className="text-gray-600 font-medium text-sm">{selectedItem.position}</p>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${getStatusColor(selectedItem.status)}`}>
                          {selectedItem.status}
                        </span>
                        <span className="text-xs text-gray-500">Joined: {formatDate(selectedItem.joinDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-white rounded-lg p-2 text-center">
                        <div className="text-xs text-blue-600 font-medium">Performance</div>
                        <div className="text-lg font-bold text-blue-800">
                          {selectedItem?.performance?.conversionRate !== undefined
                            ? `${Math.round(selectedItem.performance.conversionRate)}%`
                            : selectedItem?.performance?.conversionRatePercent !== undefined
                            ? `${Math.round(selectedItem.performance.conversionRatePercent)}%`
                            : `${Math.round(selectedItem?.conversionRate || 0)}%`}
                        </div>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center">
                        <div className="text-xs text-green-600 font-medium">Revenue</div>
                        <div className="text-lg font-bold text-green-700">
                          {formatCurrency(
                            selectedItem?.performance?.totalValue ??
                              selectedItem?.performance?.totalRevenue ??
                              selectedItem?.totalRevenue ??
                              0
                          )}
                        </div>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center">
                    <div className="text-xs text-purple-600 font-medium">Total Leads</div>
                    <div className="text-lg font-bold text-purple-700">{selectedItem?.performance?.totalLeads || 0}</div>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center">
                    <div className="text-xs text-orange-600 font-medium">Converted</div>
                    <div className="text-lg font-bold text-orange-700">{selectedItem?.performance?.convertedLeads || 0}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Category-Based Lead Distribution */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h5 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <FiTarget className="h-5 w-5 mr-2 text-purple-600" />
                      Lead Distribution by Category
                    </h5>
                    <div className="space-y-3">
                      {leadCategories.map((category) => {
                        // Calculate leads for this category assigned to this member
                        const memberLeads = selectedItem?.leads || []
                        const categoryLeads = memberLeads.filter(lead =>
                          lead.category && (lead.category._id || lead.category.id) === (category._id || category.id)
                        )
                        const categoryCount = categoryLeads.length
                        const conversionRate = categoryCount > 0
                          ? Math.round(
                              (categoryLeads.filter(lead => lead.status === 'converted' || lead.status === 'client' || lead.status === 'closed').length / categoryCount) * 100
                            )
                          : 0
                        
                        return (
                          <button
                            key={category.id}
                            onClick={() => handleCategoryCardClick(category, selectedItem)}
                            disabled={categoryCount === 0}
                            className={`w-full bg-gray-50 rounded-lg p-3 border border-gray-200 hover:shadow-md transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                              categoryCount > 0 ? 'hover:scale-105 cursor-pointer hover:border-gray-300' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                                  style={{ backgroundColor: category.color }}
                                >
                                  {safeRender(category.icon, '📋')}
                                </div>
                                <div>
                                  <h6 className="font-semibold text-gray-900 text-sm">{category.name}</h6>
                                  <p className="text-xs text-gray-500">{category.description}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-bold" style={{ color: category.color }}>
                                  {categoryCount}
                                </div>
                                <div className="text-xs text-gray-500">leads</div>
                              </div>
                            </div>
                            
                            {categoryCount > 0 && (
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-white rounded p-1">
                                  <div className="text-xs text-gray-600">Active</div>
                                  <div className="font-semibold text-blue-600 text-sm">
                                    {categoryLeads.filter(lead => !['converted', 'client', 'closed', 'lost', 'notInterested'].includes(lead.status)).length}
                                  </div>
                                </div>
                                <div className="bg-white rounded p-1">
                                  <div className="text-xs text-gray-600">Converted</div>
                                  <div className="font-semibold text-green-600 text-sm">
                                    {categoryLeads.filter(lead => lead.status === 'converted' || lead.status === 'client' || lead.status === 'closed').length}
                                  </div>
                                </div>
                                <div className="bg-white rounded p-1">
                                  <div className="text-xs text-gray-600">Rate</div>
                                  <div className="font-semibold text-purple-600 text-sm">{conversionRate}%</div>
                                </div>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h5 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <FiTrendingUp className="h-5 w-5 mr-2 text-green-600" />
                      Performance Metrics
                    </h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-600 font-medium mb-1">Conversion Rate</div>
                        <div className="text-lg font-bold text-gray-900">
                          {(() => {
                            if (selectedItem?.performance?.conversionRate !== undefined) {
                              return `${Math.round(selectedItem.performance.conversionRate)}%`
                            }
                            if (selectedItem?.performance?.conversionRatePercent !== undefined) {
                              return `${Math.round(selectedItem.performance.conversionRatePercent)}%`
                            }
                            if (selectedItem?.leadsCount > 0) {
                              return `${Math.round((selectedItem.convertedCount / selectedItem.leadsCount) * 100)}%`
                            }
                            return '0%'
                          })()}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-600 font-medium mb-1">Target Achievement</div>
                        <div className="text-lg font-bold text-gray-900">
                          {(() => {
                            const target =
                              selectedItem?.target ??
                              selectedItem?.performance?.target ??
                              0
                            const achieved =
                              selectedItem?.performance?.achieved ??
                              selectedItem?.performance?.achievedValue ??
                              selectedItem?.revenue ??
                              0
                            if (target > 0) {
                              return `${Math.round((achieved / target) * 100)}%`
                            }
                            return '0%'
                          })()}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-600 font-medium mb-1">Avg Lead Value</div>
                        <div className="text-lg font-bold text-gray-900">
                          {(() => {
                            const leadsCount =
                              selectedItem?.performance?.totalLeads ??
                              selectedItem?.leadsCount ??
                              0
                            const revenue =
                              selectedItem?.performance?.totalRevenue ??
                              selectedItem?.revenue ??
                              0
                            if (leadsCount > 0) {
                              return formatCurrency(revenue / leadsCount)
                            }
                            return formatCurrency(0)
                          })()}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-600 font-medium mb-1">Per Conversion Rate</div>
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(selectedItem?.incentivePerClient ?? 0)}
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <div className="text-xs text-green-600 font-medium mb-1">Total Earned</div>
                        <div className="text-lg font-bold text-green-800">
                          {formatCurrency(selectedItem?.currentIncentive ?? 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Lead Status Breakdown */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h5 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <FiUsers className="h-5 w-5 mr-2 text-blue-600" />
                      Lead Status Breakdown
                      {loadingMemberDetails && (
                        <span className="ml-2 text-sm text-gray-500">(Loading...)</span>
                      )}
                    </h5>
                    {loadingMemberDetails ? (
                      <div className="flex justify-center items-center py-8">
                        <Loading size="small" />
                      </div>
                    ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {[
                        { key: 'new', label: 'New Leads', color: 'bg-green-50 text-green-700 border-green-200', icon: '🆕' },
                        { key: 'contacted', label: 'Contacted', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '📞' },
                        { key: 'notPicked', label: 'Not Picked', color: 'bg-red-50 text-red-700 border-red-200', icon: '📵' },
                        { key: 'todayFollowUp', label: 'Today Follow Up', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: '📅' },
                        { key: 'quotationSent', label: 'Quotation Sent', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: '📄' },
                        { key: 'dqSent', label: 'D&Q Sent', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: '📤' },
                        { key: 'appClient', label: 'App Client', color: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: '📱' },
                        { key: 'web', label: 'Web', color: 'bg-teal-50 text-teal-700 border-teal-200', icon: '🌐' },
                        { key: 'converted', label: 'Converted', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '✅' },
                        { key: 'lost', label: 'Lost', color: 'bg-gray-50 text-gray-700 border-gray-200', icon: '❌' },
                        { key: 'notInterested', label: 'Not Interested', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: '😞' },
                        { key: 'hotLead', label: 'Hot Lead', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: '🔥' },
                        { key: 'demoSent', label: 'Demo Sent', color: 'bg-violet-50 text-violet-700 border-violet-200', icon: '🎯' },
                        { key: 'app', label: 'App', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: '📲' },
                        { key: 'taxi', label: 'Taxi', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '🚕' }
                      ].map((category, index) => {
                        // Ensure leadBreakdown is in object format
                        let leadBreakdown = selectedItem?.leadBreakdown
                        
                        // If leadBreakdown is an array, transform it
                        if (Array.isArray(leadBreakdown)) {
                          leadBreakdown = transformLeadBreakdown(leadBreakdown)
                        }
                        
                        // Fallback to empty object if no leadBreakdown
                        if (!leadBreakdown || typeof leadBreakdown !== 'object') {
                          leadBreakdown = {
                            new: 0,
                            contacted: 0,
                            notPicked: 0,
                            todayFollowUp: 0,
                            quotationSent: 0,
                            dqSent: 0,
                            appClient: 0,
                            web: 0,
                            converted: 0,
                            lost: 0,
                            notInterested: 0,
                            hotLead: 0,
                            demoSent: 0,
                            app: 0,
                            taxi: 0
                          }
                        }
                        
                        const count = leadBreakdown[category.key] || 0
                        return (
                          <button
                            key={category.key || `category-${index}`}
                            onClick={() => {
                              console.log('Button clicked for category:', category.key, 'selectedItem:', selectedItem)
                              handleLeadCategoryClick(category.key, selectedItem)
                            }}
                            className={`${category.color} rounded-lg p-3 border-2 hover:shadow-md transition-all duration-200 text-left ${
                              count > 0 ? 'hover:scale-105 cursor-pointer' : 'cursor-pointer opacity-75'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-lg">{safeRender(category.icon, '📋')}</span>
                              <span className="text-lg font-bold">{count}</span>
                            </div>
                            <div className="text-xs font-medium truncate">{category.label}</div>
                          </button>
                        )
                      })}
                    </div>
                    )}
                  </div>

                  {/* Member Information */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h5 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <FiUser className="h-5 w-5 mr-2 text-blue-600" />
                      Contact Information
                    </h5>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                        <FiMail className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-xs text-gray-600">Email</div>
                          <div className="font-semibold text-gray-900 text-sm">{selectedItem.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                        <FiPhone className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-xs text-gray-600">Phone</div>
                          <div className="font-semibold text-gray-900 text-sm">{selectedItem.phone}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setShowViewModal(false)
                      setShowTargetModal(true)
                    }}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold flex items-center space-x-1 text-sm"
                  >
                    <FiTarget className="h-3 w-3" />
                    <span>Edit Target</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false)
                      setShowAssignLeadModal(true)
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold flex items-center space-x-1 text-sm"
                  >
                    <FiUsers className="h-3 w-3" />
                    <span>Assign Leads</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false)
                      setShowIncentiveModal(true)
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold flex items-center space-x-1 text-sm"
                  >
                    <FiCreditCard className="h-3 w-3" />
                    <span>Set Incentive</span>
                  </button>
                </div>
                <button
                  onClick={closeModals}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Client View Details Modal */}
        {showViewModal && modalType === 'clients' && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeModals}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Client Details</h3>
                  <p className="text-gray-600 text-sm mt-1">Complete information about the client</p>
                </div>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {/* Client Overview */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 mb-6 border border-teal-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-md">
                      {selectedItem.avatar}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-1">{selectedItem.name}</h4>
                      <p className="text-gray-600 font-medium mb-1">{selectedItem.contactPerson}</p>
                      <p className="text-gray-500">{selectedItem.industry}</p>
                    </div>
                  </div>
                  <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${getStatusColor(selectedItem.status)}`}>
                    {selectedItem.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-sm text-green-600 font-medium mb-1">Total Spent</div>
                    <div className="text-lg font-bold text-green-700">{formatCurrency(selectedItem.totalSpent)}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-sm text-blue-600 font-medium mb-1">Projects</div>
                    <div className="text-lg font-bold text-blue-800">{selectedItem.projectsCompleted}</div>
                  </div>
                </div>
              </div>

              {/* Client Information */}
              <div className="mb-6">
                <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiHome className="h-5 w-5 mr-2 text-teal-600" />
                  Client Information
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 font-medium mb-1">Company Name</div>
                    <div className="text-base font-semibold text-gray-900">{selectedItem.name}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 font-medium mb-1">Contact Person</div>
                    <div className="text-base font-semibold text-gray-900">{selectedItem.contactPerson}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 font-medium mb-1">Email</div>
                    <div className="text-base font-semibold text-gray-900">{selectedItem.email}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 font-medium mb-1">Phone</div>
                    <div className="text-base font-semibold text-gray-900">{selectedItem.phone}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 font-medium mb-1">Industry</div>
                    <div className="text-base font-semibold text-gray-900">{selectedItem.industry}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 font-medium mb-1">Location</div>
                    <div className="text-base font-semibold text-gray-900">{selectedItem.location}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 font-medium mb-1">Join Date</div>
                    <div className="text-base font-semibold text-gray-900">{formatDate(selectedItem.joinDate)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 font-medium mb-1">Last Contact</div>
                    <div className="text-base font-semibold text-gray-900">{formatDate(selectedItem.lastContact)}</div>
                  </div>
                </div>
              </div>

              {/* Business Metrics */}
              <div className="mb-6">
                <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiTrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Business Metrics
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-sm text-green-600 font-medium mb-1">Total Revenue</div>
                    <div className="text-lg font-bold text-green-700">{formatCurrency(selectedItem.totalSpent)}</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-sm text-blue-600 font-medium mb-1">Projects Completed</div>
                    <div className="text-lg font-bold text-blue-700">{selectedItem.projectsCompleted}</div>
                  </div>
                </div>
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 font-medium mb-2">Average Project Value</div>
                  <div className="text-lg font-bold text-gray-900">
                    {formatCurrency(selectedItem.totalSpent / selectedItem.projectsCompleted)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    setShowEditModal(true)
                  }}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold flex items-center space-x-2"
                >
                  <FiEdit3 className="h-4 w-4" />
                  <span>Edit Client</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Target Edit Modal */}
        {showTargetModal && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeModals}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Set Target</h3>
                  <p className="text-gray-600 text-sm mt-1">Set revenue target for {selectedItem.name}</p>
                </div>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {/* Current Target Display */}
              <div className="bg-orange-50 rounded-lg p-4 mb-6 border border-orange-200">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {selectedItem.avatar}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{selectedItem.name}</h4>
                    <p className="text-sm text-gray-600">{selectedItem.position}</p>
                    <div className="text-sm text-orange-700 font-medium">
                      Current Target: {formatCurrency(selectedItem.salesTarget || 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Target Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Target Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="Enter target amount"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg font-semibold"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Enter the revenue target for this sales team member</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTarget}
                  disabled={!targetAmount || parseFloat(targetAmount) < 0 || loadingTarget}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loadingTarget ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Setting...</span>
                    </>
                  ) : (
                    <>
                      <FiTarget className="h-4 w-4" />
                      <span>Set Target</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Assign Lead Modal */}
        {showAssignLeadModal && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeModals}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Assign Leads</h3>
                  <p className="text-gray-600 text-sm mt-1">Assign leads to {selectedItem.name}</p>
                </div>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {/* Member Info */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {selectedItem.avatar}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{selectedItem.name}</h4>
                    <p className="text-sm text-gray-600">{selectedItem.position}</p>
                    <div className="flex items-center space-x-4 text-sm text-blue-700">
                      {(() => {
                        // Calculate employee statistics from assignedLeads
                        const employeeLeads = assignedLeads.filter(lead => {
                          if (!lead.assignedTo) return false
                          // Handle populated assignedTo object (from getAllLeads API)
                          if (typeof lead.assignedTo === 'object' && lead.assignedTo._id) {
                            return lead.assignedTo._id.toString() === selectedItem._id.toString()
                          }
                          // Handle unpopulated assignedTo (ObjectId string)
                          return lead.assignedTo.toString() === selectedItem._id.toString()
                        })
                        const employeeConverted = employeeLeads.filter(lead => 
                          lead.status === 'converted' || lead.status === 'client' || lead.status === 'closed'
                        ).length
                        return (
                          <>
                            <span>Current Leads: {employeeLeads.length}</span>
                            <span>Converted: {employeeConverted}</span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Available Leads by Category */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Available Leads by Category</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(leadsPerCategory).map(([categoryId, categoryData]) => (
                    <div 
                      key={categoryId}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        assignCategoryFilter === categoryId 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{safeRender(categoryData.icon, '📋')}</span>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{categoryData.name}</div>
                            <div className="text-xs text-gray-500">Available leads</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold" style={{ color: categoryData.color }}>
                            {categoryData.count}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Category</label>
                <select
                  value={assignCategoryFilter}
                  onChange={(e) => setAssignCategoryFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(leadsPerCategory).map(([categoryId, categoryData]) => (
                    <option key={categoryId} value={categoryId}>
                      {categoryData.icon} {categoryData.name} ({categoryData.count} leads)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a specific category to assign leads from, or choose "All Categories" for mixed assignment
                </p>
              </div>

              {/* Number of Leads Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Leads to Assign</label>
                <div className="relative">
                  <input
                    type="number"
                    value={leadsToAssign}
                    onChange={(e) => setLeadsToAssign(e.target.value)}
                    placeholder="Enter number of leads to assign"
                    min="1"
                    max={assignCategoryFilter === 'all' 
                      ? leads.filter(lead => !lead.assignedTo || lead.assignedTo === null).length
                      : leadsPerCategory[assignCategoryFilter]?.count || 0
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Enter how many leads you want to assign to {selectedItem.name}
                  </p>
                  <p className="text-xs font-medium text-blue-600">
                    Available: {
                      assignCategoryFilter === 'all' 
                        ? leads.filter(lead => !lead.assignedTo || lead.assignedTo === null).length
                        : leadsPerCategory[assignCategoryFilter]?.count || 0
                    }
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLeadAssignment}
                  disabled={!leadsToAssign || parseInt(leadsToAssign) <= 0 || distributingLeads}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {distributingLeads ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Distributing...</span>
                    </>
                  ) : (
                    <>
                  <FiUsers className="h-4 w-4" />
                  <span>Assign {leadsToAssign || 0} Lead{leadsToAssign && parseInt(leadsToAssign) > 1 ? 's' : ''}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Lead List Modal */}
        {showLeadListModal && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeLeadListModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {(() => {
                      const statusLabels = {
                        new: 'New Leads',
                        contacted: 'Contacted',
                        notPicked: 'Not Picked',
                        todayFollowUp: 'Today Follow Up',
                        quotationSent: 'Quotation Sent',
                        dqSent: 'D&Q Sent',
                        appClient: 'App Client',
                        web: 'Web',
                        converted: 'Converted',
                        lost: 'Lost',
                        notInterested: 'Not Interested',
                        hotLead: 'Hot Lead',
                        demoSent: 'Demo Sent',
                        app: 'App',
                        taxi: 'Taxi'
                      }
                      return statusLabels[selectedLeadCategory] || 'Lead Category'
                    })()} - {selectedItem?.name || 'Unknown'}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {loadingLeads ? 'Loading leads...' : `${selectedLeadCategoryData.length} leads found`}
                  </p>
                </div>
                <button
                  onClick={closeLeadListModal}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {/* Lead List */}
              {loadingLeads ? (
                <div className="flex justify-center items-center py-12">
                  <Loading size="medium" />
                </div>
              ) : selectedLeadCategoryData.length === 0 ? (
                <div className="text-center py-12">
                  <FiAlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No leads found for this status</p>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Company</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Value</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Priority</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedLeadCategoryData.map((lead, index) => (
                      <tr key={lead._id || lead.id || `lead-${index}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          {getLeadDisplayName(lead)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                          {(() => {
                            const phone = getLeadDisplayPhone(lead)
                            return phone ? formatPhoneNumber(phone) : 'N/A'
                          })()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {getLeadDisplayCompany(lead)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-700">
                          {formatCurrency(getLeadDisplayValue(lead))}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {getLeadDisplayEmail(lead)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${getStatusColor(lead.status || 'new')}`}>
                            {lead.status || 'new'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${getPriorityColor(lead.priority || 'medium')}`}>
                            {lead.priority || 'medium'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button 
                            onClick={() => handleDelete(lead, 'lead')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-all duration-200"
                            title="Delete Lead"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={closeLeadListModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Export leads functionality
                  }}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold flex items-center space-x-2"
                >
                  <FiFile className="h-4 w-4" />
                  <span>Export Leads</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Incentive Edit Modal */}
        {showIncentiveModal && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeModals}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Set Per-Conversion Incentive</h3>
                  <p className="text-gray-600 text-sm mt-1">Set the incentive amount earned per lead conversion for {selectedItem.name}</p>
                </div>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {/* Current Incentive Display */}
              <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {selectedItem.avatar}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{selectedItem.name}</h4>
                    <p className="text-sm text-gray-600">{selectedItem.position}</p>
                    <div className="mt-2 space-y-1">
                      <div className="text-sm text-green-700 font-medium">
                        Per-Conversion Rate: {formatCurrency(selectedItem.incentivePerClient || 0)}
                      </div>
                      <div className="text-xs text-gray-600">
                        Total Earned: {formatCurrency(selectedItem.currentIncentive || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Incentive Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Per-Conversion Incentive Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={incentiveAmount}
                    onChange={(e) => setIncentiveAmount(e.target.value)}
                    placeholder="Enter amount per conversion"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-semibold"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This amount will be earned each time {selectedItem.name} converts a lead to a client. 
                  The amount will be split 50% current balance and 50% pending balance.
                </p>
                <p className="text-xs text-amber-600 mt-1 font-medium">
                  Note: This only applies to future conversions, existing conversions are not affected.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveIncentive}
                  disabled={!incentiveAmount || parseFloat(incentiveAmount) < 0 || loadingIncentive}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loadingIncentive ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Setting...</span>
                    </>
                  ) : (
                    <>
                  <FiCreditCard className="h-4 w-4" />
                  <span>Set Incentive</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Category Management Modal */}
        {showCategoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeModals}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Manage Lead Categories</h3>
                  <p className="text-gray-600 text-sm mt-1">Create and manage categories for organizing leads</p>
                </div>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {/* Add New Category Form */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Add New Category</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category Name</label>
                    <input
                      type="text"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      placeholder="Enter category name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <input
                      type="text"
                      value={categoryDescription}
                      onChange={(e) => setCategoryDescription(e.target.value)}
                      placeholder="Enter description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={categoryColor}
                        onChange={(e) => setCategoryColor(e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={categoryColor}
                        onChange={(e) => setCategoryColor(e.target.value)}
                        placeholder="#3B82F6"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleCreateCategory}
                    disabled={!categoryName.trim() || creatingCategory}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {creatingCategory ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                    <FiPlus className="h-4 w-4" />
                    <span>Add Category</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Categories List */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-gray-900">Existing Categories</h4>
                {leadCategories.map((category, index) => (
                  <div key={category._id || category.id || `category-${index}`} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                          style={{ backgroundColor: category.color }}
                        >
                          {category.icon}
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900">{category.name}</h5>
                          <p className="text-sm text-gray-600">{category.description}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-gray-500">
                              {category.leadCount} leads
                            </span>
                            <span className="text-xs text-gray-500">
                              Created: {formatDate(category.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50 transition-colors"
                          title="Edit Category"
                        >
                          <FiEdit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category)}
                          disabled={deletingCategory}
                          className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete Category"
                        >
                          {deletingCategory ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                          <FiTrash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Category Edit Modal */}
        {showCategoryEditModal && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeModals}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Edit Category</h3>
                  <p className="text-gray-600 text-sm mt-1">Update category information</p>
                </div>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category Name</label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="Enter category name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={categoryDescription}
                    onChange={(e) => setCategoryDescription(e.target.value)}
                    placeholder="Enter description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={categoryColor}
                      onChange={(e) => setCategoryColor(e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={categoryColor}
                      onChange={(e) => setCategoryColor(e.target.value)}
                      placeholder="#3B82F6"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCategory}
                  disabled={!categoryName.trim()}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Category
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Category Delete Confirmation Modal */}
        {showCategoryDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"
            onClick={closeModals}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Delete Category</h3>
                  <p className="text-gray-600 text-sm mt-1">This action cannot be undone</p>
                </div>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center space-x-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: selectedItem?.color || '#EF4444' }}
                  >
                    {selectedItem?.icon || '📋'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{selectedItem?.name}</h4>
                    <p className="text-sm text-gray-600">{selectedItem?.description}</p>
                    <p className="text-xs text-red-600 mt-1">
                      {selectedItem?.leadCount || 0} leads in this category
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start space-x-3">
                    <FiAlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Warning: This action cannot be undone
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        If this category has associated leads, you'll need to reassign or delete them first.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={closeModals}
                  disabled={deletingCategory}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteCategory}
                  disabled={deletingCategory}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {deletingCategory ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="h-4 w-4" />
                      <span>Delete Category</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Admin_sales_management

