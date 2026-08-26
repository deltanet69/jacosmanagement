import { createBrowserClient } from '@supabase/ssr'

// Admin / Management browser client (isolated session cookie)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: 'sb-admin-auth-token',
      },
    }
  )
}

// Parent Portal browser client (isolated session cookie)
export function createParentClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: 'sb-parent-auth-token',
      },
    }
  )
}
