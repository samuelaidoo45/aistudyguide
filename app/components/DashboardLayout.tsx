"use client"

import { useState, ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/app/lib/supabase'
import { motion } from 'framer-motion'
import { 
  Home, 
  BookOpen, 
  History, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User,
  BookMarked,
  Award,
  Mail
} from 'lucide-react'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'New Topic', href: '/dashboard/new-topic', icon: BookOpen },
    { name: 'My Topics', href: '/dashboard/topics', icon: BookMarked },
    { name: 'Achievements', href: '/dashboard/achievements', icon: Award },
    { name: 'Contact Us', href: '/dashboard/contact', icon: Mail },
  ]

  const userNavigation = [
    { name: 'Your Profile', href: '/dashboard/profile' },
    { name: 'Settings', href: '/dashboard/settings' },
  ]

  return (
    <div className="min-h-screen bg-bg-primary transition-colors duration-200">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`} role="dialog" aria-modal="true">
        {/* Remove the overlay completely */}
        
        {/* Sidebar - Make it completely opaque with solid white background */}
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl border-r-2 border-gray-200">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-12 w-12 rounded-md bg-white border-2 border-gray-300 shadow-md text-gray-700 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-500 transition-all duration-200"
              onClick={() => setSidebarOpen(false)}
              style={{
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4 mb-4 border-b pb-4">
              <Image 
                src="/images/logo.png" 
                alt="TopicSimplify Logo" 
                width={150} 
                height={50} 
                className="h-8 w-auto"
              />
            </div>
            <nav className="mt-2 px-4 space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      group flex items-center px-3 py-3 text-base font-medium rounded-md border ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm'
                          : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 border-transparent hover:border-indigo-100'
                      }
                    `}
                  >
                    <item.icon 
                      className={`mr-4 h-6 w-6 ${
                        isActive
                          ? 'text-indigo-500'
                          : 'text-gray-500 group-hover:text-indigo-500'
                      }`} 
                    />
                    {item.name}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-indicator"
                        className="absolute left-0 w-1 h-8 bg-indigo-500 rounded-r-full"
                      />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <button
              onClick={handleSignOut}
              className="group flex items-center px-3 py-3 w-full text-base font-medium rounded-md border border-transparent hover:border-red-100 text-gray-700 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="inline-block h-6 w-6 text-gray-500 group-hover:text-red-500 mr-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-bg-secondary border-r border-border-primary">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <Image 
                src="/images/logo.png" 
                alt="StudyGuide Logo" 
                width={150} 
                height={50} 
                className="h-8 w-auto"
              />
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700'
                      }
                    `}
                  >
                    <item.icon 
                      className={`mr-3 flex-shrink-0 h-6 w-6 ${
                        isActive
                          ? 'text-indigo-500'
                          : 'text-gray-500 group-hover:text-indigo-500'
                      }`} 
                    />
                    {item.name}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-indicator-desktop"
                        className="absolute left-0 w-1 h-8 bg-indigo-500 rounded-r-full"
                      />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-border-primary p-4">
            <button
              onClick={handleSignOut}
              className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <LogOut className="inline-block h-5 w-5 text-gray-500 group-hover:text-indigo-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">Sign out</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 mobile-only pl-1 pt-1 sm:pl-3 sm:pt-3 bg-bg-primary">
          <button
            type="button"
            className="h-12 w-12 inline-flex items-center justify-center rounded-md bg-white border-2 border-gray-300 shadow-md text-gray-700 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-500 transition-all duration-200"
            onClick={() => setSidebarOpen(true)}
            style={{
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
} 