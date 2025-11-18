import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  FiPhone, 
  FiMoreVertical,
  FiFilter,
  FiUser,
  FiSearch,
  FiAlertCircle,
  FiUserCheck,
  FiMessageCircle,
  FiMail,
  FiTag,
  FiLoader
} from 'react-icons/fi'
import SL_navbar from '../SL-components/SL_navbar'
import FollowUpDialog from '../SL-components/FollowUpDialog'
import { salesLeadService } from '../SL-services'
import { useToast } from '../../../contexts/ToastContext'

const SL_connected = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  // State for filters and UI
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLeadId, setSelectedLeadId] = useState(null)
  const [showActionsMenu, setShowActionsMenu] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  
  // State for real data
  const [leadsData, setLeadsData] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  
  // State for Follow-up dialog
  const [showFollowupDialog, setShowFollowupDialog] = useState(false)
  const [selectedLeadForFollowup, setSelectedLeadForFollowup] = useState(null)

  // Fetch categories and leads on component mount
  useEffect(() => {
    fetchCategories()
    fetchLeads()
  }, [selectedFilter, selectedCategory, searchTerm])

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
    setIsLoading(true)
    try {
      const params = {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchTerm || undefined,
        timeFrame: selectedFilter !== 'all' ? selectedFilter : undefined,
        page: 1,
        limit: 50
      }
      const response = await salesLeadService.getLeadsByStatus('connected', params)
      setLeadsData(response.data || [])
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast.error('Failed to fetch leads')
      setLeadsData([])
    } finally {
      setIsLoading(false)
    }
  }

  const filters = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'Last 7 Days' },
    { id: 'month', label: 'This Month' },
    { id: 'all', label: 'All' }
  ]

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

  // Status change handler
  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await salesLeadService.updateLeadStatus(leadId, newStatus)
      toast.success(`Lead status updated to ${salesLeadService.getStatusDisplayName(newStatus)}`)
      
      // Remove lead from current list
      setLeadsData(prev => prev.filter(lead => lead._id !== leadId))
      
      // Refresh dashboard stats
      if (window.refreshDashboardStats) {
        window.refreshDashboardStats()
      }
    } catch (error) {
      console.error('Error updating lead status:', error)
      toast.error('Failed to update lead status')
    }
    setShowActionsMenu(null)
  }

  // Handle follow-up scheduling
  const handleFollowUp = (leadId) => {
    setSelectedLeadForFollowup(leadId)
    setShowFollowupDialog(true)
    setShowActionsMenu(null)
  }

  // Handle follow-up form submission
  const handleFollowUpSubmit = async (followUpData) => {
    try {
      await salesLeadService.updateLeadStatus(selectedLeadForFollowup, 'followup', followUpData)
      toast.success('Follow-up scheduled successfully')
      
      // Remove lead from current list
      setLeadsData(prev => prev.filter(lead => lead._id !== selectedLeadForFollowup))
      
      // Refresh dashboard stats
      if (window.refreshDashboardStats) {
        window.refreshDashboardStats()
      }
      
      setShowFollowupDialog(false)
      setSelectedLeadForFollowup(null)
    } catch (error) {
      console.error('Error scheduling follow-up:', error)
      toast.error('Failed to schedule follow-up')
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  const handleCall = (phone) => {
    window.open(`tel:${phone}`, '_self')
  }

  const handleWhatsApp = (phone) => {
    const message = encodeURIComponent("Hello! I'm following up on our previous conversation. How can I help you today?")
    window.open(`https://wa.me/91${phone}?text=${message}`, '_blank')
  }

  const handleProfile = (leadId) => {
    navigate(`/lead-profile/${leadId}`)
  }

  const handleProfileClick = (lead) => {
    if (lead.leadProfile) {
      handleProfile(lead._id)
    } else {
      toast.error('This lead doesn\'t have a profile. Please connect to the lead first to create a profile.')
    }
  }

  // Mobile Lead Card Component
  const MobileLeadCard = ({ lead }) => {
    const categoryInfo = getCategoryInfo(lead.category)
    
    return (
      <div className="flex items-center justify-between">
        {/* Left Section - Avatar & Info */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
              <FiUser className="text-white text-xs" />
            </div>
            <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full flex items-center justify-center ${getPriorityColor(lead.priority)}`}>
              <div className={`w-1 h-1 rounded-full ${getPriorityColor(lead.priority).replace('text', 'bg')}`}></div>
            </div>
          </div>

          {/* Name, Phone & Category */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {lead.leadProfile?.name || lead.name || 'Unknown'}
            </h3>
            <p className="text-sm text-gray-600 truncate">{lead.phone}</p>
            {/* Category Tag */}
            <div className="flex items-center space-x-1 mt-1">
              <span 
                className="text-xs text-black"
                style={{ color: categoryInfo.color }}
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
          className="bg-white text-teal-600 border border-teal-200 px-2.5 py-1.5 rounded-lg hover:bg-teal-50 transition-all duration-200 text-xs font-medium"
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

        {/* Profile Button - Only show if lead has profile */}
        {lead.leadProfile && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleProfile(lead._id)
            }}
            className="bg-teal-500 text-white p-1.5 rounded-lg hover:bg-teal-600 transition-all duration-200"
          >
            <FiUser className="w-3.5 h-3.5" />
          </button>
        )}

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
                className="absolute right-0 top-full mt-2 w-32 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
              >
                <div className="py-1">
                  <button
                    onClick={() => handleStatusChange(lead._id, 'hot')}
                    className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                  >
                    Mark as Hot
                  </button>
                  <button
                    onClick={() => handleFollowUp(lead._id)}
                    className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors duration-200"
                  >
                    Follow Up
                  </button>
                  <button
                    onClick={() => handleStatusChange(lead._id, 'quotation_sent')}
                    className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                  >
                    Send Quotation
                  </button>
                  <button
                    onClick={() => handleStatusChange(lead._id, 'dq_sent')}
                    className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors duration-200"
                  >
                    Send D&Q
                  </button>
                  <button
                    onClick={() => handleStatusChange(lead._id, 'not_interested')}
                    className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200"
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

  // Desktop Lead Card Component
  const DesktopLeadCard = ({ lead }) => {
    const categoryInfo = getCategoryInfo(lead.category)
    
    return (
      <div className="flex items-center justify-between">
        {/* Left Section - Avatar & Info */}
        <div className="flex-1 flex items-center space-x-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
              <FiUser className="text-white text-sm" />
            </div>
            <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center ${getPriorityColor(lead.priority)}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(lead.priority).replace('text', 'bg')}`}></div>
            </div>
          </div>

          {/* Name, Phone & Category */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {lead.leadProfile?.name || lead.name || 'Unknown'}
            </h3>
            <p className="text-gray-600">{lead.phone}</p>
            {/* Category Tag */}
            <div className="flex items-center space-x-2 mt-1">
              <span 
                className="text-xs text-black"
                style={{ color: categoryInfo.color }}
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
          className="bg-white text-teal-600 border border-teal-200 px-3.5 py-1.5 rounded-lg hover:bg-teal-50 transition-all duration-200 text-sm font-medium"
        >
          Call
        </button>
        
        <button
          onClick={() => handleWhatsApp(lead.phone)}
          className="bg-green-500 text-white px-3.5 py-1.5 rounded-lg hover:bg-green-600 transition-all duration-200 flex items-center space-x-2"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c0 5.449-4.434 9.883-9.881 9.883"/>
          </svg>
          <span className="text-sm">WhatsApp</span>
        </button>

        {/* Profile Button - Only show if lead has profile */}
        {lead.leadProfile && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleProfile(lead._id)
            }}
            className="bg-teal-500 text-white px-3.5 py-1.5 rounded-lg hover:bg-teal-600 transition-all duration-200 flex items-center space-x-2"
          >
            <FiUser className="w-3.5 h-3.5" />
            <span className="text-sm">Profile</span>
          </button>
        )}

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
                className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-200 z-50"
              >
                <div className="py-2">
                  <button
                    onClick={() => handleStatusChange(lead._id, 'hot')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                  >
                    Mark as Hot
                  </button>
                  <button
                    onClick={() => handleFollowUp(lead._id)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors duration-200"
                  >
                    Follow Up
                  </button>
                  <button
                    onClick={() => handleStatusChange(lead._id, 'quotation_sent')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                  >
                    Send Quotation
                  </button>
                  <button
                    onClick={() => handleStatusChange(lead._id, 'dq_sent')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors duration-200"
                  >
                    Send D&Q
                  </button>
                  <button
                    onClick={() => handleStatusChange(lead._id, 'app_client')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200"
                  >
                    App Client
                  </button>
                  <button
                    onClick={() => handleStatusChange(lead._id, 'web')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors duration-200"
                  >
                    Web Client
                  </button>
                  <button
                    onClick={() => handleStatusChange(lead._id, 'not_interested')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200"
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

  return (
    <div className="min-h-screen bg-gray-50">
      <SL_navbar />
      
      <main className="max-w-7xl mx-auto px-4 pt-16 pb-20 sm:px-6 lg:px-8">
        
         {/* Mobile Layout */}
         <div className="lg:hidden">
           {/* Header Section */}
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6 }}
             className="mb-6"
           >
             <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 shadow-md border border-teal-200/30">
               <div className="flex items-center justify-between">
                 {/* Left Section - Icon and Text */}
                 <div className="flex items-center space-x-3 flex-1">
                   {/* Icon */}
                   <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md">
                     <FiUserCheck className="text-white text-lg" />
                   </div>
                   
                   {/* Text Content */}
                   <div className="flex-1">
                     <h1 className="text-xl font-bold text-teal-900 leading-tight">
                       Connected<br />Leads
                     </h1>
                     <p className="text-teal-700 text-xs font-medium mt-0.5">
                       Leads that have been successfully contacted
                     </p>
                   </div>
                 </div>
                 
                 {/* Right Section - Total Count Card */}
                 <div className="bg-white rounded-lg px-4 py-3 shadow-md border border-white/20 ml-3">
                   <div className="text-center">
                     <p className="text-xs text-teal-600 font-medium mb-0.5">Total</p>
                     <p className="text-2xl font-bold text-teal-900 leading-none">{leadsData.length}</p>
                     <p className="text-xs text-teal-600 font-medium mt-0.5">Connected</p>
                   </div>
                 </div>
               </div>
             </div>
           </motion.div>

          {/* Search Bar with Filter Icon */}
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
                  {categories.map((category) => (
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
                  ))}
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
              Showing {leadsData.length} connected leads
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
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-xl p-4 border border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : leadsData.length === 0 ? (
                // Empty state
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <FiUserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Connected Leads</h3>
                  <p className="text-gray-500">No leads have been marked as connected yet.</p>
                </motion.div>
              ) : (
                leadsData.map((lead, index) => (
                  <motion.div
                    key={lead._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300"
                  >
                    <MobileLeadCard lead={lead} />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
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
                  <h1 className="text-3xl font-bold text-gray-900">Connected Leads</h1>
                  <p className="text-gray-600 mt-2">Leads that have been successfully contacted</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-3 rounded-xl">
                    <span className="text-sm font-semibold">Total: {leadsData.length}</span>
                  </div>
                  <div className="bg-white text-gray-600 px-6 py-3 rounded-xl border border-gray-200">
                    <span className="text-sm font-semibold">Showing: {leadsData.length}</span>
                  </div>
                </div>
              </motion.div>

              {/* Desktop Search & Filters */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-6"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-1 relative">
                    <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-teal-600 text-xl" />
                    <input
                      type="text"
                      placeholder="Search by name or phone number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-16 py-4 border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 text-lg"
                    />
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
                        showFilters 
                          ? 'bg-teal-500 text-white shadow-md' 
                          : 'text-gray-500 hover:text-teal-600 hover:bg-teal-50 border border-teal-200'
                      }`}
                    >
                      <FiFilter className="text-lg" />
                    </button>
                  </div>
                </div>
                
                {/* Filters - Conditional Display */}
                {showFilters && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {/* Time Period Filters */}
                    <div>
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
                        {categories.map((category) => (
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
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Desktop Leads Grid */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="space-y-3"
              >
                {isLoading ? (
                  // Loading skeleton
                  <div className="space-y-3">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <div className="flex-1">
                              <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            </div>
                          </div>
                          <div className="flex space-x-3">
                            <div className="w-16 h-8 bg-gray-200 rounded"></div>
                            <div className="w-20 h-8 bg-gray-200 rounded"></div>
                            <div className="w-8 h-8 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <AnimatePresence>
                    {leadsData.map((lead, index) => (
                      <motion.div
                        key={lead._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="bg-white rounded-lg p-4 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
                      >
                        <DesktopLeadCard lead={lead} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </motion.div>

              {/* Empty State */}
              {leadsData.length === 0 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FiUserCheck className="text-gray-400 text-3xl" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4">No connected leads found</h3>
                    <p className="text-gray-600 text-lg">
                      {searchTerm ? 'Try adjusting your search criteria or filters.' : 'No connected leads match your current filters.'}
                    </p>
                  </div>
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
                <h3 className="text-lg font-bold text-teal-900 mb-4">Connected Leads Analytics</h3>
                
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <span className="text-teal-700 text-sm font-medium">Total Connected</span>
                     <span className="text-teal-900 text-xl font-bold">{leadsData.length}</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-teal-700 text-sm font-medium">High Priority</span>
                     <span className="text-teal-900 text-xl font-bold">{leadsData.filter(lead => lead.priority === 'high').length}</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-teal-700 text-sm font-medium">Medium Priority</span>
                     <span className="text-teal-900 text-xl font-bold">{leadsData.filter(lead => lead.priority === 'medium').length}</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-teal-700 text-sm font-medium">Low Priority</span>
                     <span className="text-teal-900 text-xl font-bold">{leadsData.filter(lead => lead.priority === 'low').length}</span>
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
                    <FiMessageCircle className="text-lg" />
                    <span>Bulk Message</span>
                  </button>
                  
                  <button className="w-full bg-white text-gray-700 font-semibold py-3 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center space-x-2">
                    <FiMail className="text-lg" />
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
                      <FiUserCheck className="text-green-600 text-sm" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Lead connected</p>
                      <p className="text-xs text-gray-600">2 minutes ago</p>
                    </div>
                  </div>
                
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FiPhone className="text-blue-600 text-sm" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Follow-up call</p>
                      <p className="text-xs text-gray-600">15 minutes ago</p>
                    </div>
                  </div>
                
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <FiMessageCircle className="text-orange-600 text-sm" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">WhatsApp sent</p>
                      <p className="text-xs text-gray-600">1 hour ago</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Follow-up Dialog */}
      <FollowUpDialog
        isOpen={showFollowupDialog}
        onClose={() => setShowFollowupDialog(false)}
        onSubmit={handleFollowUpSubmit}
        title="Schedule Follow-up"
        submitText="Schedule Follow-up"
      />
    </div>
  )
}

export default SL_connected
