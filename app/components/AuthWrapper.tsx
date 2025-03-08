'use client'

import { useState, useEffect, ReactNode } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Toaster, toast } from 'react-hot-toast'
import { clearAuthCookies } from '../utils/cookieUtils'

type AuthWrapperProps = {
  children: ReactNode
  redirectTo?: string
  fallbackContent?: ReactNode
}

export default function AuthWrapper({ 
  children, 
  redirectTo = '/auth/login',
  fallbackContent
}: AuthWrapperProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    let mounted = true
    let refreshTimer: NodeJS.Timeout | null = null

    // Function to check and refresh session
    const checkAndRefreshSession = async () => {
      try {
        // Get current session with detailed logging
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log("[AuthWrapper] Current session details:", {
          hasSession: !!session,
          expiresAt: session?.expires_at,
          currentTime: Math.floor(Date.now() / 1000),
          user: session?.user?.id
        })
        
        if (sessionError) {
          console.error("[AuthWrapper] Session error:", sessionError)
          throw sessionError
        }

        if (!session) {
          console.log("[AuthWrapper] No session found, attempting immediate refresh")
          try {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
            console.log("[AuthWrapper] Refresh attempt result:", {
              success: !!refreshData?.session,
              error: refreshError,
              newExpiresAt: refreshData?.session?.expires_at
            })
            
            if (refreshError || !refreshData.session) {
              console.error("[AuthWrapper] Session refresh failed:", refreshError)
              throw new Error(refreshError?.message || "Session refresh failed")
            }

            if (mounted) {
              setUser(refreshData.session.user)
              return true
            }
          } catch (refreshErr) {
            console.error("[AuthWrapper] Error during refresh:", refreshErr)
            // Clear cookies and redirect to login
            await supabase.auth.signOut()
            clearAuthCookies() // Use our utility function to clear cookies
            if (!window.location.pathname.includes('/auth/login')) {
              const returnUrl = encodeURIComponent(window.location.pathname)
              window.location.href = `${redirectTo}?returnUrl=${returnUrl}`
            }
            return false
          }
          return false
        }

        // If we get here, we have a valid session
        // Check if session is about to expire (within next 5 minutes)
        const expiresAt = session.expires_at || 0
        const now = Math.floor(Date.now() / 1000)
        const timeUntilExpiry = expiresAt - now

        console.log("[AuthWrapper] Session expiry check:", {
          timeUntilExpiry,
          shouldRefresh: timeUntilExpiry < 300 && timeUntilExpiry > 0
        })

        if (timeUntilExpiry < 300 && timeUntilExpiry > 0) { // Less than 5 minutes until expiry
          console.log("[AuthWrapper] Session expiring soon, refreshing...")
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
          console.log("[AuthWrapper] Proactive refresh result:", {
            success: !!refreshData?.session,
            error: refreshError,
            newExpiresAt: refreshData?.session?.expires_at
          })
          
          if (refreshError) {
            console.error("[AuthWrapper] Failed to refresh session:", refreshError)
            throw refreshError
          }

          if (!refreshData.session) {
            console.error("[AuthWrapper] No session after refresh")
            throw new Error("Session refresh failed")
          }

          if (mounted) {
            setUser(refreshData.session.user)
          }
        } else if (timeUntilExpiry <= 0) {
          console.error("[AuthWrapper] Session has expired, attempting recovery")
          // Try one last refresh attempt
          const { data: lastRefreshData, error: lastRefreshError } = await supabase.auth.refreshSession()
          if (lastRefreshData?.session && mounted) {
            console.log("[AuthWrapper] Successfully recovered expired session")
            setUser(lastRefreshData.session.user)
            return true
          }
          throw new Error("Session expired and recovery failed")
        } else if (mounted && session.user) {
          setUser(session.user)
        }

        return true
      } catch (err: any) {
        console.error("[AuthWrapper] Auth error:", err)
        if (mounted) {
          setError(err.message || "Authentication error")
          setUser(null)
          
          // Clear cookies on auth error
          clearAuthCookies()
          
          // If we're not on the login page, redirect with return URL
          if (!window.location.pathname.includes('/auth/login')) {
            const returnUrl = encodeURIComponent(window.location.pathname)
            window.location.href = `${redirectTo}?returnUrl=${returnUrl}`
          }
        }
        return false
      }
    }

    // Initial auth check
    const initAuth = async () => {
      try {
        console.log("[AuthWrapper] Starting initial auth check...")
        const isAuthenticated = await checkAndRefreshSession()
        console.log("[AuthWrapper] Initial auth check result:", { isAuthenticated })
        
        if (!isAuthenticated && !window.location.pathname.includes('/auth/login')) {
          const returnUrl = encodeURIComponent(window.location.pathname)
          window.location.href = `${redirectTo}?returnUrl=${returnUrl}`
          return
        }
      } catch (error) {
        console.error("[AuthWrapper] Init auth error:", error)
        clearAuthCookies()
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Set up auth state listener with improved logging
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthWrapper] Auth state changed:', { 
        event, 
        hasSession: !!session,
        userId: session?.user?.id,
        expiresAt: session?.expires_at
      })
      
      if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUser(null)
          setError("You have been signed out")
          clearAuthCookies()
        }
        if (!window.location.pathname.includes('/auth/login')) {
          window.location.href = redirectTo
        }
      } else if (event === 'SIGNED_IN' && session) {
        if (mounted) {
          setUser(session.user)
          setError(null)
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('[AuthWrapper] Session refreshed:', {
          newExpiresAt: session.expires_at,
          userId: session.user?.id
        })
        if (mounted) {
          setUser(session.user)
          setError(null)
        }
      }
    })

    // Reduce the check interval to 2 minutes for more frequent checks
    refreshTimer = setInterval(() => {
      checkAndRefreshSession()
    }, 120000) // 2 minutes

    initAuth()

    // Cleanup
    return () => {
      mounted = false
      if (refreshTimer) {
        clearInterval(refreshTimer)
      }
      subscription.unsubscribe()
    }
  }, [supabase, router, redirectTo])

  // If loading, show loading spinner
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-500">Verifying your session...</p>
      </div>
    )
  }

  // If error and no fallback content, show error screen
  if (error && !user && !fallbackContent) {
    return (
      <>
        <Toaster position="top-center" />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Authentication Required
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                {error}
              </p>
            </div>
            <div className="mt-8 space-y-6">
              <div className="flex flex-col items-center">
                <Link 
                  href={`${redirectTo}?returnUrl=${encodeURIComponent(window.location.pathname)}`}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Sign In
                </Link>
                
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    clearAuthCookies();
                    window.location.href = `${redirectTo}?returnUrl=${encodeURIComponent(window.location.pathname)}`;
                  }}
                  className="mt-4 text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Clear session and sign in again
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // If fallback content is provided and there's an error, show fallback
  if (error && !user && fallbackContent) {
    return <>{fallbackContent}</>
  }

  // If user is authenticated, show the children
  return <>{children}</>
} 