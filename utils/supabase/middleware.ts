import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Skip middleware for static files and API routes
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path === '/favicon.ico' ||
    path.includes('.')
  ) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Allow access to auth pages and root
  if (
    path.startsWith('/login') ||
    path.startsWith('/signup') ||
    path.startsWith('/pending-verification') ||
    path.startsWith('/auth') ||
    path === '/'
  ) {
    return supabaseResponse
  }

  // Redirect unauthenticated users to login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Only fetch profile for protected routes that need role checking
  if (path.startsWith('/core') || path.startsWith('/member')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const role = profile.role

    // Role-based access control
    if (path.startsWith('/core') && role !== 'core') {
      return NextResponse.redirect(new URL('/member', request.url))
    }

    if (path.startsWith('/member') && role !== 'member') {
      return NextResponse.redirect(new URL('/core', request.url))
    }
  }

  return supabaseResponse
}