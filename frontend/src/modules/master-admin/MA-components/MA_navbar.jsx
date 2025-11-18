import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

import { Button } from '../../../components/ui/button'
import { AuroraText } from '../../../components/ui/aurora-text'

const MA_navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  
  // Get scroll function from window if available (set by ScrollContext)
  const getScrollFunction = () => {
    if (window.__scrollToSection) {
      return window.__scrollToSection
    }
    return null
  }

  const scrollToElement = (sectionName, retries = 0) => {
    requestAnimationFrame(() => {
      const element = document.getElementById(sectionName)
      if (element) {
        const headerOffset = 80
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset
        
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth'
        })
      } else if (retries < 3) {
        // Retry if element not found (might still be rendering)
        setTimeout(() => scrollToElement(sectionName, retries + 1), 100)
      }
    })
  }

  const scrollToTop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent?.stopImmediatePropagation()
    
    if (location.pathname !== '/') {
      // Navigate to home without reload using React Router
      navigate('/', { replace: false })
      // Scroll to top after navigation
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        if (window.location.hash) {
          window.history.replaceState(null, '', '/')
        }
      }, 100)
    } else {
      // Already on home page - just scroll
      window.scrollTo({ top: 0, behavior: 'smooth' })
      if (window.location.hash) {
        window.history.replaceState(null, '', '/')
      }
    }
  }

  const handleSectionClick = (e, sectionName) => {
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent?.stopImmediatePropagation()
    
    if (location.pathname !== '/') {
      // Navigate to home with hash using React Router (no full reload)
      navigate(`/#${sectionName}`, { replace: false })
      // Scroll after navigation completes
      setTimeout(() => {
        scrollToElement(sectionName)
      }, 200)
    } else {
      // Already on home page - update hash and scroll WITHOUT navigation
      window.history.pushState(null, '', `#${sectionName}`)
      
      // Try refs first if available
      const scrollToSection = getScrollFunction()
      if (scrollToSection) {
        const success = scrollToSection(sectionName)
        if (!success) {
          setTimeout(() => scrollToElement(sectionName), 50)
        }
      } else {
        scrollToElement(sectionName)
      }
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-teal-100/70 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3 text-slate-900">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-md shadow-teal-200/60 ring-1 ring-teal-100">
            <Sparkles className="h-5 w-5 text-teal-500" />
          </div>
          <div className="flex flex-col leading-tight">
            <AuroraText className="text-xl font-semibold">SaaS CRM</AuroraText>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-slate-600 lg:flex">
          <button
            type="button"
            onClick={scrollToTop}
            className="transition hover:text-teal-600 cursor-pointer bg-transparent border-none p-0 font-inherit text-inherit">
            Home
          </button>
          <button
            type="button"
            onClick={(e) => handleSectionClick(e, 'features')}
            className="transition hover:text-teal-600 cursor-pointer bg-transparent border-none p-0 font-inherit text-inherit">
            Features
          </button>
          <button
            type="button"
            onClick={(e) => handleSectionClick(e, 'pricing')}
            className="transition hover:text-teal-600 cursor-pointer bg-transparent border-none p-0 font-inherit text-inherit">
            Pricing
          </button>
          <button
            type="button"
            onClick={(e) => handleSectionClick(e, 'how-it-works')}
            className="transition hover:text-teal-600 cursor-pointer bg-transparent border-none p-0 font-inherit text-inherit">
            How It Works
          </button>
          <Link to="/blogs" className="transition hover:text-teal-600">
            Blogs
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            asChild
            className="border-teal-200 bg-white px-5 py-2 text-sm font-semibold text-teal-600 shadow-sm shadow-teal-100 transition hover:bg-teal-50 hover:text-teal-700">
            <Link to="/admin-login">Sign in</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

export default MA_navbar

