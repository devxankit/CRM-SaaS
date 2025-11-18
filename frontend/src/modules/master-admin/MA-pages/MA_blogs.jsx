import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Calendar,
  Tag,
  FileText,
  Search,
  Filter,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

import { Input } from '../../../components/ui/input'
import MA_navbar from '../MA-components/MA_navbar'
import MA_footer from '../MA-components/MA_footer'

// Mock blog data
const mockBlogs = [
  {
    id: '1',
    title: 'Getting Started with CRM: A Complete Guide for Small Businesses',
    excerpt: 'Learn how to implement a CRM system that transforms your customer relationships and drives business growth. Discover best practices, common pitfalls, and actionable strategies.',
    content: 'Full content here...',
    category: 'Business',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
    createdAt: new Date('2024-01-15').toISOString()
  },
  {
    id: '2',
    title: '5 Ways CRM Automation Saves Time and Increases Productivity',
    excerpt: 'Discover how automated workflows, reminders, and data synchronization can free up hours each week while improving customer satisfaction and team efficiency.',
    content: 'Full content here...',
    category: 'Productivity',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
    createdAt: new Date('2024-01-10').toISOString()
  },
  {
    id: '3',
    title: 'Understanding Sales Pipeline Management: From Lead to Customer',
    excerpt: 'Master the art of sales pipeline management with our comprehensive guide. Learn how to track deals, identify bottlenecks, and optimize your sales process for maximum conversion.',
    content: 'Full content here...',
    category: 'Sales',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
    createdAt: new Date('2024-01-05').toISOString()
  },
  {
    id: '4',
    title: 'Project Management Best Practices: Delivering on Time and Budget',
    excerpt: 'Explore proven strategies for managing projects effectively. From milestone tracking to resource allocation, learn how to keep projects on track and teams aligned.',
    content: 'Full content here...',
    category: 'Project Management',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
    createdAt: new Date('2023-12-28').toISOString()
  },
  {
    id: '5',
    title: 'Financial Management Made Simple: Tools and Techniques',
    excerpt: 'Streamline your financial operations with automated payroll, expense tracking, and comprehensive reporting. Discover how modern tools can transform your finance department.',
    content: 'Full content here...',
    category: 'Finance',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
    createdAt: new Date('2023-12-20').toISOString()
  },
  {
    id: '6',
    title: 'Building Strong Client Relationships Through Better Communication',
    excerpt: 'Learn how a client portal can enhance transparency, improve communication, and build trust. See how real-time updates and seamless collaboration strengthen client relationships.',
    content: 'Full content here...',
    category: 'Customer Success',
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
    createdAt: new Date('2023-12-15').toISOString()
  }
]

const MA_blogs = () => {
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date') // 'date', 'title', 'category'
  const [sortOrder, setSortOrder] = useState('desc') // 'asc', 'desc'

  // Scroll to top when component mounts or route changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Use 'instant' for immediate scroll without animation
    })
  }, [location.pathname])

  const filteredBlogs = mockBlogs.filter(blog => {
    const matchesSearch = blog.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         blog.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         blog.category?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  // Sort blogs
  const sortedBlogs = [...filteredBlogs].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'date':
        const dateA = new Date(a.createdAt || 0)
        const dateB = new Date(b.createdAt || 0)
        comparison = dateA - dateB
        break
      case 'title':
        comparison = (a.title || '').localeCompare(b.title || '')
        break
      case 'category':
        comparison = (a.category || '').localeCompare(b.category || '')
        break
      default:
        comparison = 0
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <MA_navbar />
      
      <main className="mx-auto w-full max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Blog</h1>
            <p className="text-lg text-slate-600">
              Latest insights, tips, and updates to help you grow your business
            </p>
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search blogs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Sort Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Sort by:</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="date">Date</option>
                <option value="title">Title</option>
                <option value="category">Category</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-slate-300 bg-white text-sm hover:bg-slate-50 transition-colors">
                {sortOrder === 'asc' ? (
                  <>
                    <ArrowUp className="h-4 w-4 text-slate-600" />
                    <span className="text-slate-700">Ascending</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-4 w-4 text-slate-600" />
                    <span className="text-slate-700">Descending</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Blog Grid */}
        {sortedBlogs.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No blogs found</h3>
            <p className="text-slate-600">
              Try adjusting your search terms or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedBlogs.map((blog, index) => (
              <motion.div
                key={blog.id}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={index * 0.1}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                }}
                className="group relative bg-white rounded-xl border border-teal-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-teal-100 to-cyan-100">
                  <img
                    src={blog.imageUrl}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
                
                {/* Content */}
                <div className="p-6">
                  {blog.category && (
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="h-4 w-4 text-teal-500" />
                      <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">
                        {blog.category}
                      </span>
                    </div>
                  )}
                  
                  <h3 className="text-xl font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-teal-600 transition-colors">
                    {blog.title}
                  </h3>
                  
                  {blog.excerpt && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                      {blog.excerpt}
                    </p>
                  )}
                  
                  <div className="flex items-center text-xs text-slate-500 mb-4">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{formatDate(blog.createdAt)}</span>
                  </div>
                  
                  {/* Read More Link */}
                  <Link
                    to={`/blogs/${blog.id}`}
                    className="inline-flex items-center text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors group/link">
                    Read More
                    <span className="ml-1 group-hover/link:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <MA_footer />
    </div>
  )
}

export default MA_blogs
