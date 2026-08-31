"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Construction,
  Sparkles,
  Clock,
  CheckCircle2,
  Code2,
  Cpu,
  Layers,
  LayoutDashboard,
  Users,
  UserCheck,
  GraduationCap,
  Receipt,
  CalendarCheck,
  Settings,
  BookOpen,
  Car,
  Megaphone,
  CreditCard,
  Wallet,
  FileText,
  CalendarDays,
  Briefcase,
  ShieldCheck,
  TrendingUp,
  Banknote,
  Lock,
  LucideIcon
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  users: Users,
  sparkles: Sparkles,
  megaphone: Megaphone,
  siswa: GraduationCap,
  classroom: BookOpen,
  absensi: CalendarCheck,
  car: Car,
  keuangan: Receipt,
  "credit-card": CreditCard,
  wallet: Wallet,
  clock: Clock,
  "file-text": FileText,
  "calendar-days": CalendarDays,
  briefcase: Briefcase,
  "shield-check": ShieldCheck,
  settings: Settings,
  "user-check": UserCheck,
  "trending-up": TrendingUp,
  banknote: Banknote,
  lock: Lock,
  construction: Construction,
};

interface UnderDevelopmentProps {
  title: string;
  category: string;
  description?: string;
  iconName?: string;
  expectedFeatures?: string[];
}

export function UnderDevelopment({
  title,
  category,
  description = "Fitur ini sedang dalam tahap perancangan dan sintesis sistem untuk memberikan pengalaman terbaik di JACOS Management Portal.",
  iconName = "construction",
  expectedFeatures = [
    "Integrasi data terpusat real-time dengan audit log",
    "Laporan analitik & rekapitulasi yang dapat diunduh (PDF/Excel)",
    "Otorisasi hak akses bertingkat & keamanan terenkripsi",
    "Notifikasi otomatis & sinkronisasi multi-device"
  ],
}: UnderDevelopmentProps) {
  const IconComponent = ICON_MAP[iconName.toLowerCase()] || Construction;

  return (
    <div className="space-y-8 pb-16">
      {/* Category Tag Header */}
      <div className="flex items-center gap-2.5">
        <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky border border-sky/20">
          {category}
        </span>
        <span className="text-ink-300 text-xs font-bold">•</span>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          Tahap Pengembangan Aktiv
        </span>
      </div>

      {/* Main Playful Modern Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-ink/10 p-6 sm:p-10 shadow-xs">
        {/* Soft Background Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-sky-100/60 via-purple-50/40 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-gradient-to-tr from-emerald-50/50 to-transparent rounded-full blur-2xl -z-10 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Text & Hero Badges */}
          <div className="lg:col-span-7 space-y-6">
            {/* Playful Feature Status Pills */}
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-sky">
                [ THIS FEATURE IS ]
              </p>
              <h1 className="text-3xl sm:text-5xl font-black text-ink tracking-tight leading-none">
                [ UNDER DEVELOPMENT ]
              </h1>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky border border-sky/20 flex items-center justify-center shrink-0 shadow-xs">
                <IconComponent size={24} />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-ink leading-tight">
                {title}
              </h2>
            </div>

            <p className="text-sm sm:text-base text-ink-400 leading-relaxed max-w-xl">
              {description}
            </p>

            {/* Micro Progress Widgets */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-cloud/70 border border-ink/5 space-y-1">
                <div className="flex items-center gap-1.5 text-ink-400 text-xs font-semibold">
                  <Code2 size={14} className="text-sky" />
                  <span>UI & Schema</span>
                </div>
                <p className="text-sm font-extrabold text-ink">100% Ready</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-cloud/70 border border-ink/5 space-y-1">
                <div className="flex items-center gap-1.5 text-ink-400 text-xs font-semibold">
                  <Cpu size={14} className="text-amber-500" />
                  <span>API Services</span>
                </div>
                <p className="text-sm font-extrabold text-amber-600">In Progress</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-cloud/70 border border-ink/5 space-y-1 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1.5 text-ink-400 text-xs font-semibold">
                  <Layers size={14} className="text-leaf" />
                  <span>Target Release</span>
                </div>
                <p className="text-sm font-extrabold text-leaf">Phase 2.1</p>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <Link
                href="/management"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-ink text-white font-bold text-sm hover:bg-ink/90 active:scale-[0.98] transition-all shadow-md shrink-0 cursor-pointer"
              >
                <ArrowLeft size={18} />
                <span>Kembali ke Dashboard Utama</span>
              </Link>
            </div>
          </div>

          {/* Right Column: 3D Coding Illustration Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md aspect-4/3 rounded-3xl overflow-hidden border border-white/60 shadow-xl group">
              <Image
                src="/illustrations/3d_coding_illustration.jpg"
                alt="3D Coding Under Development Illustration"
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-white/40 flex items-center justify-between text-xs font-bold text-ink shadow-sm">
                <span className="flex items-center gap-2">
                  <Sparkles size={14} className="text-gold-600" />
                  <span>Interactive 3D Preview</span>
                </span>
                <span className="text-sky font-semibold">JACOS Tech</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Playful & Informative Roadmap Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-white border border-ink/10 p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-50 text-gold-600 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">Fitur Utama Yang Direncanakan</h3>
              <p className="text-xs text-ink-300">Rencana alur kerja & kapabilitas modul</p>
            </div>
          </div>

          <ul className="space-y-3 pt-2">
            {expectedFeatures.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-ink-400">
                <CheckCircle2 size={16} className="text-leaf shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl bg-white border border-ink/10 p-6 sm:p-8 space-y-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-coral-50 text-coral flex items-center justify-center">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">Siklus Pengerjaan System</h3>
                <p className="text-xs text-ink-300">Progres terkini pengisian data & modul</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-cloud/60 border border-ink/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-ink">
                  <span>Desain UI & Layout Switcher</span>
                  <span className="text-sky font-bold">100% Selesai</span>
                </div>
                <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-ink/5">
                  <div className="w-full h-full bg-sky rounded-full" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-cloud/60 border border-ink/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-ink">
                  <span>Backend Integration & Database</span>
                  <span className="text-amber-600 font-bold">Tahap Pengerjaan</span>
                </div>
                <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-ink/5">
                  <div className="w-3/5 h-full bg-amber-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-ink/5 text-xs text-ink-300 flex items-center justify-between">
            <span>JACOS Portal System Architecture</span>
            <span className="font-bold text-ink">v2.1 Stable</span>
          </div>
        </div>
      </div>
    </div>
  );
}
