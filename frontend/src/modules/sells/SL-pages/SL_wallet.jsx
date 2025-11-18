// Professional Wallet Dashboard component with enhanced UI
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiCreditCard,
  FiArrowUp,
  FiArrowDown,
  FiCalendar,
  FiTrendingUp,
  FiActivity,
  FiX
} from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'
import SL_navbar from '../SL-components/SL_navbar'
import { salesWalletService } from '../SL-services'

const SL_wallet = () => {
  // Withdrawal removed as per requirement

  // Live state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wallet, setWallet] = useState({
    currentBalance: 0,
    pendingIncentive: 0,
    monthlyEarning: 0,
    totalEarning: 0,
    monthlySalary: 0,
    transactions: []
  })

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await salesWalletService.getWalletSummary()
        const current = Number(data?.incentive?.current || 0)
        const pending = Number(data?.incentive?.pending || 0)
        const monthly = Number(data?.incentive?.monthly || 0)
        const allTime = Number(data?.incentive?.allTime || 0)
        const fixedSalary = Number(data?.salary?.fixedSalary || 0)

        setWallet({
          currentBalance: current,
          pendingIncentive: pending,
          monthlyEarning: monthly,
          totalEarning: allTime,
          monthlySalary: fixedSalary,
          transactions: (data?.transactions || []).map(t => ({
            id: t.id || `${t.type}-${t.date}`,
            amount: Number(t.amount || 0),
            type: 'income',
            date: new Date(t.date).toLocaleDateString(),
            category: t.type === 'salary' ? 'Salary' : 'Reward',
            description: t.type === 'salary' ? 'Monthly Salary' : (t.clientName ? `Incentive - ${t.clientName}` : 'Incentive')
          }))
        })
        setError(null)
      } catch (e) {
        setError(e?.message || 'Failed to load wallet')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Filter out withdrawals from visible history
  const visibleTransactions = wallet.transactions

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString()}`
  }

  const getTransactionIcon = (category) => {
    switch(category) {
      case 'Salary': return FiCreditCard
      case 'Reward': return FiTrendingUp
      case 'Withdrawal': return FiArrowUp
      default: return FiActivity
    }
  }

  const getTransactionColor = (type) => {
    return type === 'income' ? 'text-green-600' : 'text-red-600'
  }

  const getTransactionBg = (type) => {
    return type === 'income' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <SL_navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-20 lg:pb-4">
        
        {/* Mobile Layout */}
        <div className="lg:hidden space-y-6">
          
          {/* Financial Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative bg-gradient-to-br from-teal-50 via-teal-100 to-teal-200 rounded-xl p-4 text-gray-900 shadow-lg border border-teal-300/40 overflow-hidden"
            style={{
              boxShadow: '0 10px 25px -5px rgba(20, 184, 166, 0.15), 0 0 0 1px rgba(20, 184, 166, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
            }}
          >
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-2 right-4 w-1 h-1 bg-teal-200/30 rounded-full animate-pulse"></div>
              <div className="absolute top-6 right-8 w-0.5 h-0.5 bg-teal-300/25 rounded-full animate-pulse delay-1000"></div>
              <div className="absolute bottom-8 left-4 w-0.5 h-0.5 bg-teal-200/25 rounded-full animate-pulse delay-500"></div>
              
              {/* Subtle grid pattern */}
              <div className="absolute inset-0 opacity-2">
                <div className="w-full h-full" style={{
                  backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(20, 184, 166, 0.05) 1px, transparent 0)',
                  backgroundSize: '15px 15px'
                }}></div>
              </div>
            </div>

            {/* Header Section */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex items-center justify-between mb-3 relative z-10"
            >
              <div className="flex items-center space-x-2">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="relative w-8 h-8 bg-white/60 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-md border border-teal-300/40"
                >
                  <FiCreditCard className="text-teal-700 text-sm" />
                </motion.div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Wallet Overview</h2>
                  <p className="text-teal-700 text-xs">Financial summary</p>
                </div>
              </div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-1 bg-white/70 backdrop-blur-sm rounded-md px-2 py-1 border border-teal-400/50 shadow-sm"
              >
                <FiActivity className="text-teal-700 text-xs" />
                <span className="text-teal-800 font-bold text-xs">Active</span>
              </motion.div>
            </motion.div>

            {/* Current Balance Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-3"
            >
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-teal-300/50 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-teal-800 text-xs font-semibold">Current Balance</span>
                  <FaRupeeSign className="text-teal-600 text-sm" />
                </div>
                <p className="text-gray-900 text-lg font-bold">{formatCurrency(wallet.currentBalance)}</p>
              </div>
            </motion.div>

            {/* Monthly Fixed Salary */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mb-3"
            >
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-teal-300/50 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-teal-800 text-xs font-semibold">Monthly Salary</span>
                  <FaRupeeSign className="text-teal-600 text-sm" />
                </div>
                <p className="text-gray-900 text-lg font-bold">{formatCurrency(wallet.monthlySalary)}</p>
              </div>
            </motion.div>

            {/* Incentive Metrics */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="grid grid-cols-2 gap-3 mb-3"
            >
              {/* Total Incentive */}
              <motion.div 
                whileHover={{ scale: 1.02, y: -1 }}
                className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-emerald-300/50 hover:border-emerald-400/70 transition-all duration-300 shadow-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-emerald-800 text-xs font-semibold">Total Incentive</span>
                  <FiTrendingUp className="text-emerald-600 text-xs" />
                </div>
                <p className="text-gray-900 text-sm font-bold">{formatCurrency(wallet.totalEarning)}</p>
                <p className="text-emerald-600 text-xs">All Time</p>
              </motion.div>
              
              {/* Pending Incentive */}
              <motion.div 
                whileHover={{ scale: 1.02, y: -1 }}
                className="bg-gradient-to-br from-yellow-50 to-amber-50 backdrop-blur-sm rounded-lg p-3 border border-yellow-300/50 hover:border-yellow-400/70 transition-all duration-300 shadow-sm relative group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-yellow-800 text-xs font-semibold">Pending Incentive</span>
                  <FiCalendar className="text-yellow-600 text-xs" />
                </div>
                <p className="text-gray-900 text-sm font-bold">{formatCurrency(wallet.pendingIncentive)}</p>
                <p className="text-yellow-600 text-xs">Awaiting Recovery</p>
                
                {/* Hover Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                  You can withdraw this amount after full payment recovery of client
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                </div>
              </motion.div>
            </motion.div>

            {/* Monthly Summary */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="grid grid-cols-2 gap-2"
            >
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-white/60 backdrop-blur-sm rounded-lg p-2 border border-cyan-300/50 text-center hover:border-cyan-400/70 transition-all duration-300 shadow-sm"
              >
                <p className="text-cyan-800 text-xs font-semibold mb-0.5">This Month</p>
                <p className="text-gray-900 text-xs font-bold">{formatCurrency(wallet.monthlyEarning)}</p>
              </motion.div>
              
              {/* Removed Total Balance (duplicate of Current Balance) */}
              
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-white/60 backdrop-blur-sm rounded-lg p-2 border border-violet-300/50 text-center hover:border-violet-400/70 transition-all duration-300 shadow-sm"
              >
                <p className="text-violet-800 text-xs font-semibold mb-0.5">All Time</p>
                <p className="text-gray-900 text-xs font-bold">{formatCurrency(wallet.totalEarning)}</p>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Transaction Section Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Transaction History</h3>
              <p className="text-sm text-gray-600 mt-1">{visibleTransactions.length} recent transactions</p>
            </div>
              <div className="flex items-center space-x-2" />
          </div>

          {/* Transaction List */}
          <div className="space-y-3">
            {visibleTransactions.map((transaction, index) => {
              const IconComponent = getTransactionIcon(transaction.category)
              
              return (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <IconComponent className={`text-sm ${getTransactionColor(transaction.type)}`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{transaction.description}</h4>
                        <p className="text-xs text-gray-500">{transaction.date}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-12 gap-8">
            
            {/* Main Content - 9 columns */}
            <div className="col-span-9 space-y-6">
              
              {/* Financial Overview Cards */}
              <div className="grid grid-cols-1 gap-6 mb-6">
                 {/* Current Balance - Full Width Card */}
                 <motion.div
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.6, ease: "easeOut", delay: 0 }}
                   className="bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 rounded-2xl p-8 shadow-2xl"
                   style={{
                     boxShadow: '0 25px 50px -12px rgba(20, 184, 166, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                   }}
                 >
                   <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center space-x-4">
                       <div className="bg-white/20 p-4 rounded-xl">
                         <FiCreditCard className="text-white text-2xl" />
                       </div>
                       <div>
                         <h3 className="text-white text-2xl font-bold">Wallet Balance</h3>
                         <p className="text-white/80 text-sm">Current available amount</p>
                       </div>
                     </div>
                     <div className="flex items-center space-x-4">
                       <div className="text-right">
                        <p className="text-white text-4xl font-bold">{formatCurrency(wallet.currentBalance)}</p>
                         <div className="flex items-center mt-1">
                           <FiTrendingUp className="text-white/60 text-sm mr-1" />
                           <span className="text-white/80 text-xs">+12% from last month</span>
                         </div>
                       </div>
                       <button className="bg-white/20 p-3 rounded-lg hover:bg-white/30 transition-colors duration-200">
                         <FiActivity className="text-white text-xl" />
                       </button>
                     </div>
                   </div>
                 </motion.div>
               </div>
               
               {/* Summary Cards Row */}
               <div className="grid grid-cols-2 gap-6 mb-6">
                 {/* Monthly Earnings */}
                 <motion.div
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                   className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100"
                 >
                   <div className="flex items-center justify-between mb-4">
                     <FiCalendar className="text-teal-600 text-xl" />
                     <FiTrendingUp className="text-green-500 text-lg" />
                   </div>
                   <h4 className="text-gray-600 text-sm font-medium mb-2">Monthly Earning</h4>
                  <p className="text-gray-900 text-2xl font-bold">{formatCurrency(wallet.monthlyEarning)}</p>
                   <p className="text-green-600 text-xs font-semibold mt-1">+₹2,500 this week</p>
                 </motion.div>
                 
                 {/* Total Earnings */}
                 <motion.div
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
                   className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100"
                 >
                   <div className="flex items-center justify-between mb-4">
                    <FaRupeeSign className="text-teal-600 text-xl" />
                     <FiActivity className="text-blue-500 text-lg" />
                   </div>
                   <h4 className="text-gray-600 text-sm font-medium mb-2">Total Earning</h4>
                  <p className="text-gray-900 text-2xl font-bold">{formatCurrency(wallet.totalEarning)}</p>
                   <p className="text-blue-600 text-xs font-semibold mt-1">All time earnings</p>
                 </motion.div>
               </div>
              
              {/* Transactions Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
                className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Recent Transactions</h3>
                <p className="text-sm text-gray-600 mt-1">Latest {visibleTransactions.length} transactions</p>
                  </div>
                  <div className="flex items-center space-x-2" />
                </div>
                
                <div className="overflow-hidden">
                  <div className="space-y-3">
                    {visibleTransactions.slice(0, 8).map((transaction, index) => {
                      const IconComponent = getTransactionIcon(transaction.category)
                      
                      return (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.8 + (index * 0.1) }}
                          className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="bg-gray-50 p-2 rounded-lg">
                                <IconComponent className={`text-sm ${getTransactionColor(transaction.type)}`} />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 text-sm">{transaction.description}</h4>
                                <p className="text-xs text-gray-500">{transaction.date}</p>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className={`font-semibold text-sm ${getTransactionColor(transaction.type)}`}>
                                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>

              
            </div>
            
            {/* Sidebar - 3 columns */}
            <div className="col-span-3 space-y-6">
              
              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.8 }}
                className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-6 shadow-xl border border-slate-200/50"
              >
                <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
                
                 <div className="space-y-3">
                  {/* Withdrawal option removed */}
                   
                 </div>
              </motion.div>
              
              {/* Recent Activity Summary */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 1.0 }}
                className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Activity Summary</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">This Month</span>
                    <span className="font-semibold text-green-600">{formatCurrency(wallet.monthlyEarning)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Balance</span>
                    <span className="font-semibold text-teal-600">{formatCurrency(wallet.currentBalance)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">All Time Earnings</span>
                    <span className="font-semibold text-blue-600">{formatCurrency(wallet.totalEarning)}</span>
                  </div>
                </div>
              </motion.div>
              
            </div>
          </div>
        </div>
        
      </main>

      {/* Withdrawal modal removed */}
    </div>
  )
}

export default SL_wallet
