import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  // 1. Supabase Session Update (Auth)
  const response = await updateSession(request)
  
  // 2. Subdomain Routing Logic
  const url = request.nextUrl.clone()
  
  // Get hostname (e.g. 'management.jacos.id', 'localhost:3000')
  const hostname = request.headers.get('host') || ''
  const currentPath = url.pathname
  
  // Exclude API, static files, and next internals
  if (
    currentPath.startsWith('/_next') ||
    currentPath.startsWith('/api') ||
    currentPath.match(/\.(.*)$/)
  ) {
    return response
  }

  // Rewrite based on subdomain
  if (hostname.startsWith('admission.') || hostname.startsWith('ppdb.')) {
    // admission.jacos.id is the default public area (including Landing Page and /admission)
    // No rewrite needed for root; let it pass through to (public) routes
  } else if (hostname.startsWith('management.')) {
    // management.jacos.id -> /management
    if (!currentPath.startsWith('/management')) {
      url.pathname = `/management${currentPath === '/' ? '' : currentPath}`
      return NextResponse.rewrite(url)
    }
  } else if (hostname.startsWith('absensi.')) {
    // absensi.jacos.id -> /absensi-app
    if (!currentPath.startsWith('/absensi-app')) {
      url.pathname = `/absensi-app${currentPath === '/' ? '' : currentPath}`
      return NextResponse.rewrite(url)
    }
  } else if (hostname.startsWith('penjemputan.')) {
    // penjemputan.jacos.id -> /penjemputan-app
    if (!currentPath.startsWith('/penjemputan-app')) {
      url.pathname = `/penjemputan-app${currentPath === '/' ? '' : currentPath}`
      return NextResponse.rewrite(url)
    }
  } else if (hostname.startsWith('parent.')) {
    // parent.jacos.id -> /parent-portal
    if (!currentPath.startsWith('/parent-portal')) {
      url.pathname = `/parent-portal${currentPath === '/' ? '' : currentPath}`
      return NextResponse.rewrite(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
