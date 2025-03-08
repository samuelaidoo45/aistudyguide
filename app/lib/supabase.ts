import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
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
        resetPasswordForEmail: () => Promise.resolve({ data: null, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: null }),
        signUp: () => Promise.resolve({ data: null, error: null }),
        signOut: () => Promise.resolve({ error: null }),
      },
      // Add other methods as needed
    } as any
  }
  
  return createBrowserClient(
    supabaseUrl,
    supabaseKey
  )
} 