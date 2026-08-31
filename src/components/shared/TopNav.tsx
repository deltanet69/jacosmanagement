"use client";

import {
  Bell,
  Search,
  Menu,
  Settings,
  LogOut,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { logout } from "@/app/(public)/login/actions";
import { ADMIN_MENU_GROUPS, HR_MENU_GROUPS } from "./DashboardSidebar";

export function TopNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
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
    <header className="h-20 sm:h-20 bg-white border-b border-ink/5 px-4 sm:px-6 lg:px-10 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3 sm:gap-4 flex-1">
        {/* Mobile Sidebar via Sheet */}
        <div className="lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="w-10 h-10 flex items-center justify-center rounded-xl border border-ink/10 text-ink-400 hover:bg-cloud transition cursor-pointer">
              <Menu size={20} />
            </SheetTrigger>
            <SheetContent side="left" className="w-140 p-0 flex flex-col bg-white">
              {/* Sheet Header */}
              <div className="px-6 py-5 border-b border-ink/5">
                <Link href="/management" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
                  <Image src="/publicjacos/logo.png" alt="JACOS Logo" width={140} height={38} className="dark:hidden object-contain" />
                  <Image src="/publicjacos/logoputih.png" alt="JACOS Logo" width={130} height={38} className="hidden dark:block object-contain" />
                </Link>
              </div>

              {/* Module Switcher in Mobile Sheet */}
              <div className="px-3 pt-3 pb-1">
                <div className="grid grid-cols-2 p-1 bg-cloud rounded-xl border border-ink/5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveModule("admin")}
                    className={`py-2 rounded-lg transition-all cursor-pointer ${
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
                    className={`py-2 rounded-lg transition-all cursor-pointer ${
                      activeModule === "hr"
                        ? "bg-white text-indigo-600 shadow-xs border border-ink/5 font-bold"
                        : "text-ink-400 hover:text-ink font-semibold"
                    }`}
                  >
                    HR Management
                  </button>
                </div>
              </div>

              {/* Scrollable Groups */}
              <div className="flex-1 px-3 py-3 overflow-y-auto space-y-5">
                {currentGroups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-1">
                    <p className="px-3 text-xs font-bold text-ink-300 uppercase tracking-wider mb-2">
                      {group.title}
                    </p>
                    {group.items.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-sm ${
                            active
                              ? "bg-sky-50 text-sky font-bold"
                              : "text-ink-400 hover:bg-cloud hover:text-ink font-semibold"
                          }`}
                        >
                          <div className="flex items-center gap-3 truncate">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${active ? item.bgColor + " " + item.color : "bg-white border border-ink/10 text-ink-400"}`}>
                              <item.icon size={16} />
                            </div>
                            <span className="truncate">{item.label}</span>
                          </div>
                          {active && <ChevronRight size={14} className="text-sky shrink-0" />}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Sheet Footer */}
              <div className="p-3 border-t border-ink/5">
                <Link
                  href={activeModule === "admin" ? "/management/pengaturan" : "/management/hr/settings"}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-ink-400 hover:bg-cloud hover:text-ink font-semibold transition-all text-sm"
                >
                  <Settings size={16} />
                  <span>Pengaturan</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-coral hover:bg-coral-50 hover:text-coral-600 font-semibold transition-all mt-1 cursor-pointer text-sm"
                >
                  <LogOut size={16} />
                  <span>Keluar</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex relative max-w-md w-full">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300" />
          <Input
            placeholder="Cari siswa, guru, atau pendaftar..."
            className="h-11 pl-11 rounded-xl bg-cloud border-transparent focus-visible:border-sky focus-visible:ring-sky/20 text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Top Right Profile & Notification */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Academic Year & Batch Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-sky-50 text-sky-700 text-[11px] sm:text-xs font-bold border border-sky-200 shadow-2xs shrink-0">
          <Sparkles size={13} className="text-sky-600 shrink-0" />
          <span>TA 2026/2027 • Batch 1</span>
        </div>

        <button className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl hover:bg-cloud transition-colors text-ink-400 cursor-pointer shrink-0">
          <Bell size={22} />
          <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-coral border-2 border-white" />
        </button>

        <div className="h-6 w-px bg-ink/10 hidden sm:block" />

        <div className="flex items-center gap-2.5 cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-xs sm:text-sm font-bold text-ink leading-tight">Admin Sekolah</p>
            <p className="text-[10px] font-semibold text-ink-300 uppercase tracking-wider">Superadmin / TU</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-sky flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-xs shrink-0">
            AD
          </div>
        </div>
      </div>
    </header>
  );
}
