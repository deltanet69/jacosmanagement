"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { ParentSidebar } from "@/components/parent-portal/ParentSidebar";
import { ParentTopNav } from "@/components/parent-portal/ParentTopNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || session.user?.user_metadata?.role !== 'PARENT') {
        const isSubdomain = window.location.hostname.startsWith('parent.');
        router.push(isSubdomain ? '/login' : '/parent-portal/login');
        return;
      }

      if (session.user.user_metadata?.first_login) {
        router.push('/parent-portal/change-password');
        return;
      }

      const status = session.user.user_metadata?.admission_status || 'Waiting for approval';
      if (status === 'Approved') {
        setIsApproved(true);
      }
      setLoading(false);
    };

    checkSession();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    const isSubdomain = window.location.hostname.startsWith('parent.');
    router.push(isSubdomain ? '/login' : '/parent-portal/login');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-cloud">
        <p className="text-ink-400 font-bold">Memuat portal...</p>
      </div>
    );
  }

  // If not approved, just render children (which will handle Waiting/Rejected screens)
  if (!isApproved) {
    return <main className="flex-1 flex flex-col">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-cloud text-ink font-body">
      <ParentSidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <ParentTopNav />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-cloud p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
