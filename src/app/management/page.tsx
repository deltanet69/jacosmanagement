"use client";

import { Users, GraduationCap, UserCheck, Wallet, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATS = [
  { label: "Total Pendaftar PPDB", value: "128", trend: "+12% minggu ini", icon: Users, color: "text-sky", bg: "bg-sky-50" },
  { label: "Siswa Aktif", value: "450", trend: "Konstan", icon: GraduationCap, color: "text-leaf", bg: "bg-leaf-50" },
  { label: "Total Guru", value: "32", trend: "1 izin hari ini", icon: UserCheck, color: "text-gold", bg: "bg-gold-50" },
  { label: "Pendapatan SPP (Bulan Ini)", value: "Rp 120.5M", trend: "85% dari target", icon: Wallet, color: "text-coral", bg: "bg-coral-50" },
];

export default function DashboardOverview() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Selamat Datang, Admin! 👋</h1>
          <p className="text-ink-400 mt-1">Berikut ringkasan operasional JACOS hari ini.</p>
        </div>
        <Button className="hidden sm:flex items-center gap-2 bg-ink text-white font-bold px-6 py-5 rounded-2xl shadow-lg shadow-ink/20">
          Buat Pengumuman <ArrowUpRight size={18} />
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-ink/5 hover:-translate-y-1 transition-transform">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <p className="text-sm font-bold text-ink-300 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="font-display text-4xl mb-2">{stat.value}</p>
            <p className="text-xs font-semibold text-ink-400 bg-cloud px-3 py-1.5 rounded-full inline-block">{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 border border-ink/5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-bold">Pendaftar PPDB Terbaru</h2>
            <button className="text-sm font-bold text-sky hover:underline">Lihat Semua</button>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center justify-between p-4 rounded-2xl bg-cloud/50 hover:bg-cloud transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-sky-50 text-sky flex items-center justify-center font-bold text-sm">
                    A{item}
                  </div>
                  <div>
                    <p className="font-bold text-sm">Calon Siswa {item}</p>
                    <p className="text-xs text-ink-400">Jalur Primary School</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gold-600 bg-gold-50 px-3 py-1 rounded-full">Menunggu Review</span>
                  <button className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-ink-300 hover:text-sky">→</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-ink/5 shadow-sm">
          <h2 className="font-display text-xl font-bold mb-6">Absensi Guru Hari Ini</h2>
          <div className="space-y-5">
            {[
              { name: "Ust. Ahmad", status: "Hadir", time: "06:45", color: "text-leaf", bg: "bg-leaf-50" },
              { name: "Ms. Sarah", status: "Hadir", time: "06:50", color: "text-leaf", bg: "bg-leaf-50" },
              { name: "Mr. Dedi", status: "Sakit", time: "-", color: "text-coral", bg: "bg-coral-50" },
            ].map((guru, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-ink/5 flex items-center justify-center text-xs font-bold text-ink-400">
                    {guru.name.substring(0,2)}
                  </div>
                  <p className="font-bold text-sm">{guru.name}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${guru.bg} ${guru.color}`}>
                    {guru.status}
                  </span>
                  <p className="text-xs text-ink-400 mt-1">{guru.time}</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-6 rounded-xl border-ink/10 font-bold text-ink-400">
            Lihat Rekap Lengkap
          </Button>
        </div>
      </div>
    </div>
  );
}
