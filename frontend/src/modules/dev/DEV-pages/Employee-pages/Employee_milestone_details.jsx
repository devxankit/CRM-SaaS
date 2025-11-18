import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Employee_navbar from '../../DEV-components/Employee_navbar'
import {
  FiTarget as Target,
  FiCalendar as Calendar,
  FiUser as User,
  FiClock as Clock,
  FiFileText as FileText,
  FiMessageSquare as MessageSquare,
  FiPaperclip as Paperclip,
  FiArrowLeft as ArrowLeft,
  FiEye as Eye,
  FiDownload as Download,
  FiX as X,
  FiCheckSquare as CheckSquare,
  FiFolder as FolderKanban,
  FiBarChart2 as BarChart3,
  FiTrendingUp as TrendingUp
} from 'react-icons/fi'

const Employee_milestone_details = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [milestone, setMilestone] = useState(null)
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await new Promise(r => setTimeout(r, 400))
      const mockProject = { _id: 'p1', name: 'Website Revamp' }
      const mockMilestone = { _id: id, title: 'Auth & Users', description: 'Implement authentication', status: 'in-progress', progress: 60, dueDate: new Date(Date.now()+5*24*60*60*1000).toISOString(), assignedTo: { fullName: 'You' }, attachments: [], comments: [] }
      const mockTasks = [ { _id:'t1', title:'Implement login', description:'form & API', status:'in-progress' }, { _id:'t2', title:'Forgot password', description:'email OTP', status:'pending' } ]
      setProject(mockProject)
      setMilestone(mockMilestone)
      setTasks(mockTasks)
      setLoading(false)
    }
    if (id) load()
  }, [id])

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'in-progress': return 'bg-primary/10 text-primary border-primary/20'
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Employee_navbar />
        <main className="pt-16 pb-24 md:pt-20 md:pb-8">
          <div className="px-4 md:max-w-6xl md:mx-auto md:px-6 lg:px-8">
            <div className="flex items-center justify-center h-64 text-gray-600">Loading milestone...</div>
          </div>
        </main>
      </div>
    )
  }

  if (!milestone) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Employee_navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-20 md:pb-8">
        <div className="mb-6 sm:mb-8">
          <button onClick={() => navigate(`/employee-project/${project?._id}`)} className="mb-4 text-gray-600 hover:text-gray-900 flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </button>
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl flex-shrink-0">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 break-words">{milestone.title}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(milestone.status)}`}>{milestone.status}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Milestone Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-base text-gray-900 mt-1">{milestone.description || 'No description provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Due Date</label>
                  <p className="text-base font-medium text-gray-900 mt-1">{milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : 'No due date set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Assigned To</label>
                  <p className="text-base font-medium text-gray-900 mt-1">{milestone.assignedTo?.fullName || 'Unassigned'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Project</label>
                  <p className="text-base font-medium text-gray-900 mt-1">{project?.name || 'Unknown Project'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Progress</h2>
                <div className="flex items-center space-x-2">
                  <button onClick={() => {}} className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1">
                    <BarChart3 className="h-4 w-4" />
                    <span>Refresh</span>
                  </button>
                  <button onClick={() => {}} className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>Recalculate</span>
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Milestone Progress</span>
                  <span className="font-medium text-gray-900">{milestone.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-primary to-primary-dark h-3 rounded-full transition-all duration-300" style={{ width: `${milestone.progress || 0}%` }} />
                </div>
                <div className="text-xs text-gray-500">Based on completed tasks in this milestone</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks ({tasks.length})</h2>
              {tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.map(task => (
                    <div key={task._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{task.title}</h3>
                          <p className="text-sm text-gray-600">{task.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>{task.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckSquare className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                  <p className="text-gray-600">Tasks for this milestone will appear here</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Paperclip className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No attachments yet</h3>
                <p className="text-gray-600">Files will appear here when uploaded</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
                  <span className="text-sm text-gray-500">(0)</span>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-6">
                <div className="space-y-4">
                  <textarea value={newComment} onChange={(e)=>setNewComment(e.target.value)} placeholder="Add a comment to this milestone..." rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none" />
                  <div className="flex justify-end">
                    <button disabled={!newComment.trim()} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Add Comment</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Employee_milestone_details
