import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  FiArrowLeft, 
  FiSearch, 
  FiVideo,
  FiUser,
  FiPhone,
  FiMail,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiMoreVertical,
  FiFilter,
  FiTag
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import SL_navbar from '../SL-components/SL_navbar'
import { salesDemoService, salesLeadService } from '../SL-services'

const SL_demo_request = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showActionsMenu, setShowActionsMenu] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  // Lead categories (matching admin system)
  const leadCategories = [
    {
      id: 1,
      name: 'Hot Leads',
      description: 'High priority leads with immediate potential',
      color: '#EF4444',
      icon: '🔥'
    },
    {
      id: 2,
      name: 'Cold Leads',
      description: 'Leads that need nurturing and follow-up',
      color: '#3B82F6',
      icon: '❄️'
    },
    {
      id: 3,
      name: 'Warm Leads',
      description: 'Leads showing interest but not ready to convert',
      color: '#F59E0B',
      icon: '🌡️'
    },
    {
      id: 4,
      name: 'Enterprise',
      description: 'Large enterprise clients and prospects',
      color: '#8B5CF6',
      icon: '🏢'
    },
    {
      id: 5,
      name: 'SME',
      description: 'Small and medium enterprise prospects',
      color: '#10B981',
      icon: '🏪'
    }
  ]

  const [demoRequestsData, setDemoRequestsData] = useState([])
  const [categories, setCategories] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, scheduled: 0, completed: 0 })
  const [isLoading, setIsLoading] = useState(false)

  const filters = [
    { id: 'all', label: 'All Requests' },
    { id: 'pending', label: 'Pending' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
  ]

  React.useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true)
        const [cats, res] = await Promise.all([
          salesLeadService.getLeadCategories(),
          salesDemoService.list({
            search: searchTerm,
            status: selectedFilter,
            category: selectedCategory
          })
        ])
        setCategories(cats)
        setDemoRequestsData(res.items || [])
        setStats(res.stats || { total: 0, pending: 0, scheduled: 0, completed: 0 })
      } catch (e) {
        console.error('Fetch demo requests failed', e)
      } finally {
        setIsLoading(false)
      }
    }
    run()
  }, [searchTerm, selectedFilter, selectedCategory])

  const filteredRequests = demoRequestsData

  // Get category info for a request
  const getCategoryInfo = (categoryId) => {
    return leadCategories.find(cat => cat.id === categoryId) || leadCategories[0]
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'scheduled': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'completed': return 'text-green-600 bg-green-50 border-green-200'
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FiClock className="text-orange-600" />
      case 'scheduled': return <FiCalendar className="text-blue-600" />
      case 'completed': return <FiCheckCircle className="text-green-600" />
      case 'cancelled': return <FiXCircle className="text-red-600" />
      default: return <FiClock className="text-gray-600" />
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
    // Remove any non-numeric characters and add country code if needed
    const cleanPhone = phone.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/${cleanPhone}`
    window.open(whatsappUrl, '_blank')
  }

  const handleViewDetails = (requestId) => {
    console.log('View details for request:', requestId)
  }

  const handleDemoStatusChange = async (requestId, newStatus) => {
    try {
      await salesDemoService.updateStatus(requestId, newStatus)
      // refresh
      const res = await salesDemoService.list({ search: searchTerm, status: selectedFilter, category: selectedCategory })
      setDemoRequestsData(res.items || [])
      setStats(res.stats || stats)
      setShowActionsMenu(null)
    } catch (e) {
      console.error('Update demo status failed', e)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SL_navbar />
      
      <main className="max-w-4xl mx-auto px-4 pt-16 pb-20">

        {/* Summary Card */}
        <div className="bg-teal-500 rounded-xl p-5 mb-4 text-white">
          <div className="flex items-center justify-between">
            {/* Left Section - Total */}
            <div>
              <h2 className="text-sm font-medium mb-2">Total Demo Requests</h2>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            
            {/* Right Section - Status Breakdown */}
            <div className="flex items-center space-x-6">
              {/* Pending */}
              <div className="text-center">
                <p className="text-lg font-bold mb-1">{stats.pending}</p>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
                  <span className="text-sm">Pending</span>
                </div>
              </div>
              
              {/* Scheduled */}
              <div className="text-center">
                <p className="text-lg font-bold mb-1">{stats.scheduled}</p>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                  <span className="text-sm">Scheduled</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar with Filter Icon */}
        <div className="relative mb-4">
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

        {/* Filters - Conditional Display */}
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 mb-4"
          >
            {/* Status Filters */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Status</h4>
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
                {leadCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id.toString())}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
                      selectedCategory === category.id.toString()
                        ? 'text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: selectedCategory === category.id.toString() ? category.color : undefined
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

        {/* Demo Requests List */}
        <div className="space-y-3">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <FiVideo className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No demo requests found</p>
              <p className="text-gray-400 text-sm">Try adjusting your search terms or filters</p>
            </div>
          ) : (
            filteredRequests.map((request, index) => {
              const displayName = request.leadProfile?.name || request.name || request.clientName || request.company || 'Unknown'
              const displayPhone = request.phone
              const category = request.category
              const demoStatus = request.demoRequest?.status || 'pending'
              return (
                <div
                  key={request._id || request.id || index}
                  className="bg-white rounded-lg p-3 shadow-sm border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    {/* Left Section - Avatar & Info (matching Connected) */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
                          <FiUser className="text-white text-xs" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{displayName}</h3>
                          <p className="text-xs text-gray-600">{displayPhone}</p>
                        </div>
                      </div>

                      {/* Category Tag */}
                      <div className="mb-1">
                        <div className="flex items-center space-x-1">
                          <span
                            className="text-xs text-gray-500"
                            style={{ color: category?.color || '#6b7280' }}
                          >
                            {category?.icon || ''} {category?.name || 'Category'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Demo Request Status and Actions */}
                    <div className="flex flex-col items-end space-y-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getStatusColor(demoStatus)}`}>
                        {getStatusIcon(demoStatus)}
                        <span className="capitalize">{demoStatus}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleCall(displayPhone)}
                          className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors duration-200"
                          title="Call"
                        >
                          <FiPhone className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleWhatsApp(displayPhone)}
                          className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors duration-200"
                          title="WhatsApp"
                        >
                          <FaWhatsapp className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleViewDetails(request._id || request.id)}
                          className="p-1.5 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors duration-200"
                          title="View Details"
                        >
                          <FiEye className="text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}

export default SL_demo_request
