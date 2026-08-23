"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User, BookOpen, Megaphone, Car, Receipt, PiggyBank, Settings, LogOut } from "lucide-react";

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

const MENU_GROUPS: MenuGroup[] = [
  {
    title: "Menu Utama",
    items: [
      { href: "/parent-portal", label: "Dashboard", icon: LayoutDashboard, color: "text-sky", bgColor: "bg-sky-50" },
    ],
  },
  {
    title: "Kesiswaan",
    items: [
      { href: "/parent-portal/profil-siswa", label: "Profil Siswa", icon: User, color: "text-leaf", bgColor: "bg-leaf-50" },
      { href: "/parent-portal/classroom", label: "Classroom", icon: BookOpen, color: "text-gold", bgColor: "bg-gold-50" },
      { href: "/parent-portal/informasi", label: "Informasi & Kegiatan", icon: Megaphone, color: "text-coral", bgColor: "bg-coral-50" },
      { href: "/parent-portal/penjemputan", label: "Penjemputan", icon: Car, color: "text-purple-600", bgColor: "bg-purple-50" },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/parent-portal/finance", label: "Keuangan & SPP", icon: Receipt, color: "text-sky-600", bgColor: "bg-sky-50" },
      { href: "/parent-portal/tabungan", label: "Tabungan Siswa", icon: PiggyBank, color: "text-emerald-600", bgColor: "bg-emerald-50" },
    ],
  },
];

export function ParentSidebar({ onLogout }: { onLogout?: () => void }) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/parent-portal") return pathname === path;
    return pathname.startsWith(path);
  };

  return (
    <aside className="hidden lg:flex w-82 bg-white border-r border-ink/10 flex-col h-screen sticky top-0 shrink-0">
      <div className="px-8 py-8 border-b border-ink/5">
        <Link href="/parent-portal" className="flex items-center gap-2.5">
          <Image src="/publicjacos/logo.png" alt="JACOS Logo" width={150} height={40} className="dark:hidden object-contain" />
          <Image src="/publicjacos/logoputih.png" alt="JACOS Logo" width={140} height={40} className="hidden dark:block object-contain" />
        </Link>
      </div>

      <div className="flex-1 px-4 py-6 overflow-y-auto space-y-6">
        {MENU_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1.5">
            <p className="px-4 text-xs font-bold text-ink-300 uppercase tracking-wider mb-2">{group.title}</p>
            {group.items.map((item) => {
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
                    <item.icon size={18} />
                  </div>
                  <span className="text-sm font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-ink/5">
        <Link href="/parent-portal/settings" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-ink-400 hover:bg-cloud hover:text-ink font-semibold transition-all">
          <Settings size={18} />
          <span className="text-md">Pengaturan</span>
        </Link>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-coral hover:bg-coral-50 hover:text-coral-600 font-semibold transition-all mt-1"
        >
          <LogOut size={18} />
          <span className="text-md">Keluar</span>
        </button>
      </div>
    </aside>
  );
}
