"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createParentClient } from "@/lib/supabase/client";
import { ParentSidebar } from "@/components/parent-portal/ParentSidebar";
import { ParentTopNav } from "@/components/parent-portal/ParentTopNav";
import { ParentBottomNav } from "@/components/parent-portal/ParentBottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createParentClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session || session.user?.user_metadata?.role !== 'PARENT') {
        const isSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('parent.');
        router.push(isSubdomain ? '/login' : '/parent-portal/login');
        return;
      }

      const user = session.user;

      // Fast path: first_login gate
      if (user.user_metadata?.first_login) {
        router.push("/parent-portal/change-password");
        return;
      }

      // Check metadata status — no DB query needed for approved users
      const metaStatus = user.user_metadata?.admission_status || "";
      const metaStudentId = user.user_metadata?.student_id;
      const isApprovedByMeta = metaStatus === "Approved" || !!metaStudentId;
      if (isApprovedByMeta) return;

      // Fallback: verify via guardians table (legacy accounts only)
      if (user?.email) {
        const { data: guardians } = await supabase
          .from("guardians")
          .select("applicant_id, applicants(status, student_record_id)")
          .eq("email", user.email.toLowerCase())
          .limit(1);

        const applicant = (guardians?.[0] as any)?.applicants;
        // No redirect needed — page.tsx handles waiting/rejected states
        if (!applicant?.status && !applicant?.student_record_id) {
          // Not enrolled and not in DB — leave it to page to show waiting state
        }
      }
    };

    checkSession();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    const isSubdomain = window.location.hostname.startsWith('parent.');
    router.push(isSubdomain ? '/login' : '/parent-portal/login');
  };

  return (
    <div className="flex min-h-screen bg-cloud text-ink font-body">
      <ParentSidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <ParentTopNav />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-cloud p-4 sm:p-6 lg:p-10 pb-28 lg:pb-10">
          {children}
        </main>
        <ParentBottomNav />
      </div>
    </div>
  );
}
