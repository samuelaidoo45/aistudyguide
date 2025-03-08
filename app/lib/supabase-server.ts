import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  // Check if environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // If environment variables are not available (during static build),
  // return a mock client or null
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase URL or API key not available. This is expected during static build.')
    // Return a mock client that won't be used during static build
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      },
      // Add other methods as needed
    } as any
  }
  
  // Use 'any' type to bypass type checking
  const cookieStore = cookies() as any
  
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name) {
          const cookie = cookieStore.get(name)
          return cookie?.value
        },
        set(name, value, options) {
          // This is a workaround for the fact that in Next.js App Router,
          // we can't set cookies properly in middleware or server actions
          // due to the way the cookies() API works
          cookieStore.set(name, value, options)
        },
        remove(name, options) {
          // Same workaround as above
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )
} 