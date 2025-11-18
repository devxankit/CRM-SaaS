import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollProvider, useScroll } from '../MA-contexts/ScrollContext'
import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Cloud,
  DollarSign,
  Gauge,
  HelpCircle,
  Layers,
  LineChart,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
  Monitor,
  Download,
  Play,
  CreditCard,
  Wallet,
  Smartphone,
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react'

import { Button } from '../../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../../../components/ui/dialog'
import MA_navbar from '../MA-components/MA_navbar'
import MA_footer from '../MA-components/MA_footer'
import groupImage from '../../../assets/images/group_image.png'
import { AuroraText } from '../../../components/ui/aurora-text'
import { Highlighter } from '../../../components/ui/highlighter'
import { Marquee } from '../../../components/ui/marquee'

import banner1 from '../../../assets/images/banner1.png'
import banner3 from '../../../assets/images/banner3.png'




const modules = [
  {
    badge: 'Sales CRM',
    title: 'Sales Acceleration Suite',
    description:
      'Streamline your sales process with lead capture, automated follow-ups, quotation workflows, recovery dashboards, and pipeline analytics to keep teams productive.',
    icon: Target,
    link: '/sales-login',
    audience: 'Sales Leaders & SDR Managers',
    highlights: [
      'Hot lead routing & playbooks',
      'Automated reminders & cadences',
      'Collections cockpit for ageing invoices',
      'Pipeline analytics & forecasting',
      'Customer engagement tracking'
    ],
    color: 'from-teal-100 to-white'
  },
  {
    badge: 'PM Cloud',
    title: 'Project Delivery Control Tower',
    description:
      'Manage projects efficiently with milestone tracking, QA workflows, urgent task escalation, testing readiness, and resource planning from single delivery dashboard.',
    icon: Workflow,
    link: '/pm-login',
    audience: 'Program & Project Managers',
    highlights: [
      'Milestone & sprint intelligence',
      'Escalation routing across squads',
      'Testing readiness heatmaps',
      'Resource allocation & planning',
      'Real-time progress monitoring'
    ],
    color: 'from-cyan-100 to-white'
  },
  {
    badge: 'People Ops',
    title: 'Employee Performance Hub',
    description:
      'Empower your team with capacity planning, sprint commitments, rewards management, attendance tracking, performance reviews, and streamlined workflow automation for teams.',
    icon: Users,
    link: '/employee-login',
    audience: 'Delivery Heads & HR Ops',
    highlights: [
      'Live allocation & utilisation',
      'Velocity dashboards & pulse checks',
      'Reward, allowance & leave workflows',
      'Performance reviews & feedback',
      'Team collaboration & engagement'
    ],
    color: 'from-emerald-100 to-white'
  },
  {
    badge: 'Admin HQ',
    title: 'Finance & Compliance Suite',
    description:
      'Take complete control of your finances with comprehensive revenue analytics, expense governance, automated payroll, financial reporting, and audit-ready workflow systems.',
    icon: LineChart,
    link: '/admin-login',
    audience: 'CXOs & Finance Controllers',
    highlights: [
      'Revenue & margin analytics',
      'Recurring payout automation',
      'Policy-driven approval guardrails',
      'Financial reporting & insights',
      'Compliance & audit management'
    ],
    color: 'from-slate-100 to-white'
  },
  {
    badge: 'Client Portal',
    title: 'Customer Experience Command Center',
    description:
      'Deliver exceptional client experiences with progress tracking, invoice management, seamless communication, project updates, demo requests, and wallet integration for clients.',
    icon: Cloud,
    link: '/client-login',
    audience: 'Customer Success & Account Owners',
    highlights: [
      'Live delivery timelines',
      'Invoice & wallet centre',
      'Collaboration & approvals workspace',
      'Project status & updates',
      'Support ticket management'
    ],
    color: 'from-sky-100 to-white'
  }
]

const proofPoints = [
  {
    label: 'Sales pipeline coverage',
    value: '92%',
    icon: Gauge,
    description: 'Hot lead routing, automated follow-ups, and recovery processes powered by our Sales CRM suite.'
  },
  {
    label: 'Projects delivered per quarter',
    value: '130+',
    icon: Rocket,
    description: 'PM Cloud automates milestone QA, urgent task management, and team coordination across projects.'
  },
  {
    label: 'Finance automation savings',
    value: '₹18L',
    icon: CalendarClock,
    description: 'Automated payroll, collections, and incentive schedulers reduce manual operations significantly.'
  }
]

const workflowSteps = [
  {
    title: 'Sign up & customize your workspace',
    description:
      'Choose a plan that fits your needs, customize your workspace with your brand, and configure settings to match your workflow.',
    icon: Rocket
  },
  {
    title: 'Invite your team & set permissions',
    description:
      'Add team members, assign roles across sales, project management, HR, finance, and client portals—all from one admin console.',
    icon: Layers
  },
  {
    title: 'Start using automated workflows',
    description:
      'Automated reminders, approvals, schedulers, and notifications keep your operations running smoothly while you focus on growth.',
    icon: ShieldCheck
  }
]

const governanceStack = [
  {
    title: 'Billing & subscription management',
    details:
      'Manage your subscription, track invoices, handle payments, and monitor usage across all modules from one central dashboard.',
    icon: DollarSign
  },
  {
    title: 'Analytics & performance insights',
    details:
      'Track module usage, team performance, and business metrics with comprehensive analytics and real-time dashboards.',
    icon: BarChart3
  },
  {
    title: 'Automated workflows & compliance',
    details:
      'Set up automated notifications, approval workflows, and compliance checks to keep your operations running smoothly and securely.',
    icon: Workflow
  }
]

const bundles = [
  {
    name: 'Starter',
    statement: 'Perfect for small teams getting started with CRM.',
    includes: [
      'Sales CRM module',
      'Project Management module',
      'Client Portal access',
      'Basic analytics & reporting',
      'Email support',
      'Up to 5 team members'
    ],
    price: '₹1,999',
    period: '/month',
    extras: 'Best for startups',
    action: '/admin-login',
    popular: false
  },
  {
    name: 'Professional',
    statement: 'For growing teams managing operations and finance.',
    includes: [
      'All Starter features',
      'Employee Performance Hub',
      'Finance & Compliance Suite',
      'Advanced analytics & insights',
      'Priority email support',
      'Up to 20 team members',
      'Custom workflows'
    ],
    price: '₹2,999',
    period: '/month',
    extras: 'Most popular',
    action: '/admin-login',
    popular: true
  },
  {
    name: 'Premium',
    statement: 'For established businesses needing advanced features.',
    includes: [
      'All Professional features',
      'Unlimited team members',
      'Dedicated account manager',
      'Custom integrations',
      '24/7 priority support',
      'Advanced security features',
      'Migration support',
      'Custom automation setup'
    ],
    price: '₹4,999',
    period: '/month',
    extras: 'Best for enterprises',
    action: '/admin-login',
    popular: false
  }
]

const testimonials = [
  {
    quote:
      'The Sales CRM module transformed how we manage leads and follow-ups. Our team can now track the entire sales pipeline in one place, and automated reminders ensure nothing falls through the cracks.',
    name: 'Aparna R.',
    role: 'Sales Director, Tech Solutions Inc.'
  },
  {
    quote:
      'Finance automation has been a game-changer. Payroll, expense approvals, and collections are now automated, saving us hours every week. The analytics dashboard gives us real-time insights into our financial health.',
    name: 'Kevin D.',
    role: 'CFO, Growth Ventures'
  },
  {
    quote:
      'Project Management module helped us deliver projects on time consistently. The milestone tracking and urgent task escalation features keep our team aligned and productive.',
    name: 'Rajesh K.',
    role: 'Project Manager, Digital Innovations'
  },
  {
    quote:
      'Employee Performance Hub streamlined our HR operations. Capacity planning and attendance tracking are now seamless, and the velocity dashboards give us clear insights.',
    name: 'Priya S.',
    role: 'HR Head, Startup Hub'
  },
  {
    quote:
      'Client Portal improved our customer relationships significantly. Clients can track progress, view invoices, and communicate seamlessly—all in one place.',
    name: 'Vikram M.',
    role: 'Customer Success Lead, CloudTech'
  }
]

const faqs = [
  {
    question: 'Can I customize the modules to fit my business needs?',
    answer:
      'Yes. Each module comes with flexible configuration options. You can customize workflows, fields, and automation rules to match your specific business processes.'
  },
  {
    question: 'How do I add team members to the platform?',
    answer:
      'Simply invite team members via email from your admin dashboard. They will receive login credentials and can access the modules you assign based on their role.'
  },
  {
    question: 'What kind of support do you provide?',
    answer:
      'We offer onboarding support, documentation, and email support for all plans. Enterprise plans include dedicated account management and priority support.'
  }
]

const heroHighlights = [
  {
    icon: Rocket,
    title: 'Get started in minutes',
    description: 'Quick setup process with guided onboarding. Start using the modules you need right away.'
  },
  {
    icon: BarChart3,
    title: 'Unified business intelligence',
    description: 'All your data in one place. Cross-module analytics and insights without complex integrations.'
  },
  {
    icon: ShieldCheck,
    title: 'Secure & compliant',
    description: 'Role-based access control, audit logs, and automated compliance checks keep your data secure.'
  }
]

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut', delay }
  })
}

// CRM showcase images
const crmShowcaseImages = [
  {
    id: 1,
    title: 'Sales Dashboard',
    url: banner1,
    thumbnail: banner1
  },
  {
    id: 2,
    title: 'Project Management',
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop'
  },
  {
    id: 3,
    title: 'Analytics & Reports',
    url: banner3,
    thumbnail: banner3
  },
  {
    id: 4,
    title: 'Client Portal',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=800&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=200&fit=crop'
  },
  {
    id: 5,
    title: 'Team Collaboration',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=800&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&h=200&fit=crop'
  },
  {
    id: 6,
    title: 'Finance Dashboard',
    url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=800&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=200&fit=crop'
  }
]

const MA_home_content = () => {
  const { featuresRef, pricingRef, howItWorksRef } = useScroll()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isHighlightReady, setIsHighlightReady] = useState(false)
  const [isPowerfulHighlightReady, setIsPowerfulHighlightReady] = useState(false)
  const [isSimpleHighlightReady, setIsSimpleHighlightReady] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)
  const [selectedBundle, setSelectedBundle] = useState(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const highlightRef = useRef(null)
  const powerfulHighlightRef = useRef(null)
  const simpleHighlightRef = useRef(null)

  // Ensure highlighter is ready after element is rendered and motion animation completes
  useEffect(() => {
    // Wait for motion animation (600ms) + extra buffer for DOM measurement
    const timer = setTimeout(() => {
      setIsHighlightReady(true)
    }, 800)
    
    return () => clearTimeout(timer)
  }, [])

  // Ensure powerful highlighter is ready after element is rendered and motion animation completes
  useEffect(() => {
    // Wait for motion animation + extra buffer for DOM measurement
    const timer = setTimeout(() => {
      setIsPowerfulHighlightReady(true)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  // Ensure simple highlighter is ready after element is rendered and motion animation completes
  useEffect(() => {
    // Wait for motion animation + extra buffer for DOM measurement
    const timer = setTimeout(() => {
      setIsSimpleHighlightReady(true)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  // Handle hash navigation on page load and hash changes
  useEffect(() => {
    const scrollToHash = (retries = 0) => {
      const hash = window.location.hash
      if (hash) {
        const targetId = hash.substring(1) // Remove the # symbol
        
        // Use requestAnimationFrame for better timing
        requestAnimationFrame(() => {
          setTimeout(() => {
            const element = document.getElementById(targetId)
            if (element) {
              const headerOffset = 80 // Account for sticky navbar
              const elementPosition = element.getBoundingClientRect().top
              const offsetPosition = elementPosition + window.pageYOffset - headerOffset

              window.scrollTo({
                top: Math.max(0, offsetPosition), // Ensure non-negative
                behavior: 'smooth'
              })
            } else if (retries < 10) {
              // Retry if element not found (might still be rendering)
              setTimeout(() => scrollToHash(retries + 1), 100)
            }
          }, 200) // Delay to ensure DOM is fully rendered
        })
      }
    }

    // Handle initial hash on mount
    scrollToHash()

    // Handle hash changes (browser back/forward, programmatic changes)
    const handleHashChange = () => {
      scrollToHash()
    }

    // Handle popstate (browser back/forward)
    const handlePopState = () => {
      setTimeout(() => scrollToHash(), 100)
    }

    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('popstate', handlePopState)

    // Also check for hash after a short delay (for navigation from other pages)
    const timeoutId = setTimeout(() => {
      if (window.location.hash) {
        scrollToHash()
      }
    }, 500)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('popstate', handlePopState)
      clearTimeout(timeoutId)
    }
  }, [])

  // Auto-play carousel
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % modules.length)
    }, 3000) // Change slide every 3 seconds

    return () => clearInterval(interval)
  }, [isPaused])

  const goToSlide = (index) => {
    setCurrentIndex(index)
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % modules.length)
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + modules.length) % modules.length)
  }

  // Scroll to pricing section
  const scrollToPricing = () => {
    const element = pricingRef?.current || document.getElementById('pricing')
    if (element) {
      const headerOffset = 80 // Account for sticky navbar
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      })
    }
  }

  // Scroll to how-it-works section
  const scrollToHowItWorks = () => {
    const element = howItWorksRef?.current || document.getElementById('how-it-works')
    if (element) {
      const headerOffset = 80 // Account for sticky navbar
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      })
    }
  }

  // Handle registration form - opens first when Get Started is clicked
  const handleOpenRegistration = (bundle) => {
    setSelectedBundle(bundle)
    setIsRegistrationOpen(true)
    // Reset form
    setUserInfo({
      name: '',
      email: '',
      phone: '',
      password: ''
    })
    setFormErrors({})
    setShowPassword(false)
  }

  const handleCloseRegistration = () => {
    setIsRegistrationOpen(false)
    setSelectedBundle(null)
    setUserInfo({
      name: '',
      email: '',
      phone: '',
      password: ''
    })
    setFormErrors({})
  }

  // Validate registration form
  const validateRegistrationForm = () => {
    const errors = {}
    
    if (!userInfo.name.trim()) {
      errors.name = 'Name is required'
    } else if (userInfo.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
    }

    if (!userInfo.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInfo.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!userInfo.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!/^[0-9]{10}$/.test(userInfo.phone.replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit phone number'
    }

    if (!userInfo.password) {
      errors.password = 'Password is required'
    } else if (userInfo.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle registration form submission
  const handleRegistrationSubmit = () => {
    if (validateRegistrationForm()) {
      // Close registration form and open checkout
      setIsRegistrationOpen(false)
      setIsCheckoutOpen(true)
      setSelectedPaymentMethod(null)
      // Here you could also save userInfo to backend or context
      console.log('User registration info:', userInfo)
    }
  }

  // Handle checkout dialog
  const handleCloseCheckout = () => {
    setIsCheckoutOpen(false)
    setSelectedBundle(null)
    setSelectedPaymentMethod(null)
  }

  const handleProceedToPayment = () => {
    if (!selectedPaymentMethod) {
      alert('Please select a payment method')
      return
    }
    // Here you would typically integrate with a payment gateway
    // and send user registration info along with payment details
    console.log('Proceeding to payment:', {
      userInfo: {
        name: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone
        // Note: Don't log password in production
      },
      bundle: selectedBundle,
      paymentMethod: selectedPaymentMethod
    })
    // TODO: Integrate with payment gateway (Razorpay, Stripe, etc.)
    // After successful payment, create account with userInfo
    // For now, redirect to admin login after payment selection
    window.location.href = selectedBundle.action
  }

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-teal-50 via-white to-white text-slate-900 font-sans">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 h-[30rem] w-[70vw] -translate-x-1/2 rounded-full bg-gradient-to-r from-teal-200/60 via-cyan-100/60 to-emerald-100/40 blur-3xl" />
        <div className="absolute bottom-[-30%] right-[-10%] h-80 w-[40vw] rounded-full bg-gradient-to-br from-emerald-200/50 to-sky-100/50 blur-[120px]" />
      </div>

      <MA_navbar />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-24 px-6 pb-24 pt-12 lg:pt-16">
        <section className="relative flex flex-col items-center gap-12 text-center">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-500/15 via-cyan-500/15 to-emerald-500/15 px-6 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-teal-700">
              <Sparkles className="h-4 w-4 text-teal-500" />
              Your Complete CRM Platform
            </span>
          </motion.div>

          <motion.div initial="hidden" animate="show" custom={0.1} variants={fadeUp}>
            <h1 className="max-w-4xl text-5xl font-semibold leading-tight text-slate-900 sm:text-6xl">
              <span className="inline-block">
                <AuroraText 
                  colors={["#0d9488", "#0891b2", "#059669", "#0284c7"]}
                  speed={1.5}
                  className="font-semibold">
                  Five powerful CRM
                </AuroraText>
              </span>{' '}
              modules to run your entire{' '}
              <span ref={highlightRef} className="relative inline-block">
                {isHighlightReady ? (
                  <Highlighter 
                    color="#14b8a6"
                    strokeWidth={3}
                    animationDuration={1200}
                    iterations={1}
                    isView={false}>
                    <span className="relative z-10">business.</span>
                  </Highlighter>
                ) : (
                  <span className="text-slate-900">business.</span>
                )}
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial="hidden"
            animate="show"
            custom={0.2}
            variants={fadeUp}
            className="max-w-3xl text-lg text-slate-600">
            Access our Sales, Project Management, HR, Finance, and Client Portal modules—all integrated
            in one platform. Manage your entire business operations without switching between multiple tools.
            Get started today and transform how you work.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="show"
            custom={0.3}
            variants={fadeUp}
            className="flex flex-wrap items-center justify-center gap-4">
            <Button
              onClick={scrollToPricing}
              size="lg"
              className="bg-teal-500 px-6 text-white shadow-lg shadow-teal-200/80 transition hover:bg-teal-600">
              Get Started
            </Button>
            <Button
              onClick={scrollToHowItWorks}
              size="lg"
              variant="ghost"
              className="border border-teal-200 bg-white px-6 text-teal-600 transition hover:bg-teal-50">
              See how it works
            </Button>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            custom={0.35}
            variants={fadeUp}
            className="grid w-full max-w-5xl gap-4 sm:grid-cols-3">
            {heroHighlights.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-teal-100 bg-white/80 p-5 text-left shadow-sm shadow-teal-100/60">
                  <Icon className="mb-3 h-6 w-6 text-teal-500" />
                  <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                  <p className="mt-2 text-xs text-slate-500">{item.description}</p>
                </div>
              )
            })}
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            custom={0.45}
            variants={fadeUp}
            className="grid w-full max-w-5xl gap-4 sm:grid-cols-3">
            {proofPoints.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-teal-100 bg-gradient-to-br from-white via-white to-teal-50/60 p-5 shadow-md shadow-teal-100/60">
                  <Icon className="h-6 w-6 text-teal-500" />
                  <p className="mt-4 text-2xl font-semibold text-slate-900">{item.value}</p>
                  <p className="text-sm font-medium text-slate-700">{item.label}</p>
                  <p className="mt-2 text-xs text-slate-500">{item.description}</p>
                </div>
              )
            })}
          </motion.div>
        </section>

        <section id="features" ref={featuresRef} className="space-y-12">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
              Five{' '}
              <span ref={powerfulHighlightRef} className="relative inline-block">
                {isPowerfulHighlightReady ? (
                  <Highlighter 
                    color="#14b8a6"
                    strokeWidth={3}
                    animationDuration={1000}
                    iterations={1}
                    isView={false}>
                    <span className="relative z-10">powerful</span>
                  </Highlighter>
                ) : (
                  <span className="text-slate-900">powerful</span>
                )}
              </span>{' '}
              modules for your business.
            </h2>
            <p className="mt-3 max-w-3xl text-base text-slate-600">
              Manage sales, projects, HR, finance, and client relationships from one unified platform. All modules work together seamlessly.
            </p>
          </motion.div>

          {/* Carousel and Image Banner Container */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Side - Carousel */}
            <div
              className="relative w-full"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}>
              {/* Carousel Wrapper */}
              <div className="relative overflow-hidden rounded-xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}>
                    {(() => {
                      const module = modules[currentIndex]
                      const Icon = module.icon
                      return (
                        <div className="group block h-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-teal-300 hover:shadow-lg hover:shadow-teal-100/50">
                          {/* Header Section */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-50 to-teal-100/50 transition-all duration-300 group-hover:scale-105 group-hover:from-teal-100 group-hover:to-teal-200/50">
                                <Icon className="h-5 w-5 text-teal-600 transition-colors duration-300 group-hover:text-teal-700" />
                              </div>
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 transition-colors duration-300 group-hover:bg-teal-100">
                                <Sparkles className="h-3 w-3 text-teal-600" />
                                {module.badge}
                              </span>
                            </div>
                          </div>

                          {/* Content Section */}
                          <div className="space-y-3">
                            <h3 className="text-xl font-semibold text-slate-900 transition-colors duration-300 group-hover:text-teal-700">
                              {module.title}
                            </h3>
                            <p className="text-sm leading-relaxed text-slate-600">
                              {module.description}
                            </p>

                            {/* Audience Badge */}
                            <div>
                              <span className="inline-block rounded-md bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors duration-300 group-hover:bg-slate-100">
                                For {module.audience}
                              </span>
                            </div>

                            {/* Features List */}
                            <div>
                              <ul className="space-y-1.5">
                                {module.highlights.map((point, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-teal-500" />
                                    <span className="text-xs text-slate-600">{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation Dots */}
              <div className="mt-6 flex items-center justify-center gap-2">
                {modules.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? 'w-8 bg-teal-500'
                        : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Right Side - Banner Image */}
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              className="hidden lg:block relative h-full">
              <div className="sticky top-24">
                <img
                  src={groupImage}
                  alt="Team collaboration"
                  className="w-full h-auto rounded-xl object-cover shadow-lg"
                />
              </div>
            </motion.div>
          </div>
        </section>

        <section id="how-it-works" ref={howItWorksRef} className="space-y-12">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
              Getting started is{' '}
              <span ref={simpleHighlightRef} className="relative inline-block">
                {isSimpleHighlightReady ? (
                  <Highlighter 
                    color="#14b8a6"
                    strokeWidth={3}
                    animationDuration={1000}
                    iterations={1}
                    isView={false}>
                    <span className="relative z-10">simple.</span>
                  </Highlighter>
                ) : (
                  <span className="text-slate-900">simple.</span>
                )}
              </span>
            </h2>
            <p className="mt-3 max-w-3xl text-base text-slate-600">
              Sign up, customize your workspace, invite your team, and start using our powerful CRM modules. 
              Everything is integrated and ready to use from day one.
            </p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-3">
            {workflowSteps.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.title}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  custom={index * 0.1}
                  variants={fadeUp}>
                  <div className="h-full rounded-3xl border border-teal-100 bg-white p-6 shadow-md shadow-teal-100/60">
                    <Icon className="h-7 w-7 text-teal-500" />
                    <h3 className="mt-5 text-lg font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-3 text-sm text-slate-600">{item.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>

        <section id="showcase" className="space-y-12">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
              See our CRM in action.
            </h2>
            <p className="mt-3 max-w-3xl text-base text-slate-600">
              Explore our platform through these screenshots. Click on any image below to view it in detail.
            </p>
          </motion.div>

          {/* Main Image Display */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="relative w-full overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-xl shadow-teal-100/50">
            <div className="aspect-video w-full bg-gradient-to-br from-teal-50 to-cyan-50 relative">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImageIndex}
                  src={crmShowcaseImages[selectedImageIndex].url}
                  alt={crmShowcaseImages[selectedImageIndex].title}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Thumbnail Gallery */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {crmShowcaseImages.map((image, index) => (
              <motion.button
                key={image.id}
                onClick={() => setSelectedImageIndex(index)}
                className={`group relative aspect-video overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                  selectedImageIndex === index
                    ? 'border-teal-500 shadow-lg shadow-teal-200/50 scale-105'
                    : 'border-teal-100 hover:border-teal-300 hover:shadow-md'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}>
                <div className="h-full w-full bg-gradient-to-br from-teal-50 to-cyan-50">
                  <img
                    src={image.thumbnail}
                    alt={image.title}
                    className={`h-full w-full object-cover transition-all duration-300 ${
                      selectedImageIndex === index ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                    }`}
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
                {/* Active indicator */}
                {selectedImageIndex === index && (
                  <div className="absolute inset-0 bg-teal-500/10" />
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/10" />
              </motion.button>
            ))}
          </motion.div>
        </section>

        <section id="platform-access" className="space-y-12">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
              Access your CRM anywhere, anytime.
            </h2>
            <p className="mt-3 max-w-3xl text-base text-slate-600">
              We provide a comprehensive platform with one powerful admin panel and four dedicated mobile apps, 
              all available for direct download from the Play Store. Manage your business from desktop or on-the-go.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {/* Admin Panel */}
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={0}
              variants={fadeUp}
              className="group relative overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-white via-white to-teal-50/30 p-6 shadow-md transition-all duration-300 hover:border-teal-300 hover:shadow-xl hover:shadow-teal-100/50 lg:col-span-1">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-200/50 transition-transform duration-300 group-hover:scale-110">
                  <Monitor className="h-8 w-8 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Admin Panel</h3>
                <p className="mb-4 text-sm text-slate-600">Complete web-based control center</p>
                <div className="flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700">
                  <Cloud className="h-3.5 w-3.5" />
                  <span>Web Access</span>
                </div>
              </div>
            </motion.div>

            {/* Mobile Apps */}
            {[
              { name: 'Sales App', icon: Target, color: 'from-blue-500 to-blue-600' },
              { name: 'Project Manager', icon: Workflow, color: 'from-purple-500 to-purple-600' },
              { name: 'Employee App', icon: Users, color: 'from-emerald-500 to-emerald-600' },
              { name: 'Client App', icon: Cloud, color: 'from-cyan-500 to-cyan-600' }
            ].map((app, index) => {
              const Icon = app.icon
              return (
                <motion.div
                  key={app.name}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  custom={(index + 1) * 0.1}
                  variants={fadeUp}
                  className="group relative overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-white via-white to-teal-50/30 p-6 shadow-md transition-all duration-300 hover:border-teal-300 hover:shadow-xl hover:shadow-teal-100/50">
                  <div className="flex flex-col items-center text-center">
                    <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${app.color} shadow-lg shadow-teal-200/50 transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-slate-900">{app.name}</h3>
                    <p className="mb-4 text-sm text-slate-600">Mobile app for {app.name.toLowerCase()}</p>
                    <div className="flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700">
                      <Play className="h-3.5 w-3.5" />
                      <span>Play Store</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Download CTA */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            custom={0.5}
            variants={fadeUp}
            className="relative overflow-hidden rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 via-white to-cyan-50/50 p-8 shadow-lg">
            <div className="relative z-10 flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
              <div className="flex-1">
                <h3 className="mb-2 text-2xl font-semibold text-slate-900">
                  Ready to get started?
                </h3>
                <p className="text-base text-slate-600">
                  Download our mobile apps directly from the Play Store or access the admin panel from any web browser.
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                <Button
                  size="lg"
                  className="bg-teal-500 text-white shadow-lg shadow-teal-200/50 transition hover:bg-teal-600 hover:shadow-xl hover:shadow-teal-200/70">
                  <Download className="mr-2 h-5 w-5" />
                  Download Apps
                </Button>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br from-teal-100/50 to-cyan-100/50 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-24 w-24 translate-x-1/2 translate-y-1/2 rounded-full bg-gradient-to-br from-emerald-100/50 to-teal-100/50 blur-2xl" />
          </motion.div>
        </section>

        <section className="space-y-12">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
              Powerful admin controls to manage your business.
            </h2>
            <p className="mt-3 max-w-3xl text-base text-slate-600">
              Take full control of your CRM platform with comprehensive admin tools. Manage subscriptions,
              track analytics, and automate workflows—all from one central dashboard.
            </p>
          </motion.div>
          <div className="grid gap-8 lg:grid-cols-3">
            {governanceStack.map((layer, index) => {
              const Icon = layer.icon
              return (
                <motion.div
                  key={layer.title}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  custom={index * 0.1}
                  variants={fadeUp}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-teal-100/50 bg-gradient-to-br from-white via-white to-teal-50/30 p-8 shadow-md transition-all duration-300 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-100/50">
                    {/* Decorative gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 via-teal-500/0 to-teal-500/0 transition-all duration-500 group-hover:from-teal-500/5 group-hover:via-teal-500/3 group-hover:to-teal-500/5" />
                    
                    {/* Content */}
                    <div className="relative z-10">
                      {/* Header with number and icon */}
                      <div className="flex items-center gap-4 mb-6">
                        <div className="relative">
                          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-base font-bold text-white shadow-lg shadow-teal-200/50 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                            0{index + 1}
                          </span>
                          <div className="absolute -inset-1 rounded-xl bg-teal-200/30 blur-md opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 transition-all duration-300 group-hover:scale-110 group-hover:from-teal-100 group-hover:to-teal-200">
                          <Icon className="h-6 w-6 text-teal-600 transition-colors duration-300 group-hover:text-teal-700" />
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-semibold text-slate-900 transition-colors duration-300 group-hover:text-teal-700">
                        {layer.title}
                      </h3>
                      
                      {/* Description */}
                      <p className="mt-4 text-sm leading-relaxed text-slate-600">
                        {layer.details}
                      </p>

                      {/* Decorative bottom accent */}
                      <div className="mt-6 h-1 w-12 rounded-full bg-gradient-to-r from-teal-500 to-teal-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>

        <section id="pricing" ref={pricingRef} className="space-y-12">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Pricing designed for every business size.</h2>
            <p className="mt-3 max-w-3xl text-base text-slate-600">
              Choose the plan that fits your needs. All plans include setup support, onboarding assistance, 
              and access to all the features you need to run your business efficiently.
            </p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-3">
            {bundles.map((bundle, index) => (
              <motion.div
                key={bundle.name}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={index * 0.1}
                variants={fadeUp}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}>
                <div
                  className={`group relative flex h-full flex-col overflow-hidden rounded-xl border transition-all duration-300 ${
                    bundle.popular
                      ? 'border-teal-400 bg-gradient-to-br from-white via-teal-50/20 to-white shadow-xl shadow-teal-200/50 ring-2 ring-teal-400/20'
                      : 'border-teal-100 bg-white shadow-lg shadow-teal-100/50 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-100/70'
                  }`}>
                  {/* Popular badge */}
                  {bundle.popular && (
                    <div className="absolute right-0 top-0">
                      <div className="relative">
                        <div className="absolute -right-10 top-3 w-28 rotate-45 bg-teal-500 py-0.5 text-center text-[10px] font-bold text-white shadow-lg">
                          POPULAR
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Decorative gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-500 ${
                    bundle.popular
                      ? 'from-teal-500/5 via-teal-500/3 to-teal-500/5 opacity-100'
                      : 'from-teal-500/0 via-teal-500/0 to-teal-500/0 opacity-0 group-hover:opacity-100 group-hover:from-teal-500/5 group-hover:via-teal-500/3 group-hover:to-teal-500/5'
                  }`} />

                  <div className="relative z-10 flex h-full flex-col p-6">
                    {/* Plan name and badge */}
                    <div className="mb-4">
                      <span className={`inline-block rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        bundle.popular
                          ? 'bg-teal-500 text-white'
                          : 'bg-teal-100 text-teal-700'
                      }`}>
                        {bundle.name}
                      </span>
                      <h3 className="mt-3 text-lg font-semibold text-slate-900">{bundle.statement}</h3>
                    </div>

                    {/* Pricing */}
                    <div className="mb-4 border-b border-slate-200 pb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-teal-600">{bundle.price}</span>
                        <span className="text-base text-slate-600">{bundle.period}</span>
                      </div>
                      <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                        {bundle.extras}
                      </p>
                    </div>

                    {/* Features list */}
                    <div className="flex-1 space-y-2 mb-4">
                      {bundle.includes.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                            bundle.popular ? 'text-teal-500' : 'text-teal-400'
                          }`} />
                          <span className="text-xs text-slate-600 leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <Button
                      onClick={() => handleOpenRegistration(bundle)}
                      size="sm"
                      className={`w-full transition-all duration-300 ${
                        bundle.popular
                          ? 'bg-teal-500 text-white shadow-lg shadow-teal-200/50 hover:bg-teal-600 hover:shadow-xl hover:shadow-teal-200/70'
                          : 'bg-teal-50 text-teal-600 border border-teal-200 hover:bg-teal-100 hover:border-teal-300'
                      }`}>
                      Get Started
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.p
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            custom={0.4}
            variants={fadeUp}
            className="text-center text-xs text-slate-500">
            Need custom features or enterprise support? Contact us for tailored solutions and dedicated assistance.
          </motion.p>
        </section>

        <section id="stories" className="space-y-8">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
              Trusted by businesses of all sizes.
            </h2>
            <p className="mt-3 max-w-3xl text-base text-slate-600">
              Our platform is built on proven technology and used by teams across industries. 
              Join thousands of businesses that rely on our CRM platform every day.
            </p>
          </motion.div>

          {/* Marquee Testimonials */}
          <div className="relative">
            <div className="absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-white to-transparent" />
            <div className="absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-white to-transparent" />
            <Marquee pauseOnHover className="[--duration:30s]">
              {testimonials.map((story, index) => (
                <div
                  key={`${story.name}-${index}`}
                  className="mx-3 w-[350px] shrink-0 rounded-xl border border-teal-100 bg-white p-5 shadow-md shadow-teal-100/50 transition-all duration-300 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-100/70">
                  <p className="mb-4 text-sm leading-relaxed text-slate-600">"{story.quote}"</p>
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-sm font-semibold text-slate-900">{story.name}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                      {story.role}
                    </p>
                  </div>
                </div>
              ))}
            </Marquee>
          </div>
        </section>

        <section className="space-y-12">
          {/* FAQ Section */}
          <motion.div 
            initial="hidden" 
            whileInView="show" 
            viewport={{ once: true }} 
            variants={fadeUp} 
            className="space-y-10">
            <div className="text-center">
              <div className="inline-flex items-center justify-center gap-2 mb-4">
                <HelpCircle className="h-6 w-6 text-teal-500" />
                <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Frequently asked questions.</h2>
              </div>
              <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto">
                Everything you need to know about getting started with our CRM platform.
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index
                return (
                  <motion.div
                    key={faq.question}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    custom={index * 0.05}
                    variants={fadeUp}
                    className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                      isOpen 
                        ? 'border-teal-300 bg-gradient-to-br from-white to-teal-50/30 shadow-lg shadow-teal-100/50' 
                        : 'border-teal-100 bg-white shadow-sm hover:border-teal-200 hover:shadow-md'
                    }`}>
                    {/* Decorative gradient overlay when open */}
                    {isOpen && (
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-transparent pointer-events-none" />
                    )}
                    
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="relative z-10 w-full px-6 py-6 text-left flex items-center justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-2xl transition-colors duration-200 hover:bg-teal-50/30">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                          isOpen 
                            ? 'bg-teal-500 text-white' 
                            : 'bg-teal-100 text-teal-600 group-hover:bg-teal-200'
                        }`}>
                          <span className="text-sm font-bold">{index + 1}</span>
                        </div>
                        <span className={`text-base font-semibold pr-8 transition-colors duration-200 ${
                          isOpen ? 'text-teal-900' : 'text-slate-900'
                        }`}>
                          {faq.question}
                        </span>
                      </div>
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                        isOpen 
                          ? 'bg-teal-500 text-white rotate-180' 
                          : 'bg-teal-100 text-teal-600 group-hover:bg-teal-200 group-hover:scale-110'
                      }`}>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="relative z-10 overflow-hidden">
                          <div className="px-6 pb-6 pt-2 pl-[4.5rem]">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 h-1.5 w-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                              <p className="text-sm leading-relaxed text-slate-700 flex-1">
                                {faq.answer}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-emerald-500 p-1 shadow-2xl">
            <div className="relative rounded-2xl bg-white p-8 md:p-10">
              {/* Decorative elements */}
              <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br from-teal-100/50 to-cyan-100/50 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-24 w-24 translate-x-1/2 translate-y-1/2 rounded-full bg-gradient-to-br from-emerald-100/50 to-teal-100/50 blur-2xl" />
              
              <div className="relative z-10">
                <div className="mb-6">
                  <span className="inline-block rounded-full bg-teal-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-700">
                    Get Started Today
                  </span>
                  <h3 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">
                    Ready to transform your business?
                  </h3>
                  <p className="mt-3 text-base text-slate-600 max-w-xl">
                    Sign up today and start using our CRM platform to transform your business operations. 
                    Join thousands of businesses already using our platform.
                  </p>
                </div>
                
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-200/50 hover:from-teal-600 hover:to-cyan-600 hover:shadow-xl hover:shadow-teal-200/70 transition-all duration-300">
                    <Link to="/admin-login" className="flex items-center gap-2">
                      <Rocket className="h-5 w-5" />
                      Sign Up Now
                    </Link>
                  </Button>
                  <p className="text-sm text-slate-500 sm:ml-4">
                    <span className="font-semibold text-slate-700">Enterprise customers</span> get dedicated account management and priority support.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Registration Dialog */}
      <Dialog open={isRegistrationOpen} onOpenChange={setIsRegistrationOpen}>
        <DialogContent 
          className="max-w-2xl max-h-[95vh] overflow-y-auto p-0" 
          onClose={handleCloseRegistration}>
          {selectedBundle && (
            <div className="relative">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 p-6 text-white">
                <DialogHeader className="space-y-2">
                  <DialogTitle className="text-2xl font-bold text-white">
                    Create Your Account
                  </DialogTitle>
                  <DialogDescription className="text-white/90">
                    Sign up to get started with {selectedBundle.name} plan
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-6 space-y-6">
                {/* Selected Plan Info */}
                <div className="rounded-xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/30 p-5 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className={`inline-block rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                        selectedBundle.popular
                          ? 'bg-teal-500 text-white'
                          : 'bg-teal-100 text-teal-700'
                      }`}>
                        {selectedBundle.name}
                      </span>
                      {selectedBundle.popular && (
                        <span className="ml-2 text-xs font-semibold text-teal-600">Most Popular</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-teal-600">{selectedBundle.price}</span>
                      <span className="text-sm text-slate-600">{selectedBundle.period}</span>
                    </div>
                  </div>
                </div>

                {/* Registration Form */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleRegistrationSubmit()
                  }}
                  className="space-y-5">
                  <h3 className="text-lg font-semibold text-slate-900">Account Information</h3>
                  
                  {/* Name Field */}
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <User className="h-4 w-4 text-teal-500" />
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={userInfo.name}
                      onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                      placeholder="Enter your full name"
                      className={`w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 ${
                        formErrors.name
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-teal-200 focus:ring-teal-500 focus:border-teal-500'
                      }`}
                    />
                    {formErrors.name && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        {formErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-teal-500" />
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={userInfo.email}
                      onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                      placeholder="Enter your email address"
                      className={`w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 ${
                        formErrors.email
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-teal-200 focus:ring-teal-500 focus:border-teal-500'
                      }`}
                    />
                    {formErrors.email && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        {formErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-teal-500" />
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={userInfo.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                        setUserInfo({ ...userInfo, phone: value })
                      }}
                      placeholder="Enter your 10-digit phone number"
                      className={`w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 ${
                        formErrors.phone
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-teal-200 focus:ring-teal-500 focus:border-teal-500'
                      }`}
                    />
                    {formErrors.phone && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        {formErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-teal-500" />
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={userInfo.password}
                        onChange={(e) => setUserInfo({ ...userInfo, password: e.target.value })}
                        placeholder="Create a password (min. 6 characters)"
                        className={`w-full rounded-lg border px-4 py-3 pr-12 text-sm transition-all duration-200 focus:outline-none focus:ring-2 ${
                          formErrors.password
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-teal-200 focus:ring-teal-500 focus:border-teal-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {formErrors.password && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        {formErrors.password}
                      </p>
                    )}
                  </div>
                </form>

                {/* Info Message */}
                <div className="rounded-lg border border-teal-100 bg-teal-50/50 p-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    By creating an account, you agree to our Terms of Service and Privacy Policy. 
                    Your account will be set up immediately after payment confirmation.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Button
                    variant="outline"
                    onClick={handleCloseRegistration}
                    className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRegistrationSubmit}
                    className="w-full sm:w-auto bg-teal-500 text-white hover:bg-teal-600">
                    Continue to Checkout
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent 
          className="max-w-2xl max-h-[95vh] overflow-y-auto p-0" 
          onClose={handleCloseCheckout}>
          {selectedBundle && (
            <div className="relative">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 p-6 text-white">
                <DialogHeader className="space-y-2">
                  <DialogTitle className="text-2xl font-bold text-white">
                    Complete Your Purchase
                  </DialogTitle>
                  <DialogDescription className="text-white/90">
                    Review your plan details and choose a payment method
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-6 space-y-6">
                {/* Account Information Summary */}
                <div className="rounded-xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/30 p-5 shadow-md">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-teal-500" />
                    Account Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Name</p>
                      <p className="text-slate-900 font-medium">{userInfo.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Email</p>
                      <p className="text-slate-900 font-medium">{userInfo.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Phone</p>
                      <p className="text-slate-900 font-medium">{userInfo.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Account Status</p>
                      <p className="text-teal-600 font-medium">Pending Payment</p>
                    </div>
                  </div>
                </div>

                {/* Selected Plan Summary */}
                <div className="rounded-xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/30 p-5 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className={`inline-block rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                        selectedBundle.popular
                          ? 'bg-teal-500 text-white'
                          : 'bg-teal-100 text-teal-700'
                      }`}>
                        {selectedBundle.name}
                      </span>
                      {selectedBundle.popular && (
                        <span className="ml-2 text-xs font-semibold text-teal-600">Most Popular</span>
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{selectedBundle.statement}</h3>
                  
                  {/* Pricing */}
                  <div className="flex items-baseline gap-2 mb-4 pb-4 border-b border-slate-200">
                    <span className="text-4xl font-bold text-teal-600">{selectedBundle.price}</span>
                    <span className="text-base text-slate-600">{selectedBundle.period}</span>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700 mb-2">What's included:</p>
                    {selectedBundle.includes.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-500" />
                        <span className="text-sm text-slate-600">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Choose Payment Method</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { 
                        id: 'card', 
                        name: 'Credit/Debit Card', 
                        icon: CreditCard, 
                        description: 'Pay securely with your card',
                        color: 'from-blue-500 to-blue-600'
                      },
                      { 
                        id: 'upi', 
                        name: 'UPI', 
                        icon: Smartphone, 
                        description: 'Pay via UPI apps',
                        color: 'from-purple-500 to-purple-600'
                      },
                      { 
                        id: 'wallet', 
                        name: 'Digital Wallet', 
                        icon: Wallet, 
                        description: 'Paytm, PhonePe, etc.',
                        color: 'from-emerald-500 to-emerald-600'
                      },
                      { 
                        id: 'netbanking', 
                        name: 'Net Banking', 
                        icon: Building2, 
                        description: 'Direct bank transfer',
                        color: 'from-slate-500 to-slate-600'
                      }
                    ].map((method) => {
                      const Icon = method.icon
                      const isSelected = selectedPaymentMethod === method.id
                      return (
                        <button
                          key={method.id}
                          onClick={() => setSelectedPaymentMethod(method.id)}
                          className={`relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all duration-300 ${
                            isSelected
                              ? 'border-teal-500 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-lg shadow-teal-200/50'
                              : 'border-teal-100 bg-white hover:border-teal-300 hover:shadow-md'
                          }`}>
                          {isSelected && (
                            <div className="absolute right-2 top-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500">
                                <CheckCircle2 className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          )}
                          <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${method.color} shadow-md`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <h4 className="font-semibold text-slate-900 mb-1">{method.name}</h4>
                          <p className="text-xs text-slate-600">{method.description}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Plan: {selectedBundle.name}</span>
                      <span className="text-sm font-medium text-slate-900">{selectedBundle.price}{selectedBundle.period}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                      <span className="text-base font-semibold text-slate-900">Total Amount</span>
                      <span className="text-2xl font-bold text-teal-600">{selectedBundle.price}{selectedBundle.period}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Button
                    variant="outline"
                    onClick={handleCloseCheckout}
                    className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleProceedToPayment}
                    disabled={!selectedPaymentMethod}
                    className="w-full sm:w-auto bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed">
                    Proceed to Payment
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <MA_footer />
    </div>
  )
}

const MA_home = () => {
  return (
    <ScrollProvider>
      <MA_home_content />
    </ScrollProvider>
  )
}

export default MA_home

