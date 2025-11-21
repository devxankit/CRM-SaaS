import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  MoreVertical,
  Building2,
  Users,
  CreditCard,
  Calendar,
  Mail,
  Phone,
  Globe,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { masterAdminCompanyService } from '../MA-services'
import { useToast } from '../../../contexts/ToastContext'
import { RefreshCw } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', delay }
  })
}

const MA_companies = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [companies, setCompanies] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalUsers: 0,
    totalRevenue: 0
  })

  // Load companies data
  const loadCompanies = async () => {
    setLoading(true)
    try {
      const [companiesRes, statsRes] = await Promise.all([
        masterAdminCompanyService.getAllCompanies({ search: searchQuery }),
        masterAdminCompanyService.getCompanyStatistics()
      ])

      if (companiesRes.success && companiesRes.data.companies) {
        const formattedCompanies = companiesRes.data.companies.map(company => ({
          id: company._id,
          name: company.name,
          email: company.email,
          phone: company.phone,
          users: company.totalUsers || 0,
          plan: company.plan || 'Starter',
          status: company.status || 'trial',
          revenue: company.totalRevenue || 0,
          growth: 0, // Calculate if needed
          joinedDate: new Date(company.joinedDate).toLocaleDateString()
        }))
        setCompanies(formattedCompanies)
      }

      if (statsRes.success && statsRes.data) {
        setStats({
          total: statsRes.data.total || 0,
          active: statsRes.data.active || 0,
          totalUsers: statsRes.data.totalUsers || 0,
          totalRevenue: statsRes.data.totalRevenue || 0
        })
      }
    } catch (error) {
      console.error('Error loading companies:', error)
      toast.error('Failed to load companies', {
        title: 'Error',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        loadCompanies()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'trial':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'suspended':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                  Companies <span className="text-teal-600">Management</span>
                </h1>
                <p className="mt-2 text-base text-slate-600">
                  Manage all companies and their subscriptions
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={loadCompanies}
                  disabled={loading}
                  className="border-teal-200 bg-white text-teal-600 hover:bg-teal-50">
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  onClick={() => navigate('/master-admin-companies/new')}
                  className="bg-teal-500 text-white hover:bg-teal-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Company
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Total Companies', value: stats.total, icon: Building2, color: 'from-blue-500 to-blue-600' },
              { title: 'Active Companies', value: stats.active, icon: CheckCircle2, color: 'from-green-500 to-green-600' },
              { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-purple-500 to-purple-600' },
              { title: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: CreditCard, color: 'from-teal-500 to-teal-600' }
            ].map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.title}
                  initial="hidden"
                  animate="show"
                  custom={index * 0.1}
                  variants={fadeUp}>
                  <Card className="border-teal-100 bg-white shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                          <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
                        </div>
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* Search */}
          <motion.div
            initial="hidden"
            animate="show"
            custom={0.4}
            variants={fadeUp}
            className="mb-6">
            <Card className="border-teal-100 bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search by company name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Companies Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-6 w-6 animate-spin text-teal-600" />
                <span className="text-lg font-medium text-slate-700">Loading companies...</span>
              </div>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <Card className="border-teal-100 bg-white shadow-sm">
              <CardContent className="p-12 text-center">
                <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-slate-700">No companies found</p>
                <p className="text-sm text-slate-500 mt-2">Try adjusting your search or add a new company</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCompanies.map((company, index) => (
              <motion.div
                key={company.id}
                initial="hidden"
                animate="show"
                custom={0.5 + index * 0.1}
                variants={fadeUp}>
                <Card className="border-teal-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-teal-100/50">
                  <CardHeader className="border-b border-teal-100 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white text-lg font-bold shadow-md">
                          {company.name.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-slate-900">{company.name}</CardTitle>
                          <span className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusColor(company.status)}`}>
                            {company.status}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="h-4 w-4" />
                        <span>{company.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="h-4 w-4" />
                        <span>{company.phone}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-teal-50">
                        <div>
                          <p className="text-xs text-slate-500">Users</p>
                          <p className="text-lg font-semibold text-slate-900">{company.users}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Plan</p>
                          <p className="text-lg font-semibold text-slate-900">{company.plan}</p>
                        </div>
                      </div>
                      {company.revenue > 0 && (
                        <div className="pt-3 border-t border-teal-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-slate-500">Revenue</p>
                              <p className="text-lg font-semibold text-slate-900">{formatCurrency(company.revenue)}</p>
                            </div>
                            <div className={`flex items-center gap-1 text-sm ${company.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {company.growth > 0 ? (
                                <ArrowUpRight className="h-4 w-4" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4" />
                              )}
                              <span>{Math.abs(company.growth)}%</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-3">
                        <Button variant="outline" size="sm" className="flex-1 border-teal-200">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 border-teal-200">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              ))}
            </div>
          )}
        </div>
  )
}

export default MA_companies

