import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  // If there's no code, redirect to login
  if (!code) {
    console.error('No code provided in callback')
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  try {
    // Create a Supabase client for route handlers
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/auth/login?error=exchange_failed', request.url))
    }
    
    // Get the session to confirm it was created
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.error('Session not created after code exchange')
      return NextResponse.redirect(new URL('/auth/login?error=no_session', request.url))
    }
    
    // Log the successful authentication
    console.log('Successfully authenticated user:', session.user.id)
    console.log('Successfully exchanged code for session, redirecting to dashboard')
    
    // Create a response that redirects to the dashboard
    const response = NextResponse.redirect(new URL('/dashboard', request.url))
    
    // Ensure cookies are properly set in the response
    const cookieOptions = {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production'
    }
    
    // Set a custom cookie to help with session detection in middleware
    response.cookies.set('auth-session-active', 'true', cookieOptions)
    
    return response
  } catch (error) {
    console.error('Unexpected error in callback:', error)
    return NextResponse.redirect(new URL('/auth/login?error=unexpected', request.url))
  }
} 