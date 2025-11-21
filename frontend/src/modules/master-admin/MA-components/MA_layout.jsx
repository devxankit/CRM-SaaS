import React from 'react'
import { Outlet } from 'react-router-dom'
import MA_dashboard_navbar from './MA_dashboard_navbar'
import MA_dashboard_sidebar from './MA_dashboard_sidebar'

const MA_layout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-white font-sans">
      <MA_dashboard_navbar />
      <MA_dashboard_sidebar />

      {/* Main Content */}
      <main className="ml-64 pt-16 min-h-screen transition-all duration-300">
        <Outlet />
      </main>
    </div>
  )
}

export default MA_layout

