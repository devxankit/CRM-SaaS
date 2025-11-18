import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PM_navbar from '../../DEV-components/PM_navbar'
import { User, Mail, Camera, Edit3, Save, X, Loader2, LogOut } from 'lucide-react'
import { logoutPM, clearPMData, getStoredPMData } from '../../DEV-services/pmAuthService'
import { socketService } from '../../DEV-services'
import { useToast } from '../../../../contexts/ToastContext'

const PM_Profile = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    avatar: 'PM',
    profileImage: null,
    department: 'Product',
    jobTitle: 'Project Manager',
    workTitle: 'PM',
    phone: '',
    location: '',
    skills: []
  })

  // Load profile data from stored PM data
  useEffect(() => {
    const timer = setTimeout(() => {
      const storedPMData = getStoredPMData()
      if (storedPMData) {
        setProfileData(prev => ({
          ...prev,
          fullName: storedPMData.name || 'PM User',
          email: storedPMData.email || 'pm@example.com',
          phone: storedPMData.phone || '+1 (555) 123-4567',
          location: 'San Francisco, CA',
          skills: storedPMData.skills || ['Leadership', 'Scrum', 'Roadmapping']
        }))
      } else {
        // Fallback data if no stored data
        setProfileData(prev => ({
          ...prev,
          fullName: 'PM User',
          email: 'pm@example.com',
          phone: '+1 (555) 123-4567',
          location: 'San Francisco, CA',
          skills: ['Leadership', 'Scrum', 'Roadmapping']
        }))
      }
      setLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  const handleProfileUpdate = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      await new Promise(r => setTimeout(r, 800))
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) return
    try {
      setUploading(true)
      await new Promise(r => setTimeout(r, 800))
      setProfileData(prev => ({ ...prev, profileImage: { url: URL.createObjectURL(file) } }))
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteImage = async () => {
    try {
      setUploading(true)
      await new Promise(r => setTimeout(r, 500))
      setProfileData(prev => ({ ...prev, profileImage: null }))
    } finally {
      setUploading(false)
    }
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      
      // Call logout API
      await logoutPM()
      
      // Force disconnect WebSocket
      socketService.forceDisconnect()
      
      // Clear local data
      clearPMData()
      
      // Show success toast
      toast.logout('You have been successfully logged out', {
        title: 'Logged Out',
        duration: 2000
      })
      
      // Small delay to show the toast before redirect
      setTimeout(() => {
        navigate('/pm-login')
      }, 800)
      
    } catch (error) {
      console.error('Logout error:', error)
      
      // Even if API call fails, clear local data
      clearPMData()
      
      // Show error toast
      toast.error('Logout failed, but you have been logged out locally', {
        title: 'Logout Error',
        duration: 2000
      })
      
      // Small delay to show the error toast before redirect
      setTimeout(() => {
        navigate('/pm-login')
      }, 1000)
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 md:bg-gray-50">
        <PM_navbar />
        <main className="pt-16 pb-24 md:pt-20 md:pb-8">
          <div className="px-4 md:max-w-4xl md:mx-auto md:px-6 lg:px-8">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-gray-600">Loading profile...</span>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 md:bg-gray-50">
      <PM_navbar />
      
      <main className="pt-16 pb-24 md:pt-20 md:pb-8">
        <div className="px-4 md:max-w-4xl md:mx-auto md:px-6 lg:px-8">
          <div className="space-y-4">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Profile Information</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isEditing ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-primary text-white hover:bg-primary-dark'
                    }`}
                  >
                    {isEditing ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Edit3 className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Logout"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Header */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {profileData.profileImage && profileData.profileImage.url ? (
                    <div className="w-16 h-16 md:w-18 md:h-18 rounded-full overflow-hidden">
                      <img src={profileData.profileImage.url} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 md:w-18 md:h-18 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center">
                      <span className="text-lg md:text-xl font-bold text-primary">{profileData.avatar}</span>
                    </div>
                  )}
                  {isEditing && (
                    <div className="absolute -bottom-1 -right-1 flex space-x-1">
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="profile-image-upload" disabled={uploading} />
                      <label htmlFor="profile-image-upload" className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors duration-200 shadow-lg cursor-pointer">
                        {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                      </label>
                      {profileData.profileImage && profileData.profileImage.url && (
                        <button onClick={handleDeleteImage} disabled={uploading} className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-200 shadow-lg">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{profileData.fullName}</h3>
                  <p className="text-xs text-gray-500">Project Manager</p>
                  {isEditing && (
                    <div className="flex space-x-2 mt-1">
                      <label htmlFor="profile-image-upload" className="text-xs text-primary font-medium hover:text-primary-dark transition-colors duration-200 cursor-pointer">
                        {uploading ? 'Uploading...' : 'Change Photo'}
                      </label>
                      {profileData.profileImage && profileData.profileImage.url && (
                        <button onClick={handleDeleteImage} disabled={uploading} className="text-xs text-red-500 font-medium hover:text-red-600 transition-colors duration-200">Remove</button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 mt-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                  {isEditing ? (
                    <input type="text" value={profileData.fullName} onChange={(e) => handleProfileUpdate('fullName', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-sm font-medium" placeholder="Enter your full name" />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{profileData.fullName}</span>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  {isEditing ? (
                    <input type="email" value={profileData.email} onChange={(e) => handleProfileUpdate('email', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-sm" placeholder="Enter your email address" />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{profileData.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Save */}
              {isEditing && (
                <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                  <button onClick={handleSaveProfile} disabled={saving} className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-all duration-200 shadow-lg hover:shadow-xl mx-auto disabled:opacity-50 disabled:cursor-not-allowed">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    <span className="text-sm font-medium">{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              )}
            </div>

          {/* Password change section removed for this project */}

          </div>
        </div>
      </main>
    </div>
  )
}

export default PM_Profile
