import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  // Use 'any' type to bypass type checking
  const cookieStore = cookies() as any
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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