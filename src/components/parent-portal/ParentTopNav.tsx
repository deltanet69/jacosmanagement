"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { createParentClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";

export function ParentTopNav() {
  const [userName, setUserName] = useState("Orang Tua");
  const supabase = createParentClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.full_name) {
        setUserName(session.user.user_metadata.full_name);
      }
    };
    fetchUser();
  }, [supabase]);

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 lg:h-20 bg-white border-b border-ink/5 px-4 sm:px-6 lg:px-10 flex items-center justify-between sticky top-0 z-30">
      {/* Mobile: School Logo | Desktop: Title/Breadcrumb */}
      <div className="flex items-center gap-4">
        <Link href="/parent-portal" className="lg:hidden flex items-center gap-2">
          <Image 
            src="/publicjacos/logo.png" 
            alt="Jakarta Cosmopolite Islamic School" 
            width={140} 
            height={36} 
            className="h-8 sm:h-9 w-auto object-contain dark:hidden" 
            priority
          />
          <Image 
            src="/publicjacos/logoputih.png" 
            alt="Jakarta Cosmopolite Islamic School" 
            width={140} 
            height={36} 
            className="h-8 sm:h-9 w-auto object-contain hidden dark:block" 
            priority
          />
        </Link>
        <div className="hidden lg:block">
          <span className="text-xs font-bold text-ink-300 uppercase tracking-wider">Parent Portal</span>
          <p className="text-sm font-bold text-ink">Jakarta Cosmopolite Islamic School</p>
        </div>
      </div>
      
      {/* Right Side: Notifications & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href="/parent-portal/informasi">
          <button 
            type="button"
            className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full sm:rounded-xl hover:bg-cloud transition-colors text-ink-400"
            aria-label="Notifikasi"
          >
            <Bell size={20} className="text-ink-500 stroke-[1.8]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-coral ring-2 ring-white"></span>
          </button>
        </Link>
        
        <div className="h-6 w-px bg-ink/10 hidden sm:block"></div>
        
        <Link href="/parent-portal/profil-siswa" className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-ink group-hover:text-sky transition-colors">{userName}</p>
            <p className="text-[11px] font-semibold text-ink-300 uppercase tracking-wider">Parent Portal</p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full sm:rounded-xl bg-sky flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm shrink-0 ring-2 ring-sky/20">
            {getInitials(userName)}
          </div>
        </Link>
      </div>
    </header>
  );
}
