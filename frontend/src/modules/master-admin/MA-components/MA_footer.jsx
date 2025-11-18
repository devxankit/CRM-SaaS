import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram, 
  Mail,
  Phone,
  MapPin,
  Sparkles
} from 'lucide-react'

const MA_footer = () => {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    product: [
      { label: 'Sales CRM', to: '/sales-login' },
      { label: 'Project Management', to: '/pm-login' },
      { label: 'Employee Hub', to: '/employee-login' },
      { label: 'Finance Suite', to: '/admin-login' },
      { label: 'Client Portal', to: '/client-login' }
    ],
    company: [
      { label: 'About Us', to: '#' },
      { label: 'Careers', to: '#' },
      { label: 'Blog', to: '#' },
      { label: 'Contact', to: '#' }
    ],
    resources: [
      { label: 'Documentation', to: '#' },
      { label: 'API Reference', to: '#' },
      { label: 'Guides', to: '#' },
      { label: 'Support Center', to: '#' }
    ],
    legal: [
      { label: 'Privacy Policy', to: '#' },
      { label: 'Terms of Service', to: '#' },
      { label: 'Cookie Policy', to: '#' },
      { label: 'Security', to: '#' }
    ]
  }

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Instagram, href: '#', label: 'Instagram' }
  ]

  return (
    <footer className="relative bg-slate-900 text-slate-300">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 opacity-50" />
      
      <div className="relative mx-auto w-full max-w-7xl px-6 py-16 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Brand Section */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-teal-400" />
              <span className="text-xl font-bold text-white">CRM Platform</span>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-slate-400 max-w-sm">
              Your complete CRM solution for sales, projects, HR, finance, and client management. 
              Transform your business operations with our integrated platform.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Mail className="h-4 w-4 text-teal-400 flex-shrink-0" />
                <a href="mailto:support@crmplatform.com" className="hover:text-teal-400 transition-colors">
                  support@crmplatform.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Phone className="h-4 w-4 text-teal-400 flex-shrink-0" />
                <a href="tel:+911234567890" className="hover:text-teal-400 transition-colors">
                  +91 123 456 7890
                </a>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-400">
                <MapPin className="h-4 w-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <span>123 Business Street, Tech City, India 123456</span>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          <div className="lg:col-span-8 grid grid-cols-2 gap-8 md:grid-cols-4">
            {/* Product Links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                Product
              </h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-400 transition-colors hover:text-teal-400">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                Company
              </h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-400 transition-colors hover:text-teal-400">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                Resources
              </h3>
              <ul className="space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-400 transition-colors hover:text-teal-400">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                Legal
              </h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-400 transition-colors hover:text-teal-400">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 border-t border-slate-800 pt-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            {/* Copyright */}
            <div className="text-sm text-slate-400">
              <p>
                © {currentYear} CRM Platform. All rights reserved.
              </p>
            </div>

            {/* Social Media Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-800/50 text-slate-400 transition-all duration-300 hover:border-teal-500/50 hover:bg-teal-500/10 hover:text-teal-400"
                    aria-label={social.label}>
                    <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default MA_footer

