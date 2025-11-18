import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Employee_navbar from '../../DEV-components/Employee_navbar'
import { employeeService } from '../../DEV-services'
import {
  FiFolder as FolderKanban,
  FiCalendar as Calendar,
  FiUser as User,
  FiClock as Clock,
  FiTarget as Target,
  FiUsers as Users,
  FiArrowLeft as ArrowLeft,
  FiCheckSquare as CheckSquare,
  FiTrendingUp as TrendingUp,
  FiFileText as FileText,
  FiBarChart2 as BarChart3
} from 'react-icons/fi'

const Employee_project_detail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [project, setProject] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const load = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        setError(null)
        
        // Load project details
        const projectData = await employeeService.getEmployeeProjectById(id)
        
        // Handle case where response might be wrapped in data property
        const project = projectData?.data || projectData
        
        if (!project) {
          throw new Error('Project data not found in response')
        }
        
        // Transform project data to match component expectations
        const transformedProject = {
          ...project,
          // Map client to customer for backward compatibility
          customer: project.client ? {
            company: project.client.company || project.client.companyName || 'N/A'
          } : null,
          // Map assignedTeam members to have fullName
          assignedTeam: (project.assignedTeam || []).map(member => ({
            ...member,
            fullName: member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown'
          })),
          // Calculate overall progress from milestones based on completed milestones vs total milestones
          progress: (() => {
            if (project.milestones && project.milestones.length > 0) {
              const totalMilestones = project.milestones.length
              const completedMilestones = project.milestones.filter(m => m.status === 'completed').length
              return totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0
            }
            // Fallback to project progress if no milestones
            return project.progress || 0
          })(),
          // Calculate myTasks and myCompletedTasks from milestones
          myTasks: project.milestones ? project.milestones.reduce((sum, m) => sum + (m.employeeTasks || 0), 0) : 0,
          myCompletedTasks: project.milestones ? project.milestones.reduce((sum, m) => sum + (m.employeeCompletedTasks || 0), 0) : 0
        }
        
        // Transform milestones data
        const transformedMilestones = (project.milestones || []).map(milestone => ({
          ...milestone,
          // Use employeeProgress if available, otherwise calculate from employeeTasks
          progress: milestone.employeeProgress !== undefined 
            ? milestone.employeeProgress 
            : (milestone.employeeTasks > 0 
                ? Math.round((milestone.employeeCompletedTasks / milestone.employeeTasks) * 100) 
                : 0),
          // Map employeeTasks to myTasks for consistency
          myTasks: milestone.employeeTasks || 0,
          myCompletedTasks: milestone.employeeCompletedTasks || 0
        }))
        
        setProject(transformedProject)
        setMilestones(transformedMilestones)
      } catch (error) {
        console.error('Error loading project details:', error)
        setError(error.message || 'Failed to load project details. Please try again.')
        setProject(null)
        setMilestones([])
      } finally {
        setLoading(false)
      }
    }
    
    load()
  }, [id])

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'active': return 'bg-primary/10 text-primary border-primary/20'
      case 'planning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'on-hold': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
      case 'high': return 'bg-red-100 text-red-800'
      case 'normal': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 md:bg-gray-50">
        <Employee_navbar />
        <main className="pt-16 pb-24 md:pt-20 md:pb-8">
          <div className="px-4 md:max-w-4xl md:mx-auto md:px-6 lg:px-8">
            <div className="flex items-center justify-center h-64 text-gray-600">Loading project details...</div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 md:bg-gray-50">
        <Employee_navbar />
        <main className="pt-16 pb-24 md:pt-20 md:pb-8">
          <div className="px-4 md:max-w-4xl md:mx-auto md:px-6 lg:px-8">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-red-100">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiFileText className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Project</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={() => navigate('/employee/projects')}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Back to Projects
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 md:bg-gray-50">
        <Employee_navbar />
        <main className="pt-16 pb-24 md:pt-20 md:pb-8">
          <div className="px-4 md:max-w-4xl md:mx-auto md:px-6 lg:px-8">
            <div className="text-center py-12">
              <p className="text-gray-600">Project not found</p>
              <button
                onClick={() => navigate('/employee/projects')}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Back to Projects
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'milestones', label: 'Milestones', icon: Target },
    { key: 'team', label: 'Team', icon: Users }
  ]

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-6 border border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-primary/20 rounded-2xl">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Project Progress</h3>
                <p className="text-sm text-gray-600">Overall completion status</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{project.progress || 0}%</div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-gradient-to-r from-primary to-primary-dark h-3 rounded-full transition-all duration-500" style={{ width: `${project.progress || 0}%` }} />
          </div>
        </div>
      </div>
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 border border-primary/20 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-primary/20 rounded-xl">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Project Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/50 rounded-xl p-4 border border-primary/10">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Start Date</p>
                <p className="text-sm font-bold text-gray-900">{new Date(project.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/50 rounded-xl p-4 border border-primary/10">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Due Date</p>
                <p className="text-sm font-bold text-gray-900">{new Date(project.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderMilestones = () => (
    <div className="space-y-4">
      {milestones.length > 0 ? milestones.map((ms) => (
        <div key={ms._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow duration-200" onClick={() => navigate(`/employee/milestone-details/${ms._id}?projectId=${id}`)}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">{ms.title}</h3>
            <span className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium border ${getStatusColor(ms.status)}`}>{ms.status}</span>
          </div>
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="text-gray-900 font-medium">{ms.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 md:h-3">
              <div className="bg-gradient-to-r from-primary to-primary-dark h-2 md:h-3 rounded-full transition-all duration-300" style={{ width: `${ms.progress || 0}%` }} />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Due: {ms.dueDate ? new Date(ms.dueDate).toLocaleDateString() : 'No due date'}</span>
            <span>My Tasks: {ms.myCompletedTasks || 0}/{ms.myTasks || 0}</span>
          </div>
        </div>
      )) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No milestones yet</h3>
          <p className="text-gray-600">Milestones will appear here when they are created</p>
        </div>
      )}
    </div>
  )

  const renderTeam = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {project.assignedTeam?.map(member => (
        <div key={member._id} className="group bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition-all duration-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/30 transition-all duration-200">
              <span className="text-base font-bold text-primary">{member.fullName.split(' ').map(w=>w[0]).join('').substring(0,2)}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors duration-200">{member.fullName}</h3>
              <p className="text-sm text-gray-600">Team Member</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 md:bg-gray-50">
      <Employee_navbar />
      <main className="pt-16 pb-24 md:pt-20 md:pb-8">
        <div className="px-4 md:max-w-4xl md:mx-auto md:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-2 rounded-lg ${getStatusColor(project.status)}`}>
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <h1 className="text-xl md:text-3xl font-bold text-gray-900">{project.name}</h1>
                </div>
                <div className="flex items-center space-x-2 mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>{project.status}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>{project.priority}</span>
                </div>
              </div>
              {project.dueDate && (
                <div className="text-right">
                  <div className="text-xs md:text-sm text-gray-500 mt-1">Due: {new Date(project.dueDate).toLocaleDateString()}</div>
                </div>
              )}
            </div>
            {project.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-600 leading-relaxed">{project.description}</p>
              </div>
            )}
          </div>

          <div className="md:hidden mb-6">
            <div className="grid grid-cols-3 gap-3">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`p-4 rounded-2xl shadow-sm border transition-all ${activeTab === tab.key ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-gray-600 border-gray-200 active:scale-95'}`}>
                    <div className="flex flex-col items-center space-y-2">
                      <Icon className="h-6 w-6" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="hidden md:block mb-8">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="min-h-[400px]">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'milestones' && renderMilestones()}
            {activeTab === 'team' && renderTeam()}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Employee_project_detail
