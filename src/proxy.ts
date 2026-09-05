import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const currentPath = request.nextUrl.pathname

  // 1. Fast Path Exclusions: Static files, Next internals, public assets, and API routes (0ms overhead)
  if (
    currentPath.startsWith('/_next') ||
    currentPath.startsWith('/api') ||
    currentPath.startsWith('/publicjacos') ||
    currentPath === '/favicon.ico' ||
    currentPath.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico|pdf|txt|xml|woff|woff2|ttf)$/i)
  ) {
    return NextResponse.next({ request })
  }

  // 2. Subdomain Routing Logic
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  let isRewritten = false

  if (hostname.startsWith('admission.') || hostname.startsWith('ppdb.')) {
    // admission.jacos.id is default public area
  } else if (hostname.startsWith('management.')) {
    if (!currentPath.startsWith('/management')) {
      url.pathname = `/management${currentPath === '/' ? '' : currentPath}`
      isRewritten = true
    }
  } else if (hostname.startsWith('absensi.')) {
    if (!currentPath.startsWith('/absensi-app')) {
      url.pathname = `/absensi-app${currentPath === '/' ? '' : currentPath}`
      isRewritten = true
    }
  } else if (hostname.startsWith('penjemputan.')) {
    if (!currentPath.startsWith('/penjemputan-app')) {
      url.pathname = `/penjemputan-app${currentPath === '/' ? '' : currentPath}`
      isRewritten = true
    }
  } else if (hostname.startsWith('parent.')) {
    if (!currentPath.startsWith('/parent-portal')) {
      url.pathname = `/parent-portal${currentPath === '/' ? '' : currentPath}`
      isRewritten = true
    }
  }

  // 3. Auth Check only for Protected Areas (/management or /parent-portal)
  const effectivePath = isRewritten ? url.pathname : currentPath
  if (effectivePath.startsWith('/management') || effectivePath.startsWith('/parent-portal')) {
    const authResponse = await updateSession(request)
    // If updateSession returned a redirect response (e.g. not logged in), return it immediately
    if (authResponse.status >= 300 && authResponse.status < 400) {
      return authResponse
    }
    if (isRewritten) {
      return NextResponse.rewrite(url, {
        headers: authResponse.headers,
      })
    }
    return authResponse
  }

  // 4. Public routes pass through instantly
  if (isRewritten) {
    return NextResponse.rewrite(url)
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public asset patterns
     */
    '/((?!_next/static|_next/image|publicjacos|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf|woff|woff2)$).*)',
  ],
}

