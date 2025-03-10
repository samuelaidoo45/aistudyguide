import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  if (request.nextUrl.pathname.startsWith('/auth/callback')) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  // Use a type assertion ("as any") to pass in new cookie methods.
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => {
        const cookieObj: Record<string, string> = {}
        request.cookies.getAll().forEach(cookie => {
          cookieObj[cookie.name] = cookie.value
        })
        return cookieObj
      },
      setAll: (cookies: Record<string, string>) => {
        for (const [name, value] of Object.entries(cookies)) {
          response.cookies.set({ name, value })
        }
      },
    } as any,
  })

  try {
    const { data: { user } } = await supabase.auth.getUser()

    const publicPaths = [
      '/',
      '/auth',
      '/_next',
      '/api',
      '/terms-and-conditions',
      '/privacy-policy',
    ]
    
    const isPublicPath = publicPaths.some(
      (path) =>
        request.nextUrl.pathname === path ||
        request.nextUrl.pathname.startsWith(path + '/')
    )
    
    if (!user && !isPublicPath) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    if (true && request.nextUrl.pathname.startsWith('/auth') && !request.nextUrl.pathname.startsWith('/auth/callback')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch (error) {
    // Continue the request if an error occurs while checking the user.
  }

  const securityHeaders = {
    'X-XSS-Protection': '1; mode=block',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  }

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|.well-known).*)',
  ],
}
