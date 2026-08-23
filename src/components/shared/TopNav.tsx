"use client";

import { Bell, Search, Menu, LayoutDashboard, Users, UserCheck, GraduationCap, Receipt, CalendarCheck, Settings, LogOut, BookOpen, Car } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/management", label: "Beranda", icon: LayoutDashboard, color: "text-sky", bgColor: "bg-sky-50" },
  { href: "/management/admisi", label: "Online Admission", icon: Users, color: "text-coral", bgColor: "bg-coral-50" },
  { href: "/management/siswa", label: "Data Siswa", icon: GraduationCap, color: "text-leaf", bgColor: "bg-leaf-50" },
  { href: "/management/guru", label: "Data Guru", icon: UserCheck, color: "text-gold", bgColor: "bg-gold-50" },
  { href: "/management/classroom", label: "Classroom", icon: BookOpen, color: "text-sky", bgColor: "bg-sky-50" },
  { href: "/management/absensi/penjemputan", label: "Penjemputan Siswa", icon: Car, color: "text-purple-600", bgColor: "bg-purple-50" },
  { href: "/management/keuangan", label: "Keuangan & SPP", icon: Receipt, color: "text-sky-600", bgColor: "bg-sky-50" },
  { href: "/management/absensi", label: "Rekap Absensi", icon: CalendarCheck, color: "text-coral-600", bgColor: "bg-coral-50" },
];

export function TopNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/management") return pathname === path;
    return pathname.startsWith(path);
  };

  return (
    <header className="h-20 bg-white border-b border-ink/5 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Sidebar via Sheet */}
        <div className="lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="w-10 h-10 flex items-center justify-center rounded-xl border border-ink/10 text-ink-400">
              <Menu size={20} />
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 flex flex-col bg-white">
              <div className="px-8 py-8 border-b border-ink/5">
                <Link href="/management" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
                  <Image src="/publicjacos/logo.png" alt="JACOS Logo" width={150} height={40} className="dark:hidden object-contain" />
                  <Image src="/publicjacos/logoputih.png" alt="JACOS Logo" width={140} height={40} className="hidden dark:block object-contain" />
                </Link>
              </div>

              <div className="flex-1 px-4 py-6 overflow-y-auto space-y-1.5">
                <p className="px-4 text-md font-bold text-ink-300 uppercase tracking-wider mb-4">Menu Utama</p>
                
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                        active 
                          ? "bg-sky-50 text-sky font-bold" 
                          : "text-ink-400 hover:bg-cloud hover:text-ink font-semibold"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${active ? item.bgColor + " " + item.color : "bg-white border border-ink/10 text-ink-400"}`}>
                        <item.icon size={18} />
                      </div>
                      <span className="text-md">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="p-4 border-t border-ink/5">
                <Link href="/management/pengaturan" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-ink-400 hover:bg-cloud hover:text-ink font-semibold transition-all">
                  <Settings size={18} />
                  <span className="text-md">Pengaturan</span>
                </Link>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-coral hover:bg-coral-50 hover:text-coral-600 font-semibold transition-all mt-1">
                  <LogOut size={18} />
                  <span className="text-md">Keluar</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="hidden md:flex relative max-w-md w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300" />
          <Input 
            placeholder="Cari siswa, guru, atau tagihan..." 
            className="h-12 pl-12 rounded-2xl bg-cloud border-transparent focus-visible:border-sky focus-visible:ring-sky/20"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-5">
        <button className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-cloud transition-colors text-ink-400">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-coral border-2 border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-ink/10 hidden sm:block"></div>
        
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-ink">Admin Sekolah</p>
            <p className="text-[11px] font-semibold text-ink-300 uppercase tracking-wider">Tata Usaha</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
            AD
          </div>
        </div>
      </div>
    </header>
  );
}
