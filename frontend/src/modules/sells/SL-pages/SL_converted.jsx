import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  FiPhone, 
  FiFilter,
  FiUser,
  FiSearch,
  FiCheckCircle,
  FiMessageCircle,
  FiMail,
  FiTag,
  FiLoader,
  FiExternalLink,
  FiMoreVertical
} from 'react-icons/fi'
import SL_navbar from '../SL-components/SL_navbar'
import { salesLeadService } from '../SL-services'
import { useToast } from '../../../contexts/ToastContext'

const SL_converted = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  // State for filters and UI
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showActionsMenu, setShowActionsMenu] = useState(null)
  
  // State for real data
  const [leadsData, setLeadsData] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)

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
      const response = await salesLeadService.getLeadsByStatus('converted', params)
      setLeadsData(response.data || [])
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast.error('Failed to fetch leads')
      setLeadsData([])
    } finally {
      setIsLoading(false)
    }
  }

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

  const filters = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'Last 7 Days' },
    { id: 'month', label: 'This Month' },
    { id: 'all', label: 'All' }
  ]

  const handleCall = (phone) => {
    window.open(`tel:${phone}`, '_self')
  }

  const handleWhatsApp = (phone) => {
    const message = encodeURIComponent("Hello! I'm following up on our project. How can I help you today?")
    window.open(`https://wa.me/91${phone}?text=${message}`, '_blank')
  }

  const handleProfile = (client) => {
    const clientId =
      client?.convertedClientId ||
      client?.convertedClient?.id ||
      client?.project?.client

    if (!clientId) {
      toast.error('Client profile is not available yet. Please try again after conversion completes.')
      return
    }

    navigate(`/client-profile/${clientId}`)
  }

  const handleStatusChange = (clientId, newStatus) => {
    console.log(`Client ${clientId} status changed to: ${newStatus}`)
    setShowActionsMenu(null)
  }

  // Mobile Client Card Component
  const MobileClientCard = ({ client, showActionsMenu, setShowActionsMenu }) => {
    const categoryInfo = getCategoryInfo(client.category)
    
    return (
    <div className="p-4 space-y-3">
      {/* Header Section */}
      <div className="flex items-center space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-sm">
            <FiCheckCircle className="text-white text-sm" />
          </div>
        </div>

        {/* Client Info & Category */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {client.leadProfile?.name || client.name || 'Unknown'}
          </h3>
          <p className="text-sm text-gray-600 truncate">
            {client.leadProfile?.businessName || client.company || 'No company'}
          </p>
          {/* Category Tag */}
          <div className="flex items-center space-x-1 mt-1">
            <span 
              className="text-xs text-gray-500"
              style={{ color: categoryInfo.color }}
            >
              {categoryInfo.icon} {categoryInfo.name}
            </span>
          </div>
        </div>

        {/* Revenue */}
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-green-600">₹{(client.project?.financialDetails?.totalCost || client.project?.budget || client.leadProfile?.estimatedCost || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Package Badge */}
      <div className="flex justify-between items-center">
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
          {client.project?.projectType?.web ? 'Web' : client.project?.projectType?.app ? 'App' : client.project?.projectType?.taxi ? 'Taxi' : client.leadProfile?.projectType?.web ? 'Web' : client.leadProfile?.projectType?.app ? 'App' : client.leadProfile?.projectType?.taxi ? 'Taxi' : 'N/A'}
        </span>
        <span className="text-xs text-gray-500">{client.updatedAt ? new Date(client.updatedAt).toLocaleDateString() : 'N/A'}</span>
      </div>

      {/* Actions Section */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-500">{client.phone || 'No phone'}</span>
        
        <div className="flex items-center space-x-1">
          {/* Call Button */}
          <button
            onClick={() => handleCall(client.phone)}
            className="p-2 bg-white text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition-all duration-200"
            title="Call"
          >
            <FiPhone className="w-4 h-4" />
          </button>

          {/* WhatsApp Button */}
          <button
            onClick={() => handleWhatsApp(client.phone)}
            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200"
            title="WhatsApp"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c0 5.449-4.434 9.883-9.881 9.883"/>
            </svg>
          </button>

          {/* Profile Button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleProfile(client)
            }}
            className="p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-all duration-200"
            title="Profile"
          >
            <FiUser className="w-4 h-4" />
          </button>

          {/* More Options */}
          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(showActionsMenu === client._id ? null : client._id)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              <FiMoreVertical className="w-4 h-4" />
            </button>

            {/* Actions Dropdown */}
            <AnimatePresence>
              {showActionsMenu === client._id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2}}
                  className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
                >
                  <div className="py-1">
                  <button
                    onClick={() => handleStatusChange(client._id, 'follow_up')}
                      className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors duration-200"
                    >
                      Follow Up
                    </button>
                  <button
                    onClick={() => handleStatusChange(client._id, 'support')}
                      className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                    >
                      Support
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
    )
  }

  // Desktop Client Card Component
  const DesktopClientCard = ({ client, showActionsMenu, setShowActionsMenu }) => {
    const categoryInfo = getCategoryInfo(client.category)
    
    return (
    <div className="p-4 space-y-3">
      {/* Header Section */}
      <div className="flex items-center space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-sm">
            <FiCheckCircle className="text-white text-lg" />
          </div>
        </div>

        {/* Client Info & Category */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {client.leadProfile?.name || client.name || 'Unknown'}
          </h3>
          <p className="text-sm text-gray-600 truncate">
            {client.leadProfile?.businessName || client.company || 'No company'}
          </p>
          {/* Category Tag */}
          <div className="flex items-center space-x-2 mt-1">
            <span 
              className="text-xs text-gray-500"
              style={{ color: categoryInfo.color }}
            >
              {categoryInfo.icon} {categoryInfo.name}
            </span>
          </div>
        </div>

        {/* Revenue */}
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-green-600">₹{(client.project?.financialDetails?.totalCost || client.project?.budget || client.leadProfile?.estimatedCost || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Package & Date */}
      <div className="flex justify-between items-center">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {client.project?.projectType?.web ? 'Web' : client.project?.projectType?.app ? 'App' : client.project?.projectType?.taxi ? 'Taxi' : client.leadProfile?.projectType?.web ? 'Web' : client.leadProfile?.projectType?.app ? 'App' : client.leadProfile?.projectType?.taxi ? 'Taxi' : 'N/A'}
        </span>
        <span className="text-xs text-gray-500">{client.updatedAt ? new Date(client.updatedAt).toLocaleDateString() : 'N/A'}</span>
      </div>

      {/* Actions Section */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-sm text-gray-500">{client.phone || 'No phone'}</span>
        
        <div className="flex items-center space-x-2">
          {/* Call Button */}
          <button
            onClick={() => handleCall(client.phone)}
            className="px-3 py-1.5 bg-white text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition-all duration-200 text-sm font-medium flex items-center space-x-1"
          >
            <FiPhone className="w-4 h-4" />
            <span>Call</span>
          </button>
          
          <button
            onClick={() => handleWhatsApp(client.phone)}
            className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 flex items-center space-x-1"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c0 5.449-4.434 9.883-9.881 9.883"/>
            </svg>
            <span>WhatsApp</span>
          </button>

          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleProfile(client)
            }}
            className="px-3 py-1.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-all duration-200 flex items-center space-x-1"
          >
            <FiUser className="w-4 h-4" />
            <span>Profile</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(showActionsMenu === client._id ? null : client._id)}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all duration-200"
            >
              <FiMoreVertical className="w-4 h-4" />
            </button>

            {/* Actions Dropdown */}
            <AnimatePresence>
              {showActionsMenu === client._id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2}}
                  className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
                >
                  <div className="py-1">
                    <button
                      onClick={() => handleStatusChange(client._id, 'follow_up')}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors duration-200"
                    >
                      Follow Up
                    </button>
                    <button
                      onClick={() => handleStatusChange(client._id, 'support')}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                    >
                      Support
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
             <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 shadow-md border border-green-200/30">
               <div className="flex items-center justify-between">
                 {/* Left Section - Icon and Text */}
                 <div className="flex items-center space-x-3 flex-1">
                   {/* Icon */}
                   <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                     <FiCheckCircle className="text-white text-lg" />
                   </div>
                   
                   {/* Text Content */}
                   <div className="flex-1">
                     <h1 className="text-xl font-bold text-green-900 leading-tight">
                       Converted<br />Clients
                     </h1>
                     <p className="text-green-700 text-xs font-medium mt-0.5">
                       Successfully converted clients and projects
                     </p>
                   </div>
                 </div>
                 
                 {/* Right Section - Total Count Card */}
                 <div className="bg-white rounded-lg px-4 py-3 shadow-md border border-white/20 ml-3">
                   <div className="text-center">
                     <p className="text-xs text-green-600 font-medium mb-0.5">Total</p>
                     <p className="text-2xl font-bold text-green-900 leading-none">{leadsData.length}</p>
                     <p className="text-xs text-green-600 font-medium mt-0.5">Clients</p>
                   </div>
                 </div>
               </div>
             </div>
           </motion.div>

          {/* Simple Filter Section */}
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
                      <span className="text-black">{category.name}</span>
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
              Showing {leadsData.length} of {leadsData.length} converted clients
            </p>
          </motion.div>

          {/* Mobile Clients List */}
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
                  <FiCheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Converted Leads</h3>
                  <p className="text-gray-500">No leads have been converted to clients yet.</p>
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
                  <MobileClientCard client={lead} showActionsMenu={showActionsMenu} setShowActionsMenu={setShowActionsMenu} />
                </motion.div>
                ))
              )}
            </AnimatePresence>

            {/* Empty State */}
            {leadsData.length === 0 && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiCheckCircle className="text-gray-400 text-2xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No converted clients found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'Try adjusting your search criteria or filters.' : 'No converted clients match your current filters.'}
                  </p>
                </div>
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
                  <h1 className="text-3xl font-bold text-gray-900">Converted Clients</h1>
                  <p className="text-gray-600 mt-2">Successfully converted clients and projects</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl">
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
                      placeholder="Search by name, company, or phone number..."
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
                            <span className="text-black">{category.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Desktop Clients Grid */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="space-y-3"
              >
                <AnimatePresence>
                  {isLoading ? (
                    // Loading skeleton
                    Array.from({ length: 4 }).map((_, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white rounded-xl p-6 border border-gray-200"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                          <div className="flex-1">
                            <div className="h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : leadsData.length === 0 ? (
                    // Empty state
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-16 col-span-2"
                    >
                      <FiCheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-gray-900 mb-2">No Converted Leads</h3>
                      <p className="text-gray-500">No leads have been converted to clients yet.</p>
                    </motion.div>
                  ) : (
                    leadsData.map((lead, index) => (
                    <motion.div
                      key={lead._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="bg-white rounded-lg p-4 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
                    >
                      <DesktopClientCard client={lead} showActionsMenu={showActionsMenu} setShowActionsMenu={setShowActionsMenu} />
                    </motion.div>
                    ))
                  )}
                </AnimatePresence>
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
                      <FiCheckCircle className="text-gray-400 text-3xl" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4">No converted clients found</h3>
                    <p className="text-gray-600 text-lg">
                      {searchTerm ? 'Try adjusting your search criteria or filters.' : 'No converted clients match your current filters.'}
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
                className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-xl border border-green-200/50"
              >
                <h3 className="text-lg font-bold text-green-900 mb-4">Conversion Analytics</h3>
                
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <span className="text-green-700 text-sm font-medium">Total Clients</span>
                    <span className="text-green-900 text-xl font-bold">{leadsData.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-700 text-sm font-medium">Total Revenue</span>
                    <span className="text-green-900 text-xl font-bold">₹{leadsData.length > 0 ? leadsData.reduce((sum, lead) => {
                      const cost = lead.project?.financialDetails?.totalCost || lead.project?.budget || lead.leadProfile?.estimatedCost || 0;
                      return sum + cost;
                    }, 0).toLocaleString() : '0'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-700 text-sm font-medium">Avg. Project Value</span>
                    <span className="text-green-900 text-xl font-bold">₹{leadsData.length > 0 ? Math.round(leadsData.reduce((sum, lead) => {
                      const cost = lead.project?.financialDetails?.totalCost || lead.project?.budget || lead.leadProfile?.estimatedCost || 0;
                      return sum + cost;
                    }, 0) / leadsData.length).toLocaleString() : '0'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-700 text-sm font-medium">This Month</span>
                    <span className="text-green-900 text-xl font-bold">{leadsData.filter(lead => {
                      const leadDate = lead.updatedAt || lead.createdAt
                      return leadDate && new Date(leadDate).getMonth() === new Date().getMonth()
                    }).length}</span>
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
                  <button className="w-full bg-green-500 text-white font-semibold py-3 px-4 rounded-xl hover:bg-green-600 transition-colors duration-200 flex items-center justify-center space-x-2">
                    <FiCheckCircle className="text-lg" />
                    <span>New Project</span>
                  </button>
                  
                  <button className="w-full bg-white text-gray-700 font-semibold py-3 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center space-x-2">
                    <FiMessageCircle className="text-lg" />
                    <span>Bulk Message</span>
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
                      <FiCheckCircle className="text-green-600 text-sm" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Client converted</p>
                      <p className="text-xs text-gray-600">2 hours ago</p>
                    </div>
                  </div>
                
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FiPhone className="text-blue-600 text-sm" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Project discussion</p>
                      <p className="text-xs text-gray-600">1 day ago</p>
                    </div>
                  </div>
                
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <FiMessageCircle className="text-orange-600 text-sm" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Support request</p>
                      <p className="text-xs text-gray-600">2 days ago</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SL_converted
