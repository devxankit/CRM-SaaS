import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FiBell, 
  FiCheck, 
  FiX, 
  FiClock, 
  FiDollarSign, 
  FiUser,
  FiAlertCircle,
  FiInfo,
  FiAward,
  FiCheckSquare,
  FiTrendingUp
} from 'react-icons/fi'
import PM_navbar from '../../DEV-components/PM_navbar'

const PM_notifications = () => {
  // Mock notification data for PM
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'project',
      title: 'Project Milestone Completed',
      message: 'Website Redesign project milestone "UI/UX Design" has been completed by John Doe',
      time: '30 minutes ago',
      isRead: false,
      icon: FiCheckSquare,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100'
    },
    {
      id: 2,
      type: 'team',
      title: 'Team Performance Update',
      message: 'Your team achieved 95% completion rate this week. Great job!',
      time: '2 hours ago',
      isRead: false,
      icon: FiTrendingUp,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100'
    },
    {
      id: 3,
      type: 'urgent',
      title: 'Urgent Task Alert',
      message: 'Critical security vulnerability task needs immediate attention',
      time: '4 hours ago',
      isRead: false,
      icon: FiAlertCircle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100'
    },
    {
      id: 4,
      type: 'reward',
      title: 'Performance Reward',
      message: 'You earned ₹8,000 reward for excellent project management this month',
      time: '1 day ago',
      isRead: true,
      icon: FiAward,
      iconColor: 'text-yellow-600',
      iconBg: 'bg-yellow-100'
    },
    {
      id: 5,
      type: 'salary',
      title: 'Salary Credited',
      message: 'Your monthly salary of ₹35,000 has been credited to your account',
      time: '2 days ago',
      isRead: true,
      icon: FiDollarSign,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100'
    },
    {
      id: 6,
      type: 'team',
      title: 'New Team Member',
      message: 'Sarah Wilson has been added to your team for the Mobile App project',
      time: '3 days ago',
      isRead: true,
      icon: FiUser,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100'
    }
  ])

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    )
  }

  const deleteNotification = (id) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    )
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <PM_navbar />
      
      <main className="max-w-md mx-auto min-h-screen pt-16 pb-20">

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-4 mt-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-600 mt-1">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-3 py-1.5 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
        </motion.div>

        {/* Notifications List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-4 space-y-3"
        >
          {notifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-8 text-center shadow-xl border border-teal-100"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiBell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No notifications</h3>
              <p className="text-gray-600">You're all caught up!</p>
            </motion.div>
          ) : (
            notifications.map((notification, index) => {
              const IconComponent = notification.icon
              
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + (index * 0.1) }}
                  className={`bg-white rounded-xl p-4 shadow-lg border transition-all ${
                    notification.isRead 
                      ? 'border-gray-100' 
                      : 'border-teal-200 bg-teal-50/30'
                  }`}
                  style={{
                    boxShadow: notification.isRead 
                      ? '0 4px 12px -3px rgba(20, 184, 166, 0.1), 0 2px 6px -2px rgba(0, 0, 0, 0.05)'
                      : '0 4px 12px -3px rgba(20, 184, 166, 0.2), 0 2px 6px -2px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg ${notification.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className={`w-5 h-5 ${notification.iconColor}`} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className={`font-semibold text-sm ${
                            notification.isRead ? 'text-gray-700' : 'text-gray-800'
                          }`}>
                            {notification.title}
                          </h3>
                          <p className={`text-sm mt-1 ${
                            notification.isRead ? 'text-gray-600' : 'text-gray-700'
                          }`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <FiClock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{notification.time}</span>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1.5 text-teal-600 hover:bg-teal-100 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete notification"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
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

export default PM_notifications
