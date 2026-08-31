"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  GraduationCap,
  Receipt,
  CalendarCheck,
  Settings,
  LogOut,
  BookOpen,
  Car,
  Megaphone,
  Sparkles,
  CreditCard,
  Wallet,
  Clock,
  FileText,
  CalendarDays,
  Briefcase,
  ShieldCheck,
  TrendingUp,
  Banknote,
  Lock,
  ChevronRight
} from "lucide-react";
import { logout } from "@/app/(public)/login/actions";

interface NavItem {
  href: string;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
}

interface MenuGroup {
  title: string;
  items: NavItem[];
}

export const ADMIN_MENU_GROUPS: MenuGroup[] = [
  {
    title: "Menu Utama",
    items: [
      { href: "/management", label: "Dashboard", icon: LayoutDashboard, color: "text-sky", bgColor: "bg-sky-50" },
      { href: "/management/admisi", label: "Online Admission", icon: Users, color: "text-coral", bgColor: "bg-coral-50" },
      { href: "/management/openhouse", label: "Openhouse", icon: Sparkles, color: "text-gold-600", bgColor: "bg-gold-50" },
      { href: "/management/informasi", label: "Informasi & Kegiatan", icon: Megaphone, color: "text-purple-600", bgColor: "bg-purple-50" },
    ],
  },
  {
    title: "Kesiswaan",
    items: [
      { href: "/management/siswa", label: "Data Siswa", icon: GraduationCap, color: "text-leaf", bgColor: "bg-leaf-50" },
      { href: "/management/classroom", label: "Classroom", icon: BookOpen, color: "text-sky", bgColor: "bg-sky-50" },
      { href: "/management/absensi", label: "Rekap Absensi Siswa", icon: CalendarCheck, color: "text-coral-600", bgColor: "bg-coral-50" },
      { href: "/management/absensi/penjemputan", label: "Penjemputan Siswa", icon: Car, color: "text-indigo-600", bgColor: "bg-indigo-50" },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/management/keuangan", label: "Keuangan Jacos", icon: Receipt, color: "text-emerald-600", bgColor: "bg-emerald-50" },
      { href: "/management/keuangan/spp", label: "SPP Sekolah", icon: CreditCard, color: "text-sky-600", bgColor: "bg-sky-50" },
      { href: "/management/keuangan/esaldo", label: "eSaldo Jacos", icon: Wallet, color: "text-gold-600", bgColor: "bg-gold-50" },
    ],
  },
  {
    title: "Kepegawaian",
    items: [
      { href: "/management/kepegawaian/rekap-kehadiran", label: "Rekap Kehadiran", icon: Clock, color: "text-amber-600", bgColor: "bg-amber-50" },
      { href: "/management/kepegawaian/reimbursement", label: "Reimbursement", icon: FileText, color: "text-teal-600", bgColor: "bg-teal-50" },
      { href: "/management/kepegawaian/perizinan", label: "Perizinan", icon: CalendarDays, color: "text-rose-600", bgColor: "bg-rose-50" },
      { href: "/management/kepegawaian/overtime", label: "Overtime", icon: Briefcase, color: "text-purple-600", bgColor: "bg-purple-50" },
    ],
  },
  {
    title: "Other",
    items: [
      { href: "/management/user-management", label: "User Management", icon: ShieldCheck, color: "text-indigo-600", bgColor: "bg-indigo-50" },
      { href: "/management/pengaturan", label: "Setting", icon: Settings, color: "text-slate-600", bgColor: "bg-slate-50" },
    ],
  },
];

export const HR_MENU_GROUPS: MenuGroup[] = [
  {
    title: "Menu HR Utama",
    items: [
      { href: "/management/hr", label: "Dashboard Utama HR", icon: LayoutDashboard, color: "text-indigo-600", bgColor: "bg-indigo-50" },
      { href: "/management/hr/pengumuman", label: "Pengumuman HR", icon: Megaphone, color: "text-coral", bgColor: "bg-coral-50" },
    ],
  },
  {
    title: "Kepegawaian",
    items: [
      { href: "/management/guru", label: "Data Guru", icon: UserCheck, color: "text-gold-600", bgColor: "bg-gold-50" },
      { href: "/management/hr/kpi", label: "KPI Staff", icon: TrendingUp, color: "text-emerald-600", bgColor: "bg-emerald-50" },
      { href: "/management/hr/perizinan", label: "Perizinan HR", icon: CalendarDays, color: "text-rose-600", bgColor: "bg-rose-50" },
      { href: "/management/hr/overtime", label: "Overtime Management", icon: Briefcase, color: "text-purple-600", bgColor: "bg-purple-50" },
    ],
  },
  {
    title: "Administrasi",
    items: [
      { href: "/management/hr/payslip", label: "Payslip Management", icon: Banknote, color: "text-leaf", bgColor: "bg-leaf-50" },
      { href: "/management/hr/reimburse", label: "Reimburse HR", icon: FileText, color: "text-teal-600", bgColor: "bg-teal-50" },
      { href: "/management/hr/otorisasi", label: "Otorisasi Staff", icon: Lock, color: "text-sky-600", bgColor: "bg-sky-50" },
    ],
  },
  {
    title: "Menu Umum",
    items: [
      { href: "/management/hr/settings", label: "HR Settings", icon: Settings, color: "text-slate-600", bgColor: "bg-slate-50" },
    ],
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [activeModule, setActiveModule] = useState<"admin" | "hr">("admin");

  useEffect(() => {
    if (pathname.startsWith("/management/hr")) {
      setActiveModule("hr");
    }
  }, [pathname]);

  const isActive = (path: string) => {
    if (path === "/management" || path === "/management/hr") {
      return pathname === path;
    }
    if (path === "/management/absensi") {
      return pathname === "/management/absensi";
    }
    return pathname.startsWith(path);
  };

  const currentGroups = activeModule === "admin" ? ADMIN_MENU_GROUPS : HR_MENU_GROUPS;

  return (
    <aside className="hidden lg:flex w-82 bg-white border-r border-ink/10 flex-col h-screen sticky top-0 shrink-0">
      {/* Brand Header */}
      <div className="px-8 py-6 border-b border-ink/5">
        <Link href="/management" className="flex items-center gap-2.5">
          <Image src="/publicjacos/logo.png" alt="JACOS Logo" width={150} height={40} className="dark:hidden object-contain" />
          <Image src="/publicjacos/logoputih.png" alt="JACOS Logo" width={140} height={40} className="hidden dark:block object-contain" />
        </Link>
      </div>

      {/* Module Switcher Tab */}
      <div className="px-4 pt-4 pb-2">
        <div className="grid grid-cols-2 p-1 bg-cloud rounded-2xl border border-ink/5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveModule("admin")}
            className={`py-2.5 rounded-xl transition-all cursor-pointer ${
              activeModule === "admin"
                ? "bg-white text-sky shadow-xs border border-ink/5 font-bold"
                : "text-ink-400 hover:text-ink font-semibold"
            }`}
          >
            Admin Portal
          </button>
          <button
            type="button"
            onClick={() => setActiveModule("hr")}
            className={`py-2.5 rounded-xl transition-all cursor-pointer ${
              activeModule === "hr"
                ? "bg-white text-indigo-600 shadow-xs border border-ink/5 font-bold"
                : "text-ink-400 hover:text-ink font-semibold"
            }`}
          >
            HR Management
          </button>
        </div>
      </div>

      {/* Scrollable Navigation Groups */}
      <div className="flex-1 px-4 py-4 overflow-y-auto space-y-6">
        {currentGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1.5">
            <p className="px-4 text-xs font-bold text-ink-300 uppercase tracking-wider mb-2">
              {group.title}
            </p>
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all ${
                    active
                      ? "bg-sky-50 text-sky font-bold"
                      : "text-ink-400 hover:bg-cloud hover:text-ink font-semibold"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        active
                          ? item.bgColor + " " + item.color
                          : "bg-white border border-ink/10 text-ink-400"
                      }`}
                    >
                      <item.icon size={18} />
                    </div>
                    <span className="text-sm font-semibold">{item.label}</span>
                  </div>

                  {active && <ChevronRight size={16} className="text-sky" />}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Bottom Actions */}
      <div className="p-4 border-t border-ink/5">
        <Link
          href={activeModule === "admin" ? "/management/pengaturan" : "/management/hr/settings"}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-ink-400 hover:bg-cloud hover:text-ink font-semibold transition-all text-sm"
        >
          <Settings size={18} />
          <span>Pengaturan</span>
        </Link>
        <button
          type="button"
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-coral hover:bg-coral-50 hover:text-coral-600 font-semibold transition-all mt-1 cursor-pointer text-sm"
        >
          <LogOut size={18} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
