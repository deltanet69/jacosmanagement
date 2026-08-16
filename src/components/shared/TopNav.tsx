"use client";

import { Bell, Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";

export function TopNav() {
  return (
    <header className="h-20 bg-white border-b border-ink/5 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4 flex-1">
        <button className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-ink/10 text-ink-400">
          <Menu size={20} />
        </button>
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
        
        <div className="h-8 w-px bg-ink/10"></div>
        
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-ink">Admin Sekolah</p>
            <p className="text-[11px] font-semibold text-ink-300 uppercase tracking-wider">Tata Usaha</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky flex items-center justify-center text-white font-bold text-sm shadow-sm">
            AD
          </div>
        </div>
      </div>
    </header>
  );
}
