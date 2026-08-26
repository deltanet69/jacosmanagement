"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserCheck, GraduationCap, Receipt, CalendarCheck, Settings, LogOut, BookOpen, Car, Megaphone, Sparkles } from "lucide-react";
import { logout } from "@/app/(public)/login/actions";

const NAV_ITEMS = [
  { href: "/management", label: "Beranda", icon: LayoutDashboard, color: "text-sky", bgColor: "bg-sky-50" },
  { href: "/management/admisi", label: "Online Admission", icon: Users, color: "text-coral", bgColor: "bg-coral-50" },
  { href: "/management/openhouse", label: "Open House", icon: Sparkles, color: "text-gold-600", bgColor: "bg-gold-50" },
  { href: "/management/siswa", label: "Data Siswa", icon: GraduationCap, color: "text-leaf", bgColor: "bg-leaf-50" },
  { href: "/management/guru", label: "Data Guru", icon: UserCheck, color: "text-gold", bgColor: "bg-gold-50" },
  { href: "/management/classroom", label: "Classroom", icon: BookOpen, color: "text-sky", bgColor: "bg-sky-50" },
  { href: "/management/informasi", label: "Informasi & Kegiatan", icon: Megaphone, color: "text-coral", bgColor: "bg-coral-50" },
  { href: "/management/absensi/penjemputan", label: "Penjemputan Siswa", icon: Car, color: "text-purple-600", bgColor: "bg-purple-50" },
  { href: "/management/keuangan", label: "Keuangan & SPP", icon: Receipt, color: "text-sky-600", bgColor: "bg-sky-50" },
  { href: "/management/absensi", label: "Rekap Absensi", icon: CalendarCheck, color: "text-coral-600", bgColor: "bg-coral-50" },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  // Handle both /management and /management/...
  // but be careful with exact match for home
  const isActive = (path: string) => {
    if (path === "/management") return pathname === path;
    return pathname.startsWith(path);
  };

  return (
    <aside className="hidden lg:flex w-82 bg-white border-r border-ink/10 flex-col h-screen sticky top-0 shrink-0">
      <div className="px-8 py-8 border-b border-ink/5">
        <Link href="/management" className="flex items-center gap-2.5">
          <Image src="/publicjacos/logo.png" alt="JACOS Logo" width={150} height={40} className="dark:hidden object-contain" />
          <Image src="/publicjacos/logoputih.png" alt="JACOS Logo" width={140} height={40} className="hidden dark:block object-contain" />
        </Link>
      </div>

      <div className="flex-1 px-4 py-6 overflow-y-auto space-y-1.5">
        <p className="px-4 text-sm font-bold text-ink-300 uppercase tracking-wider mb-4">Menu Utama</p>
        
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                active 
                  ? "bg-sky-50 text-sky font-bold" 
                  : "text-ink-400 hover:bg-cloud hover:text-ink font-semibold"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? item.bgColor + " " + item.color : "bg-white border border-ink/10 text-ink-400"}`}>
                <item.icon size={15} />
              </div>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-ink/5">
        <Link href="/management/pengaturan" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-ink-400 hover:bg-cloud hover:text-ink font-semibold transition-all">
          <Settings size={18} />
          <span className="text-md">Pengaturan</span>
        </Link>
        <button 
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-coral hover:bg-coral-50 hover:text-coral-600 font-semibold transition-all mt-1 cursor-pointer"
        >
          <LogOut size={18} />
          <span className="text-md">Keluar</span>
        </button>
      </div>
    </aside>
  );
}
