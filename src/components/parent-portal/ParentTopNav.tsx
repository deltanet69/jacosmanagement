"use client";

import { Bell, Menu, LayoutDashboard, User, BookOpen, Megaphone, Car, Receipt, PiggyBank, Settings, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

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

export function ParentTopNav() {
  const [userName, setUserName] = useState("Orang Tua");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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

  const isActive = (path: string) => {
    if (path === "/parent-portal") return pathname === path;
    return pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    const isSubdomain = window.location.hostname.startsWith('parent.');
    router.push(isSubdomain ? '/login' : '/parent-portal/login');
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
                <Link href="/parent-portal" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
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
                          onClick={() => setOpen(false)}
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
                <Link href="/parent-portal/settings" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-ink-400 hover:bg-cloud hover:text-ink font-semibold transition-all">
                  <Settings size={18} />
                  <span className="text-md">Pengaturan</span>
                </Link>
                <button 
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-coral hover:bg-coral-50 hover:text-coral-600 font-semibold transition-all mt-1"
                >
                  <LogOut size={18} />
                  <span className="text-md">Keluar</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
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
            <p className="text-sm font-bold text-ink">{userName}</p>
            <p className="text-[11px] font-semibold text-ink-300 uppercase tracking-wider">Parent Portal</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
            {getInitials(userName)}
          </div>
        </div>
      </div>
    </header>
  );
}
