import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isParentRoute = pathname.startsWith('/parent-portal')
  const isManagementRoute = pathname.startsWith('/management')

  // Public / Static / Marketing routes: bypass Supabase Auth calls entirely (0ms overhead)
  if (!isManagementRoute && !isParentRoute) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  // 1. Management / Admin Route Protection
  if (isManagementRoute) {
    const adminCookies = request.cookies.getAll().filter(c => c.name.startsWith('sb-admin-auth-token'))
    if (adminCookies.length === 0) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: {
          name: 'sb-admin-auth-token',
        },
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

    const { data: { user: adminUser } } = await adminSupabase.auth.getUser()
    if (!adminUser) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // 2. Parent Portal Route Session Refresh
  if (isParentRoute) {
    const parentCookies = request.cookies.getAll().filter(c => c.name.startsWith('sb-parent-auth-token'))
    if (parentCookies.length > 0) {
      const parentSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookieOptions: {
            name: 'sb-parent-auth-token',
          },
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

      await parentSupabase.auth.getUser()
    }
  }

  return supabaseResponse
}
