import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FiArrowLeft, 
  FiClock, 
  FiCheck, 
  FiX, 
  FiDollarSign,
  FiTrendingUp,
  FiPause,
  FiCreditCard,
  FiAlertCircle,
  FiCalendar,
  FiUser,
  FiFilter,
  FiSearch
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import SL_navbar from '../SL-components/SL_navbar'

const SL_requests = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Mock requests data
  const [requests, setRequests] = useState([
    {
      id: 1,
      type: 'payment-recovery',
      title: 'Payment Recovery Request',
      description: 'Request to recover pending payment from Teris project',
      amount: '₹30,000',
      status: 'pending',
      date: '2024-01-20',
      time: '10:30 AM',
      priority: 'high',
      clientName: 'Teris',
      projectName: 'E-commerce Website'
    },
    {
      id: 2,
      type: 'withdrawal',
      title: 'Withdrawal Request',
      description: 'Request to withdraw earnings to bank account',
      amount: '₹15,000',
      status: 'approved',
      date: '2024-01-19',
      time: '2:15 PM',
      priority: 'medium',
      clientName: 'N/A',
      projectName: 'Personal Withdrawal'
    },
    {
      id: 3,
      type: 'hold-work',
      title: 'Hold Work Request',
      description: 'Request to temporarily hold work on Ankit Ahirwar project',
      amount: 'N/A',
      status: 'pending',
      date: '2024-01-18',
      time: '4:45 PM',
      priority: 'medium',
      clientName: 'Ankit Ahirwar',
      projectName: 'Mobile App Development'
    },
    {
      id: 4,
      type: 'accelerate-work',
      title: 'Accelerate Work Request',
      description: 'Request to accelerate work on new client project',
      amount: 'N/A',
      status: 'rejected',
      date: '2024-01-17',
      time: '11:20 AM',
      priority: 'high',
      clientName: 'John Smith',
      projectName: 'Web Application'
    },
    {
      id: 5,
      type: 'increase-cost',
      title: 'Increase Cost Request',
      description: 'Request to increase project cost due to additional requirements',
      amount: '₹25,000',
      status: 'pending',
      date: '2024-01-16',
      time: '3:30 PM',
      priority: 'high',
      clientName: 'Sarah Johnson',
      projectName: 'E-commerce Platform'
    }
  ])

  const requestTypes = [
    { id: 'all', label: 'All Requests', icon: FiAlertCircle },
    { id: 'pending', label: 'Pending', icon: FiClock },
    { id: 'approved', label: 'Approved', icon: FiCheck },
    { id: 'rejected', label: 'Rejected', icon: FiX }
  ]

  const getRequestTypeIcon = (type) => {
    switch (type) {
      case 'payment-recovery':
        return FiCreditCard
      case 'withdrawal':
        return FiDollarSign
      case 'hold-work':
        return FiPause
      case 'accelerate-work':
        return FiTrendingUp
      case 'increase-cost':
        return FiDollarSign
      default:
        return FiAlertCircle
    }
  }

  const getRequestTypeColor = (type) => {
    switch (type) {
      case 'payment-recovery':
        return 'text-emerald-600 bg-emerald-50'
      case 'withdrawal':
        return 'text-blue-600 bg-blue-50'
      case 'hold-work':
        return 'text-orange-600 bg-orange-50'
      case 'accelerate-work':
        return 'text-purple-600 bg-purple-50'
      case 'increase-cost':
        return 'text-teal-600 bg-teal-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      case 'approved':
        return 'text-green-600 bg-green-50'
      case 'rejected':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }


  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesFilter = true
    if (selectedFilter !== 'all') {
      matchesFilter = request.status === selectedFilter
    }
    
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SL_navbar />
      
      <main className="max-w-md mx-auto px-4 pt-16 pb-20 sm:px-6 lg:px-8">
        

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="text-lg font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                <FiAlertCircle className="text-teal-600 text-sm" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Pending</p>
                <p className="text-lg font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FiClock className="text-yellow-600 text-sm" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search Bar with Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative mb-4"
        >
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search requests..."
            className="w-full pl-8 pr-12 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
              showFilters 
                ? 'bg-teal-500 text-white shadow-md' 
                : 'text-gray-500 hover:text-teal-600 hover:bg-teal-50'
            }`}
          >
            <FiFilter className="text-base" />
          </button>
        </motion.div>

        {/* Filters */}
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-wrap gap-2 mb-4"
          >
            {requestTypes.map((filter) => {
              const IconComponent = filter.icon
              return (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    selectedFilter === filter.id
                      ? 'bg-teal-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <IconComponent className="text-sm" />
                  <span>{filter.label}</span>
                </button>
              )
            })}
          </motion.div>
        )}

        {/* Requests List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-3"
        >
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <FiAlertCircle className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No requests found</p>
              <p className="text-gray-400 text-sm">Try adjusting your search terms or filters</p>
            </div>
          ) : (
            filteredRequests.map((request) => {
              const TypeIcon = getRequestTypeIcon(request.type)
              return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRequestTypeColor(request.type)}`}>
                        <TypeIcon className="text-lg" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{request.title}</h3>
                        <p className="text-xs text-gray-500">{request.clientName} • {request.projectName}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">{request.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-gray-500">
                        <FiCalendar className="text-sm" />
                        <span className="text-xs">{request.date}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-500">
                        <FiClock className="text-sm" />
                        <span className="text-xs">{request.time}</span>
                      </div>
                    </div>
                    {request.amount !== 'N/A' && (
                      <span className="text-sm font-semibold text-teal-600">{request.amount}</span>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </motion.div>
      </main>
    </div>
  )
}

export default SL_requests
