import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { 
  FiPhone, 
  FiPlus,
  FiUser,
  FiSave,
  FiMessageCircle,
  FiEdit3,
  FiPlay,
  FiX,
  FiArrowLeft,
  FiCheck,
  FiRefreshCw,
  FiFolder,
  FiCalendar,
  FiFileText,
  FiImage,
  FiUpload,
  FiClock,
  FiSend,
  FiMapPin,
  FiVideo
} from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'
import SL_navbar from '../SL-components/SL_navbar'
import { salesLeadService } from '../SL-services'
import { salesMeetingsService } from '../SL-services'
import { useToast } from '../../../contexts/ToastContext'

const SL_leadProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  // State management
  const [lead, setLead] = useState(null)
  const [leadProfile, setLeadProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState({
    quotationSent: false,
    web: false,
    hotLead: false,
    demoSent: false,
    app: false,
    taxi: false
  })
  const [showConvertedDialog, setShowConvertedDialog] = useState(false)
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false)
  const [showRequestDemoDialog, setShowRequestDemoDialog] = useState(false)
  const [showLostDialog, setShowLostDialog] = useState(false)
  // Form states
  const [convertedForm, setConvertedForm] = useState({
    projectName: '',
    projectType: { web: false, app: false, taxi: false },
    estimatedBudget: '',
    startDate: '',
    description: ''
  })
  const [followUpForm, setFollowUpForm] = useState({
    date: null,
    time: '',
    notes: '',
    type: 'call'
  })
  const [requestDemoForm, setRequestDemoForm] = useState({
    clientName: '',
    description: '',
    reference: '',
    mobileNumber: ''
  })
  const [demoData, setDemoData] = useState({
    clientName: '',
    mobileNumber: '',
    description: '',
    reference: ''
  })
  const [conversionData, setConversionData] = useState({
    projectName: '',
    projectType: { web: false, app: false, taxi: false },
    totalCost: '',
    finishedDays: '',
    advanceReceived: '',
    includeGST: false,
    description: '',
    screenshot: null
  })
  const [lostReason, setLostReason] = useState('')
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [selectedTransferPerson, setSelectedTransferPerson] = useState('')
  const [showMeetingDialog, setShowMeetingDialog] = useState(false)
  const [showMeetingTypeDropdown, setShowMeetingTypeDropdown] = useState(false)
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
  const [meetingForm, setMeetingForm] = useState({
    clientName: '',
    meetingDate: '',
    meetingTime: '',
    meetingType: 'in-person',
    location: '',
    notes: '',
    assignee: ''
  })

  // Additional state for new features
  const [showNotesDialog, setShowNotesDialog] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [notes, setNotes] = useState([])
  const [salesTeam, setSalesTeam] = useState([])
  const [myClients, setMyClients] = useState([])
  const [selectedStatus, setSelectedStatus] = useState('')

  // Fetch lead data on component mount
  useEffect(() => {
    if (id) {
      fetchLeadData()
    }
  }, [id])

  useEffect(() => {
    const loadAux = async () => {
      try {
        const team = await salesLeadService.getSalesTeam()
        setSalesTeam(team || [])
        const cl = await salesMeetingsService.getMyConvertedClients()
        setMyClients(cl || [])
      } catch (e) {
        // ignore
      }
    }
    loadAux()
  }, [])

  const fetchLeadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await salesLeadService.getLeadDetail(id)
      if (response) {
        setLead(response)
        setLeadProfile(response.leadProfile)
        setSelectedStatus(response.status)
        
        // Update status checkboxes based on lead status
        updateStatusFromLeadStatus(response.status)
        
        // Update form data with lead information
        const lp = response.leadProfile
        setDemoData({
          clientName: lp?.name || response.name || '',
          mobileNumber: response.phone || '',
          description: '',
          reference: ''
        })
        
        setConversionData({
          projectName: lp?.businessName || '',
          projectType: {
            web: lp?.projectType?.web || false,
            app: lp?.projectType?.app || false,
            taxi: lp?.projectType?.taxi || false
          },
          totalCost: lp?.estimatedCost?.toString() || '',
          finishedDays: '',
          advanceReceived: '',
          includeGST: false,
          description: lp?.description || '',
          screenshot: null
        })
        
        setMeetingForm(prev => ({
          ...prev,
          clientName: lp?.name || response.name || ''
        }))
        
        // Set notes if available
        if (lp?.notes) {
          setNotes(lp.notes)
        }
      } else {
        setError('Lead not found')
      }
    } catch (err) {
      console.error('Error fetching lead data:', err)
      setError('Failed to fetch lead data')
      toast.error('Failed to load lead profile')
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatusFromLeadStatus = (leadStatus) => {
    const statusMap = {
      'quotation_sent': { quotationSent: true },
      'web': { web: true },
      'hot': { hotLead: true },
      'demo_requested': { demoSent: true },
      'app_client': { app: true },
      'taxi': { taxi: true }
    }
    
    const newStatus = {
      quotationSent: false,
      web: false,
      hotLead: false,
      demoSent: false,
      app: false,
      taxi: false
    }
    
    if (statusMap[leadStatus]) {
      Object.assign(newStatus, statusMap[leadStatus])
    }
    
    setStatus(newStatus)
  }

  const handleCall = (phone) => {
    window.open(`tel:${phone}`, '_self')
  }

  const handleWhatsApp = (phone) => {
    const clientName = leadProfile?.name || lead?.name || 'there'
    const message = encodeURIComponent(`Hello ${clientName}! I'm following up on our previous conversation. How can I help you today?`)
    window.open(`https://wa.me/91${phone}?text=${message}`, '_blank')
  }

  const handleStatusChange = (statusKey) => {
    setStatus(prev => {
      // Reset all statuses to false first
      const newStatus = {
        quotationSent: false,
        web: false,
        hotLead: false,
        demoSent: false,
        app: false,
        taxi: false
      }
      
      // Set only the selected status to true
      newStatus[statusKey] = true
      
      return newStatus
    })
  }

  const handleSave = async () => {
    if (!lead) return
    
    setIsLoading(true)
    try {
      // Map status checkboxes to lead status
      const statusMap = {
        'quotationSent': 'quotation_sent',
        'web': 'web',
        'hotLead': 'hot',
        'demoSent': 'demo_requested',
        'app': 'app_client',
        'taxi': 'taxi'
      }
      
      // Find the first checked status
      const checkedStatus = Object.keys(status).find(key => status[key])
      const newLeadStatus = checkedStatus ? statusMap[checkedStatus] : 'connected'
      
      console.log('Current lead status:', lead.status)
      console.log('Checked status:', checkedStatus)
      console.log('New lead status:', newLeadStatus)
      console.log('Status object:', status)
      
      // Only update lead status if it's different from current status
      if (newLeadStatus !== lead.status) {
        console.log('Updating lead status from', lead.status, 'to', newLeadStatus)
        await salesLeadService.updateLeadStatus(id, newLeadStatus)
        setSelectedStatus(newLeadStatus)
        
        // Update the lead object locally
        setLead(prev => ({ ...prev, status: newLeadStatus }))
      } else {
        console.log('Status is the same, skipping update')
      }
      
      // If lead profile exists, update it
      if (leadProfile) {
        const profileUpdateData = {
          quotationSent: status.quotationSent,
          demoSent: status.demoSent
        }
        await salesLeadService.updateLeadProfile(id, profileUpdateData)
      }
      
      toast.success('Status updated successfully')
      
      // Refresh dashboard stats if available
      if (window.refreshDashboardStats) {
        window.refreshDashboardStats()
      }
    } catch (err) {
      console.error('Error updating status:', err)
      toast.error('Failed to update status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFollow = () => {
    setShowFollowUpDialog(true)
  }

  const handleFollowUpFormChange = (field, value) => {
    setFollowUpForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFollowUpSubmit = async () => {
    if (!followUpForm.date || !followUpForm.time) {
      toast.error('Please select both date and time')
      return
    }

    setIsLoading(true)
    try {
      const followUpData = {
        date: followUpForm.date,
        time: followUpForm.time,
        notes: followUpForm.notes,
        type: followUpForm.type
      }
      
      await salesLeadService.updateLeadStatus(id, 'followup', followUpData)
      
      toast.success('Follow-up scheduled successfully')
      setShowFollowUpDialog(false)
      
      // Reset form
      setFollowUpForm({
        date: null,
        time: '',
        notes: '',
        type: 'call'
      })
      
      // Refresh data
      fetchLeadData()
    } catch (err) {
      console.error('Error scheduling follow-up:', err)
      toast.error('Failed to schedule follow-up')
    } finally {
      setIsLoading(false)
    }
  }

  const followUpTypes = [
    { value: 'call', label: 'Phone Call', icon: '📞' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'meeting', label: 'Meeting', icon: '🤝' },
    { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { value: 'visit', label: 'Site Visit', icon: '🏢' },
    { value: 'demo', label: 'Demo', icon: '🎯' }
  ]

  const getTypeIcon = (type) => {
    const typeObj = followUpTypes.find(t => t.value === type)
    return typeObj ? typeObj.icon : '📞'
  }

  const getTypeLabel = (type) => {
    const typeObj = followUpTypes.find(t => t.value === type)
    return typeObj ? typeObj.label : 'Phone Call'
  }

  const handleCloseFollowUpDialog = () => {
    setShowFollowUpDialog(false)
    setShowTypeDropdown(false)
  }

  const handleAddNote = () => {
    setShowNotesDialog(true)
  }

  const handleAddNoteSubmit = async () => {
    if (!newNote.trim()) {
      toast.error('Please enter a note')
      return
    }

    setIsLoading(true)
    try {
      await salesLeadService.addNoteToLead(id, { content: newNote.trim() })
      
      toast.success('Note added successfully')
      setShowNotesDialog(false)
      setNewNote('')
      
      // Refresh data to get updated notes
      fetchLeadData()
    } catch (err) {
      console.error('Error adding note:', err)
      toast.error('Failed to add note')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestDemo = () => {
    setShowRequestDemoDialog(true)
  }

  const handleRequestDemoFormChange = (field, value) => {
    setRequestDemoForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleRequestDemoSubmit = async () => {
    if (!demoData.clientName || !demoData.mobileNumber) {
      toast.error('Please fill in client name and mobile number')
      return
    }

    setIsLoading(true)
    try {
      const demoRequestData = {
        clientName: demoData.clientName,
        description: demoData.description,
        reference: demoData.reference,
        mobileNumber: demoData.mobileNumber
      }
      
      await salesLeadService.requestDemo(id, demoRequestData)
      
      toast.success('Demo request submitted successfully')
      setShowRequestDemoDialog(false)
      
      // Reset form
      setDemoData({
        clientName: leadProfile?.name || lead?.name || '',
        mobileNumber: lead?.phone || '',
        description: '',
        reference: ''
      })
      
      // Refresh data
      fetchLeadData()
    } catch (err) {
      console.error('Error submitting demo request:', err)
      toast.error('Failed to submit demo request')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseRequestDemoDialog = () => {
    setShowRequestDemoDialog(false)
  }

  const handleLost = () => {
    setShowLostDialog(true)
  }

  const handleLostSubmit = async () => {
    setIsLoading(true)
    try {
      const lostData = {
        lostReason: lostReason.trim() || 'No reason provided'
      }
      
      await salesLeadService.updateLeadStatus(id, 'lost', lostData)
      
      toast.success('Lead marked as lost')
      setShowLostDialog(false)
      setLostReason('')
      
      // Refresh data
      fetchLeadData()
    } catch (err) {
      console.error('Error marking lead as lost:', err)
      toast.error('Failed to mark lead as lost')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseLostDialog = () => {
    setShowLostDialog(false)
    setLostReason('')
  }

  // Fetch sales team when transfer dialog opens
  const handleTransferClient = async () => {
    try {
      const team = await salesLeadService.getSalesTeam()
      setSalesTeam(team)
      setShowTransferDialog(true)
    } catch (err) {
      console.error('Error fetching sales team:', err)
      toast.error('Failed to load sales team')
    }
  }

  const handleTransferSubmit = async () => {
    if (!selectedTransferPerson) {
      toast.error('Please select a person to transfer to')
      return
    }

    setIsLoading(true)
    try {
      const transferData = {
        toSalesId: selectedTransferPerson,
        reason: 'Transferred from lead profile'
      }
      
      await salesLeadService.transferLead(id, transferData)
      
      toast.success('Lead transferred successfully')
      setShowTransferDialog(false)
      setSelectedTransferPerson('')
      
      // Navigate back to leads list
      navigate('/leads')
    } catch (err) {
      console.error('Error transferring lead:', err)
      toast.error('Failed to transfer lead')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseTransferDialog = () => {
    setShowTransferDialog(false)
    setSelectedTransferPerson('')
  }

  // Mock list of people to transfer to
  const transferPeople = [
    { id: 1, name: 'John Smith', role: 'Sales Manager' },
    { id: 2, name: 'Sarah Johnson', role: 'Senior Sales Rep' },
    { id: 3, name: 'Mike Wilson', role: 'Sales Rep' },
    { id: 4, name: 'Emily Davis', role: 'Sales Rep' },
    { id: 5, name: 'David Brown', role: 'Sales Rep' }
  ]

  const meetingTypes = [
    { id: 'in-person', label: 'In-Person', icon: FiMapPin },
    { id: 'video', label: 'Video Call', icon: FiVideo },
    { id: 'phone', label: 'Phone Call', icon: FiPhone }
  ]

  const assignees = salesTeam.map(m => m.name)

  const handleAddMeeting = () => {
    setMeetingForm({
      clientName: leadProfile?.name || lead?.name || '',
      meetingDate: '',
      meetingTime: '',
      meetingType: 'in-person',
      location: '',
      notes: '',
      assignee: ''
    })
    setShowMeetingDialog(true)
  }

  const handleMeetingFormChange = (field, value) => {
    setMeetingForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveMeeting = () => {
    if (!meetingForm.meetingDate || !meetingForm.meetingTime) {
      toast.error('Please fill in meeting date and time')
      return
    }

    // Find client by name from my converted clients
    const clientId = myClients.find(c => c.name === meetingForm.clientName)?._id
    if (!clientId) {
      toast.error('Client not found. Convert this lead to a client first')
      return
    }

    const assigneeId = salesTeam.find(m => m.name === meetingForm.assignee)?._id
    if (!assigneeId) {
      toast.error('Please select an assignee')
      return
    }

    setIsLoading(true)
    salesMeetingsService.create({
      client: clientId,
      meetingDate: meetingForm.meetingDate,
      meetingTime: meetingForm.meetingTime,
      meetingType: meetingForm.meetingType,
      location: meetingForm.location,
      notes: meetingForm.notes,
      assignee: assigneeId
    }).then(() => {
      toast.success('Meeting scheduled successfully')
      setShowMeetingDialog(false)
    }).catch((err) => {
      console.error('Error scheduling meeting:', err)
      toast.error('Failed to schedule meeting')
    }).finally(() => setIsLoading(false))
  }

  const handleCloseMeetingDialog = () => {
    setShowMeetingDialog(false)
    setShowMeetingTypeDropdown(false)
    setShowAssigneeDropdown(false)
  }

  const handleMeetingTypeSelect = (type) => {
    setMeetingForm(prev => ({ ...prev, meetingType: type }))
    setShowMeetingTypeDropdown(false)
  }

  const handleAssigneeSelect = (assignee) => {
    setMeetingForm(prev => ({ ...prev, assignee: assignee }))
    setShowAssigneeDropdown(false)
  }

  const handleConverted = () => {
    setShowConvertedDialog(true)
  }

  const handleConvertedFormChange = (field, value) => {
    setConvertedForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleConvertedSubmit = async () => {
    // Validate required fields
    if (!conversionData.projectName.trim()) {
      toast.error('Please enter project name')
      return
    }
    if (!conversionData.totalCost.trim() || parseFloat(conversionData.totalCost) < 0) {
      toast.error('Please enter a valid total cost')
      return
    }
    if (!conversionData.projectType.web && !conversionData.projectType.app && !conversionData.projectType.taxi) {
      toast.error('Please select at least one project type')
      return
    }

    setIsLoading(true)
    try {
      // Prepare project data
      const projectData = {
        projectName: conversionData.projectName.trim(),
        projectType: conversionData.projectType,
        totalCost: parseFloat(conversionData.totalCost) || 0,
        finishedDays: conversionData.finishedDays ? parseInt(conversionData.finishedDays) : undefined,
        advanceReceived: conversionData.advanceReceived ? parseFloat(conversionData.advanceReceived) : 0,
        includeGST: conversionData.includeGST || false,
        description: conversionData.description.trim() || '',
        screenshot: conversionData.screenshot || null
      }

      await salesLeadService.convertLeadToClient(id, projectData)
      
      toast.success('Lead converted to client successfully')
      setShowConvertedDialog(false)
      
      // Reset form
      setConversionData({
        projectName: '',
        projectType: { web: false, app: false, taxi: false },
        totalCost: '',
        finishedDays: '',
        advanceReceived: '',
        includeGST: false,
        description: '',
        screenshot: null
      })
      
      navigate('/leads')
      
      // Refresh dashboard stats if available
      if (window.refreshDashboardStats) {
        window.refreshDashboardStats()
      }
    } catch (err) {
      console.error('Error converting lead:', err)
      toast.error('Failed to convert lead')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setShowConvertedDialog(false)
  }

  // Show loading state
  if (isLoading && !lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lead profile...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/leads')}
            className="bg-teal-500 text-white px-6 py-2 rounded-lg hover:bg-teal-600 transition-colors"
          >
            Back to Leads
          </button>
        </div>
      </div>
    )
  }

  // Show create profile CTA if no profile exists
  if (lead && !leadProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SL_navbar />
        <main className="max-w-md mx-auto px-4 pt-16 pb-20 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 text-center"
          >
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Lead Profile</h2>
            <p className="text-gray-600 mb-6">This lead doesn't have a profile yet. Create one to manage all lead information.</p>
            <button
              onClick={() => navigate(`/connected-form/${id}`)}
              className="bg-teal-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-600 transition-colors"
            >
              Create Profile
            </button>
          </motion.div>
        </main>
      </div>
    )
  }

  // Get display data
  const displayName = leadProfile?.name || lead?.name || 'Unknown'
  const displayPhone = lead?.phone || ''
  const displayBusiness = leadProfile?.businessName || lead?.company || 'No business info'
  const displayCost = leadProfile?.estimatedCost ? `${leadProfile.estimatedCost}k` : 'Not specified'
  const avatar = displayName.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50">
      <SL_navbar />
      
      <main className="max-w-md mx-auto px-4 pt-16 pb-20 sm:px-6 lg:px-8">
        
        {/* Mobile Layout */}
        <div className="lg:hidden">

          {/* Profile Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6"
          >
            {/* Avatar and Basic Info */}
            <div className="text-center mb-6">
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                  <span className="text-2xl font-bold text-white">{avatar}</span>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{displayName}</h2>
              <p className="text-lg text-teal-600 mb-1 font-medium">{displayPhone}</p>
              <p className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full inline-block">{displayBusiness}</p>
            </div>

            {/* Contact Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => handleCall(displayPhone)}
                className="bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-teal-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <FiPhone className="text-lg" />
                <span>Call</span>
              </button>
              <button
                onClick={() => handleWhatsApp(displayPhone)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <FiMessageCircle className="text-lg" />
                <span>WhatsApp</span>
              </button>
            </div>
          </motion.div>

          {/* Action Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="bg-gray-50 rounded-2xl p-4 shadow-sm border border-gray-100 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                E-cost: {displayCost}
              </div>
            <button 
              onClick={handleAddMeeting}
              className="flex items-center space-x-2 p-2 hover:bg-teal-50 rounded-full transition-colors duration-200"
            >
              <FiPlus className="text-xl text-teal-600" />
              <span className="text-sm font-medium text-teal-600">Add Meeting</span>
            </button>
            </div>
          </motion.div>

          {/* Status Checkboxes */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-br from-white to-teal-50 rounded-2xl p-6 shadow-lg border border-teal-200 mb-6"
          >
            <h3 className="text-lg font-semibold text-teal-900 mb-4 flex items-center">
              <div className="w-2 h-2 bg-teal-500 rounded-full mr-2"></div>
              Lead Status
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-teal-50 transition-colors duration-200">
                <input
                  type="checkbox"
                  checked={status.quotationSent}
                  onChange={() => handleStatusChange('quotationSent')}
                  className="w-5 h-5 text-teal-600 border-teal-300 rounded focus:ring-teal-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-teal-800">Quotation Sent</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-teal-50 transition-colors duration-200">
                <input
                  type="checkbox"
                  checked={status.web}
                  onChange={() => handleStatusChange('web')}
                  className="w-5 h-5 text-teal-600 border-teal-300 rounded focus:ring-teal-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-teal-800">Web</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-teal-50 transition-colors duration-200">
                <input
                  type="checkbox"
                  checked={status.hotLead}
                  onChange={() => handleStatusChange('hotLead')}
                  className="w-5 h-5 text-teal-600 border-teal-300 rounded focus:ring-teal-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-teal-800">Hot Lead</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-teal-50 transition-colors duration-200">
                <input
                  type="checkbox"
                  checked={status.demoSent}
                  onChange={() => handleStatusChange('demoSent')}
                  className="w-5 h-5 text-teal-600 border-teal-300 rounded focus:ring-teal-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-teal-800">Demo Sent</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-teal-50 transition-colors duration-200">
                <input
                  type="checkbox"
                  checked={status.app}
                  onChange={() => handleStatusChange('app')}
                  className="w-5 h-5 text-teal-600 border-teal-300 rounded focus:ring-teal-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-teal-800">App</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-teal-50 transition-colors duration-200">
                <input
                  type="checkbox"
                  checked={status.taxi}
                  onChange={() => handleStatusChange('taxi')}
                  className="w-5 h-5 text-teal-600 border-teal-300 rounded focus:ring-teal-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-teal-800">Taxi</span>
              </label>
            </div>
          </motion.div>

          {/* Save Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-6"
          >
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-teal-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiSave className="text-lg" />
              )}
              <span>{isLoading ? 'Saving...' : 'Save'}</span>
            </button>
          </motion.div>

          {/* Action Buttons Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 gap-3 mb-6"
          >
            <button
              onClick={handleAddFollow}
              className="bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 px-4 rounded-xl font-semibold text-sm hover:from-teal-600 hover:to-teal-700 transition-all duration-200"
            >
              Add Follow Up
            </button>
            
            <button
              onClick={handleAddNote}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold text-sm hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
            >
              Add Note
            </button>
            
            <button
              onClick={handleRequestDemo}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-xl font-semibold text-sm hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
            >
              Request Demo
            </button>
            
            <button
              onClick={handleLost}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-xl font-semibold text-sm hover:from-red-600 hover:to-red-700 transition-all duration-200"
            >
              Lost
            </button>
          </motion.div>

          {/* Transfer Client Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-6"
          >
            <button
              onClick={handleTransferClient}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-teal-600 hover:to-teal-700 transition-all duration-200"
            >
              <FiRefreshCw className="text-lg" />
              <span>Transfer Client</span>
            </button>
          </motion.div>

          {/* Converted Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <button
              onClick={handleConverted}
              className="w-full bg-gradient-to-r from-teal-500 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-teal-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <FiCheck className="text-lg" />
              <span>Converted</span>
            </button>
          </motion.div>
        </div>

        {/* Converted Dialog */}
        {showConvertedDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Dialog Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Convert Client</h2>
                <button
                  onClick={handleCloseDialog}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <FiX className="text-xl text-gray-600" />
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Client Name - Pre-filled, Read-only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600">
                      <FiUser className="text-lg" />
                    </div>
                    <input
                      type="text"
                      value={displayName}
                      readOnly
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600">
                      <FiFolder className="text-lg" />
                    </div>
                  <input
                    type="text"
                    value={conversionData.projectName}
                    onChange={(e) => setConversionData({ ...conversionData, projectName: e.target.value })}
                      placeholder="Project name"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                    required
                  />
                  </div>
                </div>

                {/* Phone Number - Pre-filled, Read-only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600">
                      <FiPhone className="text-lg" />
                    </div>
                    <input
                      type="text"
                      value={displayPhone}
                      readOnly
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Finished Days */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Finished Days</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600">
                      <FiCalendar className="text-lg" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={conversionData.finishedDays}
                      onChange={(e) => setConversionData({ ...conversionData, finishedDays: e.target.value })}
                      placeholder="Finished days"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Project Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Type <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={conversionData.projectType.web}
                        onChange={(e) => setConversionData({
                          ...conversionData,
                          projectType: { ...conversionData.projectType, web: e.target.checked }
                        })}
                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Web</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={conversionData.projectType.app}
                        onChange={(e) => setConversionData({
                          ...conversionData,
                          projectType: { ...conversionData.projectType, app: e.target.checked }
                        })}
                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">App</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={conversionData.projectType.taxi}
                        onChange={(e) => setConversionData({
                          ...conversionData,
                          projectType: { ...conversionData.projectType, taxi: e.target.checked }
                        })}
                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Taxi</span>
                    </label>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-teal-600">
                      <FiFileText className="text-lg" />
                    </div>
                    <textarea
                      value={conversionData.description}
                      onChange={(e) => setConversionData({ ...conversionData, description: e.target.value })}
                      placeholder="Description"
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 resize-none"
                    />
                  </div>
                </div>

                {/* Total Cost */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Cost <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600">
                      <FaRupeeSign className="text-lg" />
                    </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                      value={conversionData.totalCost}
                      onChange={(e) => setConversionData({ ...conversionData, totalCost: e.target.value })}
                      placeholder="Total cost"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                    required
                  />
                  </div>
                </div>

                {/* Advance Received */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Advance Received</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600">
                      <FiCheck className="text-lg" />
                    </div>
                  <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={conversionData.advanceReceived}
                      onChange={(e) => setConversionData({ ...conversionData, advanceReceived: e.target.value })}
                      placeholder="Advance received"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                  />
                  </div>
                </div>

                {/* Upload Screenshot */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Screenshot</label>
                  <div
                    onClick={() => document.getElementById('screenshot-upload').click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-teal-500 transition-colors duration-200"
                  >
                    <input
                      id="screenshot-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          setConversionData({ ...conversionData, screenshot: file })
                        }
                      }}
                      className="hidden"
                    />
                    {conversionData.screenshot ? (
                      <div className="space-y-2">
                        <FiImage className="text-4xl text-teal-600 mx-auto" />
                        <p className="text-sm text-gray-700">{conversionData.screenshot.name}</p>
                  <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setConversionData({ ...conversionData, screenshot: null })
                            document.getElementById('screenshot-upload').value = ''
                          }}
                          className="text-xs text-red-600 hover:text-red-800"
                  >
                          Remove
                  </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <FiUpload className="text-4xl text-gray-400 mx-auto" />
                        <p className="text-sm text-gray-600">Drop image here or click to upload</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Include GST */}
                <div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={conversionData.includeGST}
                      onChange={(e) => setConversionData({ ...conversionData, includeGST: e.target.checked })}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include GST</span>
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    onClick={handleConvertedSubmit}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-teal-500 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-teal-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FiCheck className="text-lg" />
                    )}
                    <span>{isLoading ? 'Converting...' : 'Converted'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Follow-up Dialog */}
        {showFollowUpDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              {/* Dialog Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Schedule Follow-up</h2>
                <button
                  onClick={handleCloseFollowUpDialog}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <FiX className="text-xl text-gray-600" />
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-5">
                {/* Date Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Date</label>
                  <div className="relative">
                    <DatePicker
                      selected={followUpForm.date}
                      onChange={(date) => handleFollowUpFormChange('date', date)}
                      dateFormat="dd/MM/yyyy"
                      minDate={new Date()}
                      placeholderText="Select date"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                      wrapperClassName="w-full"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600 pointer-events-none">
                      <FiCalendar className="text-lg" />
                    </div>
                  </div>
                </div>

                {/* Time Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Time</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600">
                      <FiClock className="text-lg" />
                    </div>
                    <input
                      type="time"
                      value={followUpForm.time}
                      onChange={(e) => handleFollowUpFormChange('time', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Follow-up Type - Custom Dropdown */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getTypeIcon(followUpForm.type)}</span>
                        <span>{getTypeLabel(followUpForm.type)}</span>
                      </div>
                      <FiArrowLeft className={`text-gray-400 transition-transform duration-200 ${showTypeDropdown ? 'rotate-90' : '-rotate-90'}`} />
                    </button>
                    
                    {showTypeDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto"
                      >
                        {followUpTypes.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => {
                              handleFollowUpFormChange('type', type.value)
                              setShowTypeDropdown(false)
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-teal-50 transition-colors duration-200 flex items-center space-x-3 ${
                              followUpForm.type === type.value ? 'bg-teal-50 text-teal-700' : 'text-gray-700'
                            }`}
                          >
                            <span className="text-lg">{type.icon}</span>
                            <span>{type.label}</span>
                            {followUpForm.type === type.value && (
                              <FiCheck className="ml-auto text-teal-600" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Notes Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Notes (Optional)</label>
                  <textarea
                    value={followUpForm.notes}
                    onChange={(e) => handleFollowUpFormChange('notes', e.target.value)}
                    placeholder="Add any notes about this follow-up..."
                    className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 resize-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6">
                <button
                  onClick={handleFollowUpSubmit}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-teal-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiCalendar className="text-lg" />
                  )}
                  <span>{isLoading ? 'Scheduling...' : 'Schedule Follow-up'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Request Demo Dialog */}
        {showRequestDemoDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              {/* Dialog Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Request Demo</h2>
                <button
                  onClick={handleCloseRequestDemoDialog}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <FiX className="text-xl text-gray-600" />
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Client Name Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600">
                      <FiUser className="text-lg" />
                    </div>
                    <input
                      type="text"
                      value={demoData.clientName}
                      onChange={(e) => setDemoData({ ...demoData, clientName: e.target.value })}
                      placeholder="Enter client name"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Description Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600">
                      <FiFileText className="text-lg" />
                    </div>
                    <input
                      type="text"
                      value={demoData.description}
                      onChange={(e) => setDemoData({ ...demoData, description: e.target.value })}
                      placeholder="Enter description"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Reference Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600">
                      <FiFolder className="text-lg" />
                    </div>
                    <input
                      type="text"
                      value={demoData.reference}
                      onChange={(e) => setDemoData({ ...demoData, reference: e.target.value })}
                      placeholder="Reference"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Mobile Number Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600">
                      <FiPhone className="text-lg" />
                    </div>
                    <input
                      type="tel"
                      value={demoData.mobileNumber}
                      onChange={(e) => setDemoData({ ...demoData, mobileNumber: e.target.value })}
                      placeholder="Enter client mobile number"
                      maxLength={10}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                      {demoData.mobileNumber.length}/10
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6">
                <button
                  onClick={handleRequestDemoSubmit}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-4 px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:from-teal-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiSend className="text-lg" />
                  )}
                  <span>{isLoading ? 'Sending...' : 'Send'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Lost Dialog */}
        {showLostDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              {/* Dialog Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Reason</h2>
                <button
                  onClick={handleCloseLostDialog}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <FiX className="text-xl text-gray-600" />
                </button>
              </div>

              {/* Reason Input Field */}
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600">
                    <FiUser className="text-lg" />
                  </div>
                  <input
                    type="text"
                    value={lostReason}
                    onChange={(e) => setLostReason(e.target.value)}
                    placeholder="Enter reason here"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={handleCloseLostDialog}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLostSubmit}
                  disabled={isLoading}
                  className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-medium hover:from-teal-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  <span>{isLoading ? 'Marking...' : 'Ok'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Transfer Dialog */}
        {showTransferDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              {/* Dialog Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Transfer Client</h2>
                <button
                  onClick={handleCloseTransferDialog}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <FiX className="text-xl text-gray-600" />
                </button>
              </div>

              {/* Client Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{avatar}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{displayName}</h3>
                    <p className="text-sm text-gray-500">{displayBusiness}</p>
                  </div>
                </div>
              </div>

              {/* Transfer To List */}
              <div className="space-y-3 mb-6">
                <h3 className="text-sm font-medium text-gray-700">Transfer to:</h3>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {salesTeam.map((person) => (
                    <label
                      key={person._id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        selectedTransferPerson === person._id
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="transferPerson"
                        value={person._id}
                        checked={selectedTransferPerson === person._id}
                        onChange={(e) => setSelectedTransferPerson(e.target.value)}
                        className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{person.name}</div>
                        <div className="text-sm text-gray-500">{person.department || 'Sales'}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={handleCloseTransferDialog}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransferSubmit}
                  disabled={isLoading || !selectedTransferPerson}
                  className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-medium hover:from-teal-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiRefreshCw className="w-4 h-4" />
                  )}
                  <span>{isLoading ? 'Transferring...' : 'Transfer'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Notes Dialog */}
        {showNotesDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              {/* Dialog Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Add Note</h2>
                <button
                  onClick={() => setShowNotesDialog(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <FiX className="text-xl text-gray-600" />
                </button>
              </div>

              {/* Notes List */}
              {notes.length > 0 && (
                <div className="mb-4 max-h-40 overflow-y-auto">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Previous Notes:</h3>
                  <div className="space-y-2">
                    {notes.map((note, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-800">{note.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {note.addedBy?.name || 'Unknown'} • {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Note Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Note</label>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter your note here..."
                    className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 resize-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowNotesDialog(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNoteSubmit}
                  disabled={isLoading || !newNote.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-medium hover:from-teal-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  <span>{isLoading ? 'Adding...' : 'Add Note'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Meeting Dialog */}
        {showMeetingDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Dialog Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Add Meeting</h2>
                <button
                  onClick={handleCloseMeetingDialog}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <FiX className="text-xl text-gray-600" />
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Client Name (Pre-filled) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Client Name</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600">
                      <FiUser className="text-lg" />
                    </div>
                    <input
                      type="text"
                      value={meetingForm.clientName}
                      readOnly
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Date and Time Row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Meeting Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Date *</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600">
                        <FiCalendar className="text-lg" />
                      </div>
                      <input
                        type="date"
                        value={meetingForm.meetingDate}
                        onChange={(e) => handleMeetingFormChange('meetingDate', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Meeting Time */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Time *</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600">
                        <FiClock className="text-lg" />
                      </div>
                      <input
                        type="time"
                        value={meetingForm.meetingTime}
                        onChange={(e) => handleMeetingFormChange('meetingTime', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Meeting Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Meeting Type</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMeetingTypeDropdown(!showMeetingTypeDropdown)
                        setShowAssigneeDropdown(false)
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        {(() => {
                          const selectedType = meetingTypes.find(t => t.id === meetingForm.meetingType)
                          const Icon = selectedType ? selectedType.icon : FiMapPin
                          return (
                            <>
                              <Icon className="text-sm text-gray-600" />
                              <span>{selectedType ? selectedType.label : 'Select Type'}</span>
                            </>
                          )
                        })()}
                      </div>
                      <FiArrowLeft className={`text-gray-400 transition-transform duration-200 ${showMeetingTypeDropdown ? 'rotate-90' : '-rotate-90'}`} />
                    </button>
                    
                    {showMeetingTypeDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
                      >
                        {meetingTypes.map((type) => {
                          const Icon = type.icon
                          return (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => handleMeetingTypeSelect(type.id)}
                              className={`w-full px-4 py-3 text-left hover:bg-teal-50 transition-colors duration-200 flex items-center space-x-3 ${
                                meetingForm.meetingType === type.id ? 'bg-teal-50 text-teal-700' : 'text-gray-700'
                              }`}
                            >
                              <Icon className="text-sm" />
                              <span>{type.label}</span>
                              {meetingForm.meetingType === type.id && (
                                <FiCheck className="ml-auto text-teal-600" />
                              )}
                            </button>
                          )
                        })}
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Assignee */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Assignee</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAssigneeDropdown(!showAssigneeDropdown)
                        setShowMeetingTypeDropdown(false)
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <FiUser className="text-sm text-gray-600" />
                        <span>{meetingForm.assignee || 'Select Assignee'}</span>
                      </div>
                      <FiArrowLeft className={`text-gray-400 transition-transform duration-200 ${showAssigneeDropdown ? 'rotate-90' : '-rotate-90'}`} />
                    </button>
                    
                    {showAssigneeDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto"
                      >
                        {assignees.map((assignee) => (
                          <button
                            key={assignee}
                            type="button"
                            onClick={() => handleAssigneeSelect(assignee)}
                            className={`w-full px-4 py-3 text-left hover:bg-teal-50 transition-colors duration-200 flex items-center space-x-3 ${
                              meetingForm.assignee === assignee ? 'bg-teal-50 text-teal-700' : 'text-gray-700'
                            }`}
                          >
                            <FiUser className="text-sm" />
                            <span>{assignee}</span>
                            {meetingForm.assignee === assignee && (
                              <FiCheck className="ml-auto text-teal-600" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Location</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600">
                      <FiMapPin className="text-lg" />
                    </div>
                    <input
                      type="text"
                      value={meetingForm.location}
                      onChange={(e) => handleMeetingFormChange('location', e.target.value)}
                      placeholder="Enter meeting location or link"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={meetingForm.notes}
                    onChange={(e) => handleMeetingFormChange('notes', e.target.value)}
                    placeholder="Add meeting notes or agenda..."
                    className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 resize-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6">
                <button
                  onClick={handleSaveMeeting}
                  disabled={isLoading || !meetingForm.meetingDate || !meetingForm.meetingTime}
                  className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-teal-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiCalendar className="text-lg" />
                  )}
                  <span>{isLoading ? 'Scheduling...' : 'Schedule Meeting'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="max-w-2xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <FiArrowLeft className="text-xl text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Client Profile</h1>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200">
                  <FiPlus className="text-xl text-teal-600" />
                </button>
              </div>

              {/* Profile Section */}
              <div className="text-center mb-8">
                <div className="relative inline-block mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-bold text-white">{avatar}</span>
                  </div>
                  <div className="absolute -top-3 -right-3 bg-teal-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                    {displayCost}
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{displayName}</h2>
                <p className="text-xl text-gray-600 mb-2">{displayPhone}</p>
                <p className="text-base text-gray-500">{displayBusiness}</p>
              </div>

              {/* Contact Buttons */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => handleCall(displayPhone)}
                  className="bg-teal-500 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-3 hover:bg-teal-600 transition-colors duration-200"
                >
                  <FiPhone className="text-xl" />
                  <span>Call</span>
                </button>
                <button
                  onClick={() => handleWhatsApp(displayPhone)}
                  className="bg-green-500 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-3 hover:bg-green-600 transition-colors duration-200"
                >
                  <FiMessageCircle className="text-xl" />
                  <span>WhatsApp</span>
                </button>
              </div>

              {/* Status Checkboxes */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Lead Status</h3>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { key: 'quotationSent', label: 'Quotation Sent' },
                    { key: 'web', label: 'Web' },
                    { key: 'hotLead', label: 'Hot Lead' },
                    { key: 'demoSent', label: 'Demo Sent' },
                    { key: 'app', label: 'App' },
                    { key: 'taxi', label: 'Taxi' }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={status[item.key]}
                        onChange={() => handleStatusChange(item.key)}
                        className="w-6 h-6 text-teal-600 border-gray-300 rounded focus:ring-teal-500 focus:ring-2"
                      />
                      <span className="text-base font-medium text-gray-700">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-3 hover:from-teal-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiSave className="text-xl" />
                  )}
                  <span>{isLoading ? 'Saving...' : 'Save'}</span>
                </button>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleAddFollow}
                    className="bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-teal-600 hover:to-teal-700 transition-all duration-200"
                  >
                    Add Follow Up
                  </button>
                  
                  <button
                    onClick={handleAddNote}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
                  >
                    Add Note
                  </button>
                  
                  <button
                    onClick={handleRequestDemo}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
                  >
                    Request Demo
                  </button>
                  
                  <button
                    onClick={handleLost}
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200"
                  >
                    Lost
                  </button>
                </div>

                <button
                  onClick={handleTransferClient}
                  className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-3 hover:from-teal-600 hover:to-teal-700 transition-all duration-200"
                >
                  <FiRefreshCw className="text-xl" />
                  <span>Transfer Client</span>
                </button>

                <button
                  onClick={handleConverted}
                  className="w-full bg-gradient-to-r from-teal-500 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-teal-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <FiCheck className="text-lg" />
                  <span>Converted</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SL_leadProfile