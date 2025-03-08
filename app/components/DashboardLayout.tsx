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
  Moon,
  Sun
} from 'lucide-react'
import { useTheme } from '@/app/context/ThemeContext'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { theme, toggleTheme } = useTheme()

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
  ]

  const userNavigation = [
    { name: 'Your Profile', href: '/dashboard/profile' },
    { name: 'Settings', href: '/dashboard/settings' },
  ]

  return (
    <div className="min-h-screen bg-bg-primary transition-colors duration-200">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`} role="dialog" aria-modal="true">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75" 
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        ></div>

        {/* Sidebar */}
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-bg-secondary">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <Image 
                src="/images/logo.png" 
                alt="StudyGuide Logo" 
                width={150} 
                height={50} 
                className="h-8 w-auto"
              />
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      group flex items-center px-2 py-2 text-base font-medium rounded-md transition-all duration-200
                      ${isActive 
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 shadow-sm' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 hover:text-indigo-700 dark:hover:text-indigo-300'
                      }
                    `}
                  >
                    <item.icon 
                      className={`mr-4 h-6 w-6 transition-colors duration-200
                        ${isActive 
                          ? 'text-indigo-500 dark:text-indigo-400' 
                          : 'text-gray-500 dark:text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400'
                        }
                      `} 
                    />
                    {item.name}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-indicator"
                        className="absolute left-0 w-1 h-8 bg-indigo-500 rounded-r-full"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
              className="flex-shrink-0 group block w-full"
            >
              <div className="flex items-center">
                <div>
                  <LogOut className="inline-block h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400" />
                </div>
                <div className="ml-3">
                  <p className="text-base font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">Sign out</p>
                </div>
              </div>
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
                      relative group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200
                      ${isActive 
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 shadow-sm' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 hover:text-indigo-700 dark:hover:text-indigo-300'
                      }
                    `}
                  >
                    <item.icon 
                      className={`mr-3 h-5 w-5 transition-colors duration-200
                        ${isActive 
                          ? 'text-indigo-500 dark:text-indigo-400' 
                          : 'text-gray-500 dark:text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400'
                        }
                      `} 
                    />
                    {item.name}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-indicator-desktop"
                        className="absolute left-0 w-1 h-8 bg-indigo-500 rounded-r-full"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
              className="flex-shrink-0 group block w-full"
            >
              <div className="flex items-center">
                <div>
                  <LogOut className="inline-block h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">Sign out</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-bg-primary">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <main className="flex-1">
          <div className="flex justify-end p-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </div>
          {children}
        </main>
      </div>
    </div>
  )
} 