"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BookOpen, 
  Car, 
  Megaphone, 
  Receipt,
  Sparkles
} from "lucide-react";

interface BottomNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isCenter?: boolean;
}

const NAV_ITEMS: BottomNavItem[] = [
  {
    href: "/parent-portal",
    label: "Home",
    icon: LayoutDashboard,
  },
  {
    href: "/parent-portal/classroom",
    label: "Classroom",
    icon: BookOpen,
  },
  {
    href: "/parent-portal/penjemputan",
    label: "Penjemputan",
    icon: Car,
    isCenter: true,
  },
  {
    href: "/parent-portal/informasi",
    label: "Informasi",
    icon: Megaphone,
  },
  {
    href: "/parent-portal/finance",
    label: "Keuangan",
    icon: Receipt,
  },
];

export function ParentBottomNav() {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === "/parent-portal") {
      return pathname === "/parent-portal";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))] px-3 sm:px-6">
      <nav 
        aria-label="Navigasi Utama Mobile"
        className="pointer-events-auto relative max-w-md mx-auto bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_12px_40px_rgba(22,35,61,0.12),0_2px_6px_rgba(0,0,0,0.04)] rounded-[2.25rem] px-2 py-1.5 before:absolute before:inset-x-8 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-sky/30 before:to-transparent"
      >
        <div className="grid grid-cols-5 items-center">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item.href);
            const Icon = item.icon;

            if (item.isCenter) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative flex flex-col items-center justify-center -mt-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 rounded-3xl"
                  aria-label={item.label}
                >
                  <div className="p-1 rounded-2xl bg-white/95 shadow-md ring-1 ring-ink/5 transition-transform duration-200 group-active:scale-90">
                    <div 
                      className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-white transition-all duration-300 ${
                        active 
                          ? "bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-500 shadow-[0_8px_24px_rgba(124,58,237,0.45)] ring-2 ring-purple-300/80 scale-105" 
                          : "bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-[0_6px_18px_rgba(124,58,237,0.3)] hover:brightness-105"
                      }`}
                    >
                      <Icon size={22} className={`transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-105"}`} />
                      {active && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white shadow-xs animate-ping" />
                      )}
                    </div>
                  </div>
                  <span 
                    className={`text-[10px] font-bold mt-1 tracking-tight transition-all duration-200 ${
                      active ? "text-purple-700 scale-105" : "text-ink-400 group-hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative flex flex-col items-center justify-center py-1 px-0.5 min-h-[48px] rounded-2xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky active:scale-95"
                aria-label={item.label}
              >
                <div 
                  className={`relative w-10 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    active 
                      ? "bg-sky-50/90 text-sky shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_8px_rgba(47,111,237,0.12)] scale-105" 
                      : "text-ink-400 group-hover:text-ink group-hover:bg-slate-50/80"
                  }`}
                >
                  <Icon 
                    size={20} 
                    className={`transition-transform duration-300 ${
                      active ? "stroke-[2.5] scale-105" : "stroke-[1.8] group-hover:scale-105"
                    }`} 
                  />
                  {active && (
                    <span className="absolute -bottom-0.5 w-3 h-1 rounded-full bg-sky shadow-[0_0_8px_rgba(47,111,237,0.6)]" />
                  )}
                </div>
                <span 
                  className={`text-[10px] tracking-tight transition-all duration-200 mt-0.5 ${
                    active 
                      ? "font-extrabold text-sky scale-105" 
                      : "font-semibold text-ink-400 group-hover:text-ink"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
