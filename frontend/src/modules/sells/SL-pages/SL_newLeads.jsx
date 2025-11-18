import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiPhone, 
  FiMoreVertical,
  FiFilter,
  FiUser,
  FiSearch,
  FiAlertCircle,
  FiUserCheck,
  FiFileText,
  FiX,
  FiTag
} from 'react-icons/fi'
import { salesLeadService } from '../SL-services'
import { useToast } from '../../../contexts/ToastContext'
import SL_navbar from '../SL-components/SL_navbar'

const SL_newLeads = () => {
  const { toast } = useToast()
  
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLeadId, setSelectedLeadId] = useState(null)
  const [showActionsMenu, setShowActionsMenu] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [leadToDelete, setLeadToDelete] = useState(null)
  const [showConnectedForm, setShowConnectedForm] = useState(false)
  const [selectedLeadForForm, setSelectedLeadForForm] = useState(null)
  const [connectedForm, setConnectedForm] = useState({
    name: '',
    description: '',
    projectType: 'web',
    estimatedPrice: '50000',
    quotationSent: false,
    demoSent: false
  })
  
  // Real lead data state
  const [leadsData, setLeadsData] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoadingLeads, setIsLoadingLeads] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  })
  
  // Total count for statistics (not affected by pagination)
  const [totalNewLeads, setTotalNewLeads] = useState(0)

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const cats = await salesLeadService.getLeadCategories()
      setCategories(cats)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  // Fetch leads from API
  const fetchLeads = async () => {
    setIsLoadingLeads(true)
    try {
      const params = {
        status: 'new',
        page: pagination.page,
        limit: pagination.limit
      }
      
      if (selectedCategory !== 'all') {
        params.category = selectedCategory
      }
      
      if (searchTerm) {
        params.search = searchTerm
      }

      if (selectedFilter !== 'all') {
        params.timeFrame = selectedFilter
      }

      const response = await salesLeadService.getLeadsByStatus('new', params)
      setLeadsData(response.data)
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        pages: response.pages
      })
      // Store total count for statistics display
      setTotalNewLeads(response.total)
    } catch (error) {
      console.error('Error fetching leads:', error)
      // Service already returns empty data on error, just show a subtle message
      if (leadsData.length === 0) {
        toast.error('Unable to load leads. Please check your connection.')
      }
    } finally {
      setIsLoadingLeads(false)
    }
  }

  // Reset pagination when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [selectedCategory, searchTerm, selectedFilter])

  // Fetch categories and leads on component mount and when filters change
  useEffect(() => {
    fetchCategories()
    fetchLeads()
  }, [selectedCategory, searchTerm, selectedFilter, pagination.page])

  const filters = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'week', label: 'Last 7 Days' },
    { id: 'month', label: 'This Month' },
    { id: 'all', label: 'All' }
  ]

  // Since we're fetching filtered data from API, we don't need client-side filtering
  // The API handles search and category filtering
  const filteredLeads = leadsData

  // Get category info helper
  const getCategoryInfo = (categoryIdOrObject) => {
    // Handle null/undefined
    if (!categoryIdOrObject) {
      return { name: 'Unknown', color: '#999999', icon: '📋' }
    }
    
    // If category is already populated (object with properties like name, color, icon), return it directly
    if (typeof categoryIdOrObject === 'object' && categoryIdOrObject.name) {
      return {
        name: categoryIdOrObject.name,
        color: categoryIdOrObject.color || '#999999',
        icon: categoryIdOrObject.icon || '📋'
      }
    }
    
    // If category is an ID (string or ObjectId), find it in categories array
    const categoryId = typeof categoryIdOrObject === 'object' ? categoryIdOrObject._id : categoryIdOrObject
    if (categoryId) {
      const category = categories.find(cat => cat._id === categoryId || cat._id?.toString() === categoryId?.toString())
      if (category) {
        return category
      }
    }
    
    // Return default if not found
    return { name: 'Unknown', color: '#999999', icon: '📋' }
  }


  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-500'
      case 'medium': return 'text-gray-500'
      case 'low': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  const handleCall = (phone) => {
    window.open(`tel:${phone}`, '_self')
  }

  const handleWhatsApp = (phone) => {
    const message = encodeURIComponent("Hello! I'm calling about your inquiry regarding our services. How can I help you today?")
    window.open(`https://wa.me/91${phone}?text=${message}`, '_blank')
  }

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      if (newStatus === 'contacted') {
        setSelectedLeadForForm(leadId)
        setShowConnectedForm(true)
      } else {
        await salesLeadService.updateLeadStatus(leadId, newStatus)
        toast.success(`Lead status updated to ${newStatus}`)
        // Refresh leads data
        fetchLeads()
        // Refresh dashboard stats if available
        if (window.refreshDashboardStats) {
          window.refreshDashboardStats()
        }
      }
    } catch (error) {
      console.error('Error updating lead status:', error)
      toast.error('Failed to update lead status')
    }
    setShowActionsMenu(null)
  }

  const handleNotInterested = async (leadId) => {
    try {
      await salesLeadService.updateLeadStatus(leadId, 'not_interested', 'Not interested')
      toast.success('Lead marked as not interested')
      // Refresh leads data
      fetchLeads()
      // Refresh dashboard stats if available
      if (window.refreshDashboardStats) {
        window.refreshDashboardStats()
      }
    } catch (error) {
      console.error('Error updating lead status:', error)
      toast.error('Failed to update lead status')
    }
    setShowActionsMenu(null)
  }

  const confirmDelete = async () => {
    if (leadToDelete) {
      try {
        await salesLeadService.updateLeadStatus(leadToDelete, 'not_interested', 'Not interested')
        toast({
          title: 'Success',
          description: 'Lead marked as not interested',
          variant: 'default'
        })
        // Refresh leads data
        fetchLeads()
        // Refresh dashboard stats if available
        if (window.refreshDashboardStats) {
          window.refreshDashboardStats()
        }
      } catch (error) {
        console.error('Error updating lead status:', error)
        toast({
          title: 'Error',
          description: 'Failed to update lead status',
          variant: 'destructive'
        })
      }
    }
    setShowDeleteConfirm(false)
    setLeadToDelete(null)
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setLeadToDelete(null)
  }

  const handleConnectedFormChange = (field, value) => {
    setConnectedForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleConnectedFormSubmit = async (e) => {
    e.preventDefault()
    try {
      // First update lead status to connected
      await salesLeadService.updateLeadStatus(selectedLeadForForm, 'connected')
      
      // Then create lead profile
      const profileData = {
        name: connectedForm.name,
        businessName: connectedForm.name, // Using name as business name for now
        email: '', // Will be filled later if available
        projectType: {
          web: connectedForm.projectType === 'web',
          app: connectedForm.projectType === 'app',
          taxi: connectedForm.projectType === 'taxi'
        },
        estimatedCost: parseInt(connectedForm.estimatedPrice) || 0,
        description: connectedForm.description,
        quotationSent: connectedForm.quotationSent,
        demoSent: connectedForm.demoSent
      }
      
      await salesLeadService.createLeadProfile(selectedLeadForForm, profileData)
      
      toast.success('Lead marked as contacted and profile created')
      
      // Refresh leads data
      fetchLeads()
      // Refresh dashboard stats if available
      if (window.refreshDashboardStats) {
        window.refreshDashboardStats()
      }
      
      // Close form and reset
      setShowConnectedForm(false)
      setSelectedLeadForForm(null)
      setConnectedForm({
        name: '',
        description: '',
        projectType: 'web',
        estimatedPrice: '50000',
        quotationSent: false,
        demoSent: false
      })
    } catch (error) {
      console.error('Error creating lead profile:', error)
      toast.error('Failed to create lead profile')
    }
  }

  const closeConnectedForm = () => {
    setShowConnectedForm(false)
    setSelectedLeadForForm(null)
    setConnectedForm({
      name: '',
      description: '',
      projectType: 'web',
      estimatedPrice: '50000',
      quotationSent: false,
      demoSent: false
    })
  }

  // Mobile Lead Card Component - Simplified
  const MobileLeadCard = ({ lead }) => {
    const categoryInfo = getCategoryInfo(lead.category)
    
    return (
      <div className="flex items-center justify-between">
        {/* Left Section - Avatar & Phone */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
              <FiUser className="text-white text-sm" />
            </div>
          </div>

          {/* Phone Number & Category */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{lead.phone}</h3>
            {/* Category Tag */}
            <div className="flex items-center space-x-1 mt-1">
                <span 
                  className="text-xs text-black"
                >
                  {categoryInfo.icon} {categoryInfo.name}
                </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
        {/* Call Button */}
        <button
          onClick={() => handleCall(lead.phone)}
          className="bg-white text-teal-600 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-all duration-200 text-xs font-medium"
        >
          Call
        </button>

        {/* WhatsApp Button */}
        <button
          onClick={() => handleWhatsApp(lead.phone)}
          className="bg-green-500 text-white p-1.5 rounded-lg hover:bg-green-600 transition-all duration-200"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c0 5.449-4.434 9.883-9.881 9.883"/>
          </svg>
        </button>

        {/* More Options */}
        <div className="relative">
          <button
            onClick={() => setShowActionsMenu(showActionsMenu === lead._id ? null : lead._id)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <FiMoreVertical className="text-lg" />
          </button>

          {/* Actions Dropdown */}
          <AnimatePresence>
            {showActionsMenu === lead._id && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2}}
                className="absolute right-0 top-full mt-2 w-36 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
              >
                <div className="py-1.5">
                  <button
                    onClick={() => handleStatusChange(lead._id, 'contacted')}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors duration-200"
                  >
                    Contacted
                  </button>
                  <button
                    onClick={() => handleStatusChange(lead._id, 'not_picked')}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors duration-200"
                  >
                    Not Picked
                  </button>
                  <button
                    onClick={() => handleNotInterested(lead._id)}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                  >
                    Not Interested
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
    )
  }

  // Desktop Lead Card Component - Simplified
  const DesktopLeadCard = ({ lead }) => {
    const categoryInfo = getCategoryInfo(lead.category)
    
    return (
      <div className="flex items-center justify-between">
        {/* Left Section - Avatar & Info */}
        <div className="flex-1 flex items-center space-x-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
              <FiUser className="text-white text-lg" />
            </div>
          </div>

          {/* Phone Number & Category */}
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900">{lead.phone}</h3>
            {/* Category Tag */}
            <div className="flex items-center space-x-2 mt-1">
                <span 
                  className="text-xs text-black"
                >
                  {categoryInfo.icon} {categoryInfo.name}
                </span>
            </div>
          </div>
        </div>

      {/* Actions Section */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => handleCall(lead.phone)}
          className="bg-white text-teal-600 border border-teal-200 px-4 py-2 rounded-lg hover:bg-teal-50 transition-all duration-200 text-sm font-medium"
        >
          Call
        </button>
        
        <button
          onClick={() => handleWhatsApp(lead.phone)}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all duration-200 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c0 5.449-4.434 9.883-9.881 9.883"/>
          </svg>
          <span className="text-sm">WhatsApp</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowActionsMenu(showActionsMenu === lead._id ? null : lead._id)}
            className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-200 transition-all duration-200"
          >
            <FiMoreVertical className="text-lg" />
          </button>

          {/* Actions Dropdown */}
          <AnimatePresence>
            {showActionsMenu === lead._id && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2}}
                className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-200 z-50"
              >
                <div className="py-2.5">
                  <button
                    onClick={() => handleStatusChange(lead._id, 'contacted')}
                    className="w-full px-5 py-3 text-left text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors duration-200"
                  >
                    Mark as Contacted
                  </button>
                  <button
                    onClick={() => handleStatusChange(lead._id, 'not_picked')}
                    className="w-full px-5 py-3 text-left text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors duration-200"
                  >
                    Mark as Not Picked
                  </button>
                  <button
                    onClick={() => handleNotInterested(lead._id)}
                    className="w-full px-5 py-3 text-left text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                  >
                    Mark as Not Interested
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SL_navbar />
      
      <main className="max-w-7xl mx-auto px-4 pt-16 pb-20 sm:px-6 lg:px-8">
        
         {/* Mobile Layout */}
         <div className="lg:hidden">
           {/* Enhanced Header Section */}
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6 }}
             className="mb-6"
           >
             <div className="bg-gradient-to-br from-teal-50 via-teal-100 to-teal-200 rounded-xl p-4 shadow-lg border border-teal-300/40">
               <div className="flex items-center justify-between">
                 {/* Left Section - Title and Description */}
                 <div className="flex items-center space-x-3 flex-1">
                   <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                     <FiUser className="text-white text-lg" />
                   </div>
                   <div>
                     <h1 className="text-lg font-bold text-teal-900">New Leads</h1>
                     <p className="text-teal-700 text-xs">Manage and track your potential customers</p>
                   </div>
                 </div>
                 
                 {/* Right Section - Total Count */}
                 <div className="bg-white/70 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-white/30">
                   <div className="text-center">
                     <p className="text-xs text-teal-600 font-medium mb-0.5">Total</p>
                     <p className="text-xl font-bold text-teal-900">{totalNewLeads}</p>
                     <p className="text-xs text-teal-600 font-medium">Leads</p>
                   </div>
                 </div>
               </div>
             </div>
           </motion.div>


          {/* Simple Modern Filter Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-4"
          >
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-12 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
                  showFilters 
                    ? 'bg-teal-500 text-white shadow-md' 
                    : 'text-gray-500 hover:text-teal-600 hover:bg-teal-50 border border-teal-200'
                }`}
              >
                <FiFilter className="text-base" />
              </button>
            </div>
          </motion.div>

          {/* Filters - Conditional Display */}
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 mb-4"
            >
              {/* Time Filters */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Time Period</h4>
                <div className="flex flex-wrap gap-2">
                  {filters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                        selectedFilter === filter.id
                          ? 'bg-teal-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filters */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Category</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      selectedCategory === 'all'
                        ? 'bg-teal-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.length > 0 ? categories.map((category) => (
                    <button
                      key={category._id}
                      onClick={() => setSelectedCategory(category._id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
                        selectedCategory === category._id
                          ? 'text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      style={{
                        backgroundColor: selectedCategory === category._id ? category.color : undefined
                      }}
                    >
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </button>
                  )) : (
                    <div className="text-xs text-gray-500">Loading categories...</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Results Count */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-4"
          >
            <p className="text-gray-600 text-sm">
              Showing {filteredLeads.length} of {totalNewLeads} leads
            </p>
          </motion.div>

          {/* Mobile Leads List */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="space-y-3"
          >
            <AnimatePresence>
              {isLoadingLeads ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No new leads found</p>
                </div>
              ) : (
                filteredLeads.map((lead, index) => (
                <motion.div
                  key={lead._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300"
                >
                  <MobileLeadCard lead={lead} />
                </motion.div>
              ))
              )}
            </AnimatePresence>

            {/* Empty State */}
            {filteredLeads.length === 0 && !isLoadingLeads && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiSearch className="text-gray-400 text-2xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'Try adjusting your search criteria or filters.' : 'No leads match your current filters.'}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Mobile Pagination */}
            {pagination.pages > 1 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex items-center justify-center space-x-2 mt-6"
              >
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="px-3 py-2 text-sm text-gray-700">
                  Page {pagination.page} of {pagination.pages}
                </span>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-12 gap-8">
            
            {/* Main Content - 8 columns */}
            <div className="col-span-8 space-y-6">
              
              {/* Desktop Header */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex items-center justify-between"
              >
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">New Leads</h1>
                  <p className="text-gray-600 mt-2">Manage and track your potential customers</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-3 rounded-xl">
                    <span className="text-sm font-semibold">Total: {totalNewLeads}</span>
                  </div>
                  <div className="bg-white text-gray-600 px-6 py-3 rounded-xl border border-gray-200">
                    <span className="text-sm font-semibold">Showing: {filteredLeads.length}</span>
                  </div>
                </div>
              </motion.div>

              {/* Desktop Search & Filters */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
              >
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex-1 relative">
                    <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                    <input
                      type="text"
                      placeholder="Search by phone number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 text-lg"
                    />
                  </div>
                </div>
                
                {/* Time Period Filters */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Time Period</h4>
                  <div className="flex flex-wrap gap-2">
                    {filters.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setSelectedFilter(filter.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedFilter === filter.id
                            ? 'bg-teal-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filters */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Category</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedCategory === 'all'
                          ? 'bg-teal-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.length > 0 ? categories.map((category) => (
                      <button
                        key={category._id}
                        onClick={() => setSelectedCategory(category._id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                          selectedCategory === category._id
                            ? 'text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        style={{
                          backgroundColor: selectedCategory === category._id ? category.color : undefined
                        }}
                      >
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </button>
                    )) : (
                      <div className="text-sm text-gray-500">Loading categories...</div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Desktop Leads Grid */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="space-y-3"
              >
                <AnimatePresence>
                  {isLoadingLeads ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, index) => (
                        <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                              <div className="h-4 bg-gray-200 rounded w-20"></div>
                            </div>
                            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredLeads.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-lg">No new leads found</p>
                    </div>
                  ) : (
                    filteredLeads.map((lead, index) => (
                    <motion.div
                      key={lead._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="bg-white rounded-xl p-5 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
                    >
                      <DesktopLeadCard lead={lead} />
                    </motion.div>
                  ))
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Empty State */}
              {filteredLeads.length === 0 && !isLoadingLeads && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FiSearch className="text-gray-400 text-3xl" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4">No leads found</h3>
                    <p className="text-gray-600 text-lg">
                      {searchTerm ? 'Try adjusting your search criteria or filters.' : 'No leads match your current filters.'}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Desktop Pagination */}
              {pagination.pages > 1 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="flex items-center justify-center space-x-4 mt-8"
                >
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                            pagination.page === pageNum
                              ? 'bg-teal-500 text-white'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {pagination.pages > 5 && (
                      <>
                        <span className="text-gray-500">...</span>
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.pages }))}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                            pagination.page === pagination.pages
                              ? 'bg-teal-500 text-white'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pagination.pages}
                        </button>
                      </>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.pages}
                    className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Next
                  </button>
                </motion.div>
              )}
            </div>

            {/* Sidebar - 4 columns */}
            <div className="col-span-4 space-y-6">
            
              {/* Stats Overview */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
                className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-6 shadow-xl border border-teal-200/50"
              >
                <h3 className="text-lg font-bold text-teal-900 mb-4">Lead Analytics</h3>
                
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <span className="text-teal-700 text-sm font-medium">Total Leads</span>
                     <span className="text-teal-900 text-xl font-bold">{totalNewLeads}</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-teal-700 text-sm font-medium">Showing</span>
                     <span className="text-teal-900 text-xl font-bold">{filteredLeads.length}</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-teal-700 text-sm font-medium">High Priority</span>
                     <span className="text-teal-900 text-xl font-bold">{leadsData.filter(lead => lead.priority === 'high').length}</span>
                   </div>
                 </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.8 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                
                <div className="space-y-3">
                  <button className="w-full bg-teal-500 text-white font-semibold py-3 px-4 rounded-xl hover:bg-teal-600 transition-colors duration-200 flex items-center justify-center space-x-2">
                    <FiSearch className="text-lg" />
                    <span>Advanced Search</span>
                  </button>
                  
                  <button className="w-full bg-white text-gray-700 font-semibold py-3 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center space-x-2">
                    <FiFilter className="text-lg" />
                    <span>Export Leads</span>
                  </button>
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 1.0 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <FiPhone className="text-green-600 text-sm" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Call made</p>
                      <p className="text-xs text-gray-600">2 minutes ago</p>
                    </div>
                  </div>
                
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FiUserCheck className="text-blue-600 text-sm" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Lead contacted</p>
                      <p className="text-xs text-gray-600">15 minutes ago</p>
                    </div>
                  </div>
                
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <FiAlertCircle className="text-orange-600 text-sm" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">New lead added</p>
                      <p className="text-xs text-gray-600">1 hour ago</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Connected Form Dialog */}
      <AnimatePresence>
        {showConnectedForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeConnectedForm}
            />

            {/* Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative w-full max-w-md bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-4 text-white rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <FiUserCheck className="text-white text-lg" />
                    </div>
                    <h2 className="text-lg font-bold">Add Connected Lead</h2>
                  </div>
                  <button
                    onClick={closeConnectedForm}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
                  >
                    <FiX className="text-white text-lg" />
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleConnectedFormSubmit} className="p-6 space-y-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Name</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600">
                      <FiUser className="text-lg" />
                    </div>
                    <input
                      type="text"
                      value={connectedForm.name}
                      onChange={(e) => handleConnectedFormChange('name', e.target.value)}
                      placeholder="Enter client name"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                {/* Description Field */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Description</label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-teal-600">
                      <FiFileText className="text-lg" />
                    </div>
                    <textarea
                      value={connectedForm.description}
                      onChange={(e) => handleConnectedFormChange('description', e.target.value)}
                      placeholder="Enter project description"
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 resize-none"
                    />
                  </div>
                </div>

                {/* Project Type */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700">Project Type</label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleConnectedFormChange('projectType', 'web')}
                      className={`flex-1 py-3 px-3 rounded-lg font-medium transition-all duration-200 text-sm ${
                        connectedForm.projectType === 'web'
                          ? 'bg-teal-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Web
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConnectedFormChange('projectType', 'app')}
                      className={`flex-1 py-3 px-3 rounded-lg font-medium transition-all duration-200 text-sm ${
                        connectedForm.projectType === 'app'
                          ? 'bg-teal-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      App
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConnectedFormChange('projectType', 'taxi')}
                      className={`flex-1 py-3 px-3 rounded-lg font-medium transition-all duration-200 text-sm ${
                        connectedForm.projectType === 'taxi'
                          ? 'bg-teal-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Taxi
                    </button>
                  </div>
                </div>

                {/* Estimated Price */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Estimated Price</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600">
                      <span className="text-lg font-bold">₹</span>
                    </div>
                    <input
                      type="text"
                      value={connectedForm.estimatedPrice}
                      onChange={(e) => handleConnectedFormChange('estimatedPrice', e.target.value)}
                      placeholder="Enter amount (e.g., 50000)"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="quotationSent"
                      checked={connectedForm.quotationSent}
                      onChange={(e) => handleConnectedFormChange('quotationSent', e.target.checked)}
                      className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500 focus:ring-2"
                    />
                    <label htmlFor="quotationSent" className="text-sm font-medium text-gray-700">
                      Quotation sent
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="demoSent"
                      checked={connectedForm.demoSent}
                      onChange={(e) => handleConnectedFormChange('demoSent', e.target.checked)}
                      className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500 focus:ring-2"
                    />
                    <label htmlFor="demoSent" className="text-sm font-medium text-gray-700">
                      Demo sent
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeConnectedForm}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-200 font-medium shadow-lg"
                  >
                    Save Lead
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={cancelDelete}
            />

            {/* Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 text-white rounded-t-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <FiAlertCircle className="text-white text-lg" />
                  </div>
                  <h2 className="text-lg font-bold">Confirm Deletion</h2>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-700 text-sm mb-4">
                  Are you sure you want to mark this lead as "Not Interested"? This action will permanently delete the lead from your list.
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-700 text-xs font-medium">
                    ⚠️ This action cannot be undone
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm font-medium"
                  >
                    Delete Lead
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SL_newLeads