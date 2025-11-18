import React, { createContext, useContext, useRef, useCallback, useEffect } from 'react'

const ScrollContext = createContext(null)

export const ScrollProvider = ({ children }) => {
  const featuresRef = useRef(null)
  const pricingRef = useRef(null)
  const howItWorksRef = useRef(null)

  const scrollToSection = useCallback((sectionName) => {
    let targetRef = null
    
    switch (sectionName) {
      case 'features':
        targetRef = featuresRef
        break
      case 'pricing':
        targetRef = pricingRef
        break
      case 'how-it-works':
        targetRef = howItWorksRef
        break
      default:
        return false
    }

    if (targetRef?.current) {
      const headerOffset = 80 // Account for sticky navbar
      const elementPosition = targetRef.current.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      })

      // Update URL hash without causing navigation
      if (window.location.hash !== `#${sectionName}`) {
        window.history.pushState(null, '', `#${sectionName}`)
      }
      return true
    }
    return false
  }, [])

  // Expose scroll function globally so navbar can access it
  useEffect(() => {
    window.__scrollToSection = scrollToSection
    return () => {
      delete window.__scrollToSection
    }
  }, [scrollToSection])

  return (
    <ScrollContext.Provider value={{ featuresRef, pricingRef, howItWorksRef, scrollToSection }}>
      {children}
    </ScrollContext.Provider>
  )
}

export const useScroll = () => {
  const context = useContext(ScrollContext)
  if (!context) {
    throw new Error('useScroll must be used within ScrollProvider')
  }
  return context
}

