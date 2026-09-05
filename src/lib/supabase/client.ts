import { createBrowserClient } from '@supabase/ssr'

let adminBrowserClient: ReturnType<typeof createBrowserClient> | null = null;
let parentBrowserClient: ReturnType<typeof createBrowserClient> | null = null;

// Admin / Management browser client (isolated session cookie - Browser Singleton)
export function createClient() {
  if (typeof window === "undefined") {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: {
          name: 'sb-admin-auth-token',
        },
      }
    );
  }

  if (!adminBrowserClient) {
    adminBrowserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: {
          name: 'sb-admin-auth-token',
        },
      }
    );
  }

  return adminBrowserClient;
}

// Parent Portal browser client (isolated session cookie - Browser Singleton)
export function createParentClient() {
  if (typeof window === "undefined") {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: {
          name: 'sb-parent-auth-token',
        },
      }
    );
  }

  if (!parentBrowserClient) {
    parentBrowserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: {
          name: 'sb-parent-auth-token',
        },
      }
    );
  }

  return parentBrowserClient;
}
