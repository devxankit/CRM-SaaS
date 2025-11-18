import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  FiArrowLeft, 
  FiSearch, 
  FiPhone,
  FiX,
  FiChevronDown,
  FiUser,
  FiFilter
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import SL_navbar from '../SL-components/SL_navbar'
import { salesPaymentsService } from '../SL-services'

const SL_payments_recovery = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [requestAmount, setRequestAmount] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedPaymentType, setSelectedPaymentType] = useState('all')
  const [receivables, setReceivables] = useState([])
  const [stats, setStats] = useState({ totalDues: 0, overdueCount: 0, overdueAmount: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [expandedProjects, setExpandedProjects] = useState({})
  const [projectInstallments, setProjectInstallments] = useState({})
  const [showInstallmentDialog, setShowInstallmentDialog] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState(null)
  const [installmentForm, setInstallmentForm] = useState({
    paidDate: new Date().toISOString().split('T')[0],
    notes: ''
  })

  // Fetch data
  React.useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true)
        const [st, list] = await Promise.all([
          salesPaymentsService.getReceivableStats(),
          salesPaymentsService.getReceivables({
            search: searchTerm,
            overdue: selectedPaymentType === 'overdue',
            band: selectedFilter === 'all' ? undefined : selectedFilter
          })
        ])
        setStats({ totalDues: st.totalDue || 0, overdueCount: st.overdueCount || 0, overdueAmount: st.overdueAmount || 0 })
        setReceivables(list)
      } catch (e) {
        console.error('Payments fetch error', e)
      } finally {
        setIsLoading(false)
      }
    }
    run()
  }, [searchTerm, selectedPaymentType, selectedFilter])

  const totalDues = stats.totalDues || 0
  const overduePayments = receivables.filter(p => p.dueDate && new Date(p.dueDate) < new Date())
  const totalOverdue = stats.overdueAmount || 0

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'high', label: 'High Amount' },
    { id: 'medium', label: 'Medium Amount' },
    { id: 'low', label: 'Low Amount' }
  ]

  const filteredPayments = receivables

  const handleCall = (phone) => {
    window.open(`tel:${phone}`, '_self')
  }

  const handleWhatsApp = (client) => {
    // Normalize to expected shape for dialog
    setSelectedClient({
      name: client.clientName,
      phone: client.phone,
      remainingAmount: client.remainingAmount
    })
    setShowWhatsAppDialog(true)
  }

  const handleSendWhatsAppMessage = () => {
    if (!requestAmount || !selectedClient) return

    const cleanPhone = selectedClient.phone.replace(/\s+/g, '').replace('+91', '')
    const remainingAmount = selectedClient.remainingAmount || 0
    const message = `Hello ${selectedClient.name},

Payment Request Details:
• Remaining Amount: ₹${remainingAmount.toLocaleString()}
• Requested Amount: ₹${parseInt(requestAmount).toLocaleString()}

Please make the payment at your earliest convenience. If you have any questions, feel free to contact us.

Thank you!`

    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/91${cleanPhone}?text=${encodedMessage}`, '_blank')
    
    // Close dialog and reset
    setShowWhatsAppDialog(false)
    setSelectedClient(null)
    setRequestAmount('')
  }

  const handleCloseWhatsAppDialog = () => {
    setShowWhatsAppDialog(false)
    setSelectedClient(null)
    setRequestAmount('')
  }

  const handleProfile = (clientId) => {
    // Navigate to client profile page
    navigate(`/client-profile/${clientId}`)
  }

  const toggleProjectInstallments = async (projectId) => {
    if (expandedProjects[projectId]) {
      setExpandedProjects(prev => ({ ...prev, [projectId]: false }))
    } else {
      setExpandedProjects(prev => ({ ...prev, [projectId]: true }))
      // Fetch installments if not already loaded
      if (!projectInstallments[projectId]) {
        try {
          const installments = await salesPaymentsService.getInstallments(projectId)
          setProjectInstallments(prev => ({ ...prev, [projectId]: installments }))
        } catch (e) {
          console.error('Failed to fetch installments', e)
        }
      }
    }
  }

  const handleMarkInstallmentPaid = (installment, projectId) => {
    setSelectedInstallment({ ...installment, projectId })
    setInstallmentForm({
      paidDate: new Date().toISOString().split('T')[0],
      notes: ''
    })
    setShowInstallmentDialog(true)
  }

  const handleInstallmentSubmit = async () => {
    if (!selectedInstallment) return

    try {
      await salesPaymentsService.requestInstallmentPayment(
        selectedInstallment.projectId,
        selectedInstallment._id || selectedInstallment.id,
        {
          paidDate: installmentForm.paidDate,
          notes: installmentForm.notes
        }
      )
      // Refresh installments
      const installments = await salesPaymentsService.getInstallments(selectedInstallment.projectId)
      setProjectInstallments(prev => ({ ...prev, [selectedInstallment.projectId]: installments }))
      // Close dialog
      setShowInstallmentDialog(false)
      setSelectedInstallment(null)
      alert('Payment request submitted successfully. Waiting for admin approval.')
    } catch (e) {
      console.error('Failed to request installment payment', e)
      alert(e.message || 'Failed to submit payment request')
    }
  }

  const handleCloseInstallmentDialog = () => {
    setShowInstallmentDialog(false)
    setSelectedInstallment(null)
    setInstallmentForm({
      paidDate: new Date().toISOString().split('T')[0],
      notes: ''
    })
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const getInstallmentStatusBadge = (installment) => {
    if (installment.status === 'paid') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Paid</span>
    } else if (installment.status === 'overdue') {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Overdue</span>
    } else if (installment.pendingApproval) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">Pending Approval</span>
    } else {
      return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">Pending</span>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SL_navbar />
      
      <main className="max-w-2xl mx-auto px-4 pt-16 pb-20">

        {/* Total Dues Card */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-4 mb-4 text-white">
          <h2 className="text-sm font-medium mb-1">Total dues</h2>
          <p className="text-2xl font-bold">₹ {totalDues.toLocaleString()} /-</p>
        </div>

        {/* Search Bar with Filter Icon */}
        <div className="relative mb-4">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600">
            <FiSearch className="text-sm" />
          </div>
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

        {/* Payment Type Tiles */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* All Payments Tile */}
          <button
            onClick={() => setSelectedPaymentType('all')}
            className={`py-1.5 px-3 rounded-lg transition-all duration-200 ${
              selectedPaymentType === 'all'
                ? 'bg-teal-50 border-2 border-teal-500 text-teal-700'
                : 'bg-gray-50 border-2 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="text-center">
              <p className="text-xs font-semibold">All: ₹{totalDues.toLocaleString()} ({receivables.length})</p>
            </div>
          </button>

          {/* Overdue Payments Tile */}
          <button
            onClick={() => setSelectedPaymentType('overdue')}
            className={`py-1.5 px-3 rounded-lg transition-all duration-200 ${
              selectedPaymentType === 'overdue'
                ? 'bg-red-50 border-2 border-red-500 text-red-700'
                : 'bg-gray-50 border-2 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="text-center">
              <p className="text-xs font-semibold">Overdue: ₹{totalOverdue.toLocaleString()} ({overduePayments.length})</p>
            </div>
          </button>
        </div>

        {/* Filters - Conditional Display */}
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-wrap gap-2 mb-4"
          >
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
          </motion.div>
        )}

        {/* Payments List */}
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <div
              key={payment.projectId}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              {/* Client Info Section */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{payment.clientName}</h3>
                  <p className="text-sm text-gray-600 flex items-center">
                    <FiPhone className="mr-1 text-xs" />
                    {payment.phone}
                  </p>
                </div>
                
                {/* Amount Badge */}
                <div className="bg-red-50 px-3 py-1 rounded-full">
                  <p className="text-red-700 font-bold text-sm">₹{payment.remainingAmount.toLocaleString()}</p>
                </div>
              </div>

              {/* Installments Section */}
              <div className="mb-3">
                <button
                  onClick={() => toggleProjectInstallments(payment.projectId)}
                  className="flex items-center justify-between w-full text-left p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <span className="text-sm font-medium text-gray-700">
                    View Installments
                  </span>
                  <FiChevronDown className={`text-gray-500 transition-transform duration-200 ${expandedProjects[payment.projectId] ? 'rotate-180' : ''}`} />
                </button>

                {expandedProjects[payment.projectId] && (
                  <div className="mt-2 space-y-2">
                    {isLoading ? (
                      <p className="text-sm text-gray-500 text-center py-2">Loading installments...</p>
                    ) : projectInstallments[payment.projectId]?.length > 0 ? (
                      projectInstallments[payment.projectId].map((installment) => (
                        <div
                          key={installment._id || installment.id}
                          className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-gray-500">Installment #{installment.index}</span>
                                {getInstallmentStatusBadge(installment)}
                              </div>
                              <p className="text-sm font-bold text-gray-900">₹{installment.amount.toLocaleString()}</p>
                              <p className="text-xs text-gray-600">Due: {formatDate(installment.dueDate)}</p>
                              {installment.paidDate && (
                                <p className="text-xs text-green-600">Paid: {formatDate(installment.paidDate)}</p>
                              )}
                            </div>
                            {installment.status !== 'paid' && !installment.pendingApproval && (
                              <button
                                onClick={() => handleMarkInstallmentPaid(installment, payment.projectId)}
                                className="bg-teal-500 text-white px-3 py-1 rounded-lg hover:bg-teal-600 transition-all duration-200 text-xs font-medium"
                                title="Mark as Paid (Requires Approval)"
                              >
                                Mark Paid
                              </button>
                            )}
                          </div>
                          {installment.notes && (
                            <p className="text-xs text-gray-600 mt-1">Notes: {installment.notes}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-2">No installments found</p>
                    )}
                  </div>
                )}
              </div>

               {/* Action Buttons */}
               <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-2">
                   {/* Call Button */}
                   <button
                     onClick={() => handleCall(payment.phone)}
                     className="bg-white text-teal-600 border border-teal-200 px-2.5 py-1.5 rounded-lg hover:bg-teal-50 transition-all duration-200 text-xs font-medium"
                     title="Call"
                   >
                     Call
                   </button>

                   {/* WhatsApp Button */}
                   <button
                     onClick={() => handleWhatsApp(payment)}
                     className="bg-green-500 text-white p-1.5 rounded-lg hover:bg-green-600 transition-all duration-200"
                     title="WhatsApp"
                   >
                     <FaWhatsapp className="w-3.5 h-3.5" />
                   </button>

                   {/* Profile Button */}
                   <button
                     onClick={() => handleProfile(payment.clientId)}
                     className="bg-teal-500 text-white p-1.5 rounded-lg hover:bg-teal-600 transition-all duration-200"
                     title="View Profile"
                   >
                     <FiUser className="w-3.5 h-3.5" />
                   </button>
                 </div>

               </div>
            </div>
          ))}
        </div>
      </main>

      {/* WhatsApp Dialog */}
      {showWhatsAppDialog && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl"
          >
            {/* Dialog Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Send WhatsApp Message</h2>
              <button
                onClick={handleCloseWhatsAppDialog}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <FiX className="text-lg text-gray-600" />
              </button>
            </div>

            {/* Client Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Client: <span className="font-semibold text-gray-900">{selectedClient.name}</span></p>
              <p className="text-sm text-gray-600">Remaining: <span className="font-semibold text-red-600">₹{(selectedClient.remainingAmount || 0).toLocaleString()}</span></p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Request Amount Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Request Amount</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600">
                    <span className="text-lg">₹</span>
                  </div>
                  <input
                    type="number"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    placeholder="Enter amount to request"
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                  />
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={handleCloseWhatsAppDialog}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSendWhatsAppMessage}
                disabled={!requestAmount}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  requestAmount 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Send Message
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Installment Payment Dialog */}
      {showInstallmentDialog && selectedInstallment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl"
          >
            {/* Dialog Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Mark Installment as Paid</h2>
              <button
                onClick={handleCloseInstallmentDialog}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <FiX className="text-lg text-gray-600" />
              </button>
            </div>

            {/* Installment Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Installment #{selectedInstallment.index}</p>
              <p className="text-lg font-bold text-gray-900">₹{selectedInstallment.amount.toLocaleString()}</p>
              <p className="text-xs text-gray-600">Due Date: {formatDate(selectedInstallment.dueDate)}</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Paid Date Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Paid Date</label>
                <input
                  type="date"
                  value={installmentForm.paidDate}
                  onChange={(e) => setInstallmentForm(prev => ({ ...prev, paidDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                />
              </div>

              {/* Notes Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Notes (Optional)</label>
                <textarea
                  value={installmentForm.notes}
                  onChange={(e) => setInstallmentForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any additional notes..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                />
              </div>

              {/* Info Message */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> This will create an approval request. The installment will be marked as paid only after admin approval.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={handleCloseInstallmentDialog}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleInstallmentSubmit}
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-medium hover:from-teal-600 hover:to-teal-700 transition-all duration-200"
              >
                Request Approval
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default SL_payments_recovery
