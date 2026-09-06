"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  Briefcase,
  UserCheck,
  CalendarClock,
  Megaphone,
  ArrowRight,
  RefreshCw,
  Plus,
  UserPlus,
  Award,
  AlertTriangle,
  Clock,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getHrDashboardData, HrDashboardData } from "./actions";
import { HrKpiChart } from "@/components/hr/HrKpiChart";

export default function HrDashboardClient({
  initialData,
}: {
  initialData: HrDashboardData;
}) {
  const [data, setData] = useState<HrDashboardData>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setIsRefreshing(true);
      const result = await getHrDashboardData();
      setData(result);
    } catch (err) {
      console.error("Error loading HR dashboard:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDate = (d: string) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatShortDate = (d: string) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  const getLeaveStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED_HR":
      case "APPROVED_HEAD":
        return {
          bg: "bg-leaf-50 text-leaf-700 border-leaf-200",
          label: "Disetujui",
        };
      case "REJECTED":
        return {
          bg: "bg-coral-50 text-coral-600 border-coral-200",
          label: "Ditolak",
        };
      case "CANCELLED":
        return {
          bg: "bg-cloud text-ink-400 border-ink/10",
          label: "Dibatalkan",
        };
      default:
        return {
          bg: "bg-gold-50 text-gold-700 border-gold-200",
          label: "Menunggu Review",
        };
    }
  };

  const d = data || {
    summary: {
      totalEmployees: 0,
      totalActive: 0,
      totalGuru: 0,
      totalStaf: 0,
      totalMale: 0,
      totalFemale: 0,
      probation: 0,
      tetap: 0,
      kontrak: 0,
    },
    attendance: { hadir: 0, sakit: 0, izin: 0, alpha: 0, rate: 0, todayLogs: [] },
    leaves: { pendingCount: 0, approvedCount: 0, recentRequests: [] },
    kpi: { averageScore: 0, departmentScores: [], lowKpiAlerts: [], expiringContracts: [] },
    announcements: [],
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-14 w-full">
      {/* ========================================================================= */}
      {/* 1. WELCOME HEADER & ACTIONS */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">
            Selamat Datang di HR Management
          </h1>
          <p className="text-ink-400 text-xs sm:text-sm">
            Dashboard overview data kepegawaian, presensi staf, pengajuan cuti, dan evaluasi kinerja JACOS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="h-10 sm:h-11 px-3.5 rounded-xl sm:rounded-2xl bg-white border border-ink/10 text-ink-400 hover:text-sky text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin text-sky" : ""} /> Refresh
          </button>

          <Link href="/management/hr/pengumuman/create">
            <Button className="h-10 sm:h-11 px-4 sm:px-5 rounded-xl sm:rounded-2xl bg-ink hover:bg-ink/90 text-white font-bold text-xs shadow-md cursor-pointer">
              <Plus size={14} className="mr-1.5" /> Buat Pengumuman
            </Button>
          </Link>

          <Link href="/management/hr/guru">
            <Button
              variant="outline"
              className="h-10 sm:h-11 px-3.5 sm:px-4 rounded-xl sm:rounded-2xl bg-white border-sky-200 text-sky-700 hover:bg-sky-50 font-bold text-xs shadow-2xs cursor-pointer"
            >
              <UserPlus size={14} className="mr-1.5" /> Kelola Pegawai
            </Button>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PRIMARY METRICS CARDS (4 MASTER KPIs - STANDOUT & CLEAN) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Total Karyawan Aktif */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/3 to-white p-5 sm:p-6 rounded-[2rem] border border-emerald-200/80 shadow-[0_4px_24px_rgba(16,185,129,0.06)] hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-400 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
          <Users className="absolute -right-4 -bottom-4 w-32 h-32 text-emerald-600/5 pointer-events-none group-hover:scale-110 transition-transform duration-500" />
          
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider bg-emerald-100/70 px-2.5 py-1 rounded-xl">
                Total Karyawan Aktif
              </span>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0 group-hover:scale-105 transition-transform">
                <Users size={20} />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <p className="font-display text-3xl sm:text-4xl font-black text-ink">{d.summary.totalActive}</p>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  Aktif
                </span>
              </div>
              
              {/* Distribution Mini Pills */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px] font-bold">
                <span className="bg-white/80 border border-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-lg shadow-2xs">
                  {d.summary.totalGuru} Guru
                </span>
                <span className="bg-white/80 border border-teal-200/60 text-teal-800 px-2 py-0.5 rounded-lg shadow-2xs">
                  {d.summary.totalStaf} Staf
                </span>
                <span className="text-ink-400 text-[10px]">
                  (L: {d.summary.totalMale} / P: {d.summary.totalFemale})
                </span>
              </div>

              {/* Visual Distribution Ratio Bar */}
              <div className="w-full bg-emerald-100/60 h-1.5 rounded-full overflow-hidden mt-3 flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{
                    width: `${d.summary.totalActive > 0 ? (d.summary.totalGuru / d.summary.totalActive) * 100 : 50}%`,
                  }}
                  title={`Guru: ${d.summary.totalGuru}`}
                />
                <div
                  className="bg-teal-400 h-full transition-all duration-500"
                  style={{
                    width: `${d.summary.totalActive > 0 ? (d.summary.totalStaf / d.summary.totalActive) * 100 : 50}%`,
                  }}
                  title={`Staf: ${d.summary.totalStaf}`}
                />
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-3 mt-3 border-t border-emerald-100 flex items-center justify-between text-xs">
            <span className="text-ink-400 text-[11px] font-medium">Data Pegawai</span>
            <Link
              href="/management/hr/guru"
              className="font-extrabold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              Kelola Staf <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* KPI 2: Status Kepegawaian */}
        <div className="bg-gradient-to-br from-sky-500/10 via-blue-500/3 to-white p-5 sm:p-6 rounded-[2rem] border border-sky-200/80 shadow-[0_4px_24px_rgba(14,165,233,0.06)] hover:shadow-xl hover:shadow-sky-500/10 hover:border-sky-400 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
          <Briefcase className="absolute -right-4 -bottom-4 w-32 h-32 text-sky-600/5 pointer-events-none group-hover:scale-110 transition-transform duration-500" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-sky-800 uppercase tracking-wider bg-sky-100/70 px-2.5 py-1 rounded-xl">
                Status Kepegawaian
              </span>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-400 text-white flex items-center justify-center shadow-md shadow-sky-500/25 shrink-0 group-hover:scale-105 transition-transform">
                <Briefcase size={20} />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <p className="font-display text-3xl sm:text-4xl font-black text-ink">{d.summary.tetap}</p>
                <span className="text-xs font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
                  Karyawan Tetap
                </span>
              </div>

              {/* Distribution Mini Pills */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px] font-bold">
                <span className="bg-white/80 border border-sky-200/60 text-sky-800 px-2 py-0.5 rounded-lg shadow-2xs">
                  {d.summary.kontrak} Kontrak (PKWT)
                </span>
                <span className="bg-white/80 border border-blue-200/60 text-blue-800 px-2 py-0.5 rounded-lg shadow-2xs">
                  {d.summary.probation} Probation
                </span>
              </div>

              {/* Visual Stability Ratio Bar */}
              <div className="w-full bg-sky-100/60 h-1.5 rounded-full overflow-hidden mt-3 flex">
                <div
                  className="bg-sky-500 h-full transition-all duration-500"
                  style={{
                    width: `${d.summary.totalActive > 0 ? (d.summary.tetap / d.summary.totalActive) * 100 : 0}%`,
                  }}
                  title={`Tetap: ${d.summary.tetap}`}
                />
                <div
                  className="bg-blue-400 h-full transition-all duration-500"
                  style={{
                    width: `${d.summary.totalActive > 0 ? (d.summary.kontrak / d.summary.totalActive) * 100 : 100}%`,
                  }}
                  title={`Kontrak: ${d.summary.kontrak}`}
                />
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-3 mt-3 border-t border-sky-100 flex items-center justify-between text-xs">
            <span className="text-ink-400 text-[11px] font-medium">Status Kontrak</span>
            <Link
              href="/management/hr/guru"
              className="font-extrabold text-sky-700 hover:text-sky-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              Detail Karyawan <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* KPI 3: Pengajuan Cuti & Izin */}
        <div className={`bg-gradient-to-br from-amber-500/10 via-orange-500/3 to-white p-5 sm:p-6 rounded-[2rem] border shadow-[0_4px_24px_rgba(245,158,11,0.06)] hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group ${
          d.leaves.pendingCount > 0 ? "border-amber-300 ring-1 ring-amber-200/50" : "border-amber-200/80 hover:border-amber-400"
        }`}>
          <CalendarClock className="absolute -right-4 -bottom-4 w-32 h-32 text-amber-600/5 pointer-events-none group-hover:scale-110 transition-transform duration-500" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider bg-amber-100/70 px-2.5 py-1 rounded-xl">
                Pengajuan Cuti & Izin
              </span>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0 group-hover:scale-105 transition-transform">
                <CalendarClock size={20} />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <p className="font-display text-3xl sm:text-4xl font-black text-ink">{d.leaves.pendingCount}</p>
                {d.leaves.pendingCount > 0 ? (
                  <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300 animate-pulse">
                    Perlu Approval
                  </span>
                ) : (
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    Semua Terproses
                  </span>
                )}
              </div>

              {/* Details breakdown */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px] font-bold">
                <span className="bg-white/80 border border-amber-200/60 text-amber-800 px-2 py-0.5 rounded-lg shadow-2xs">
                  {d.leaves.recentRequests.length} Permohonan
                </span>
                <span className="bg-white/80 border border-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-lg shadow-2xs">
                  {d.leaves.approvedCount} Disetujui
                </span>
              </div>

              <p className="text-[10px] text-ink-400 mt-3 font-medium">
                {d.leaves.pendingCount > 0
                  ? "Ada permohonan yang menunggu persetujuan HR"
                  : "Tidak ada antrean approval cuti saat ini"}
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-3 mt-3 border-t border-amber-100 flex items-center justify-between text-xs">
            <span className="text-ink-400 text-[11px] font-medium">Verifikasi Izin</span>
            <Link
              href="/management/hr/perizinan"
              className="font-extrabold text-amber-700 hover:text-amber-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              Buka Perizinan <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* KPI 4: Kehadiran Hari Ini */}
        <div className="bg-gradient-to-br from-violet-500/10 via-purple-500/3 to-white p-5 sm:p-6 rounded-[2rem] border border-violet-200/80 shadow-[0_4px_24px_rgba(139,92,246,0.06)] hover:shadow-xl hover:shadow-violet-500/10 hover:border-violet-400 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
          <UserCheck className="absolute -right-4 -bottom-4 w-32 h-32 text-violet-600/5 pointer-events-none group-hover:scale-110 transition-transform duration-500" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-violet-800 uppercase tracking-wider bg-violet-100/70 px-2.5 py-1 rounded-xl">
                Kehadiran Hari Ini
              </span>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-400 text-white flex items-center justify-center shadow-md shadow-violet-500/25 shrink-0 group-hover:scale-105 transition-transform">
                <UserCheck size={20} />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <p className="font-display text-3xl sm:text-4xl font-black text-ink">{d.attendance.hadir}</p>
                <span className="text-xs font-extrabold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-lg border border-violet-200">
                  / {d.summary.totalActive} Staf ({d.attendance.rate}%)
                </span>
              </div>

              {/* Breakdown chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px] font-bold">
                <span className="bg-white/80 border border-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-lg shadow-2xs">
                  {d.attendance.hadir} Hadir
                </span>
                <span className="bg-white/80 border border-amber-200/60 text-amber-800 px-2 py-0.5 rounded-lg shadow-2xs">
                  {d.attendance.sakit} Sakit
                </span>
                <span className="bg-white/80 border border-sky-200/60 text-sky-800 px-2 py-0.5 rounded-lg shadow-2xs">
                  {d.attendance.izin} Izin
                </span>
                {d.attendance.alpha > 0 && (
                  <span className="bg-white/80 border border-rose-200/60 text-rose-800 px-2 py-0.5 rounded-lg shadow-2xs">
                    {d.attendance.alpha} Alpha
                  </span>
                )}
              </div>

              {/* Visual Rate Progress Bar */}
              <div className="w-full bg-violet-100/60 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-gradient-to-r from-violet-600 to-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, d.attendance.rate)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-3 mt-3 border-t border-violet-100 flex items-center justify-between text-xs">
            <span className="text-ink-400 text-[11px] font-medium">Rekap Presensi</span>
            <Link
              href="/management/absensi"
              className="font-extrabold text-violet-700 hover:text-violet-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              Buka Absensi <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN CONTENT AREA (2 COLUMNS: LEFT 2/3, RIGHT 1/3) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* ===== LEFT COLUMN: LEAVE REQUESTS & KPI CHART (2 COLS) ===== */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          {/* Pengajuan Cuti & Izin Terbaru */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-ink/5 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-ink/5">
              <div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-ink">
                  Pengajuan Cuti & Izin Terbaru
                </h3>
                <p className="text-xs text-ink-400 mt-0.5">
                  Permohonan cuti dan izin yang memerlukan verifikasi atau persetujuan HR
                </p>
              </div>
              <Link
                href="/management/hr/perizinan"
                className="inline-flex items-center gap-1 text-xs font-bold text-sky hover:underline shrink-0"
              >
                Lihat Semua ({d.leaves.pendingCount}) <ArrowRight size={13} />
              </Link>
            </div>

            {d.leaves.recentRequests.length === 0 ? (
              <div className="py-8 text-center text-ink-400 text-xs bg-cloud/50 rounded-2xl border border-dashed border-ink/10">
                Belum ada pengajuan izin atau cuti yang tertunda.
              </div>
            ) : (
              <div className="space-y-2.5">
                {d.leaves.recentRequests.map((req) => {
                  const badge = getLeaveStatusBadge(req.status);

                  return (
                    <Link
                      key={req.id}
                      href="/management/hr/perizinan"
                      className="p-3.5 sm:p-4 rounded-2xl bg-cloud/40 hover:bg-cloud/90 border border-ink/5 hover:border-sky/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center font-display font-black text-xs shrink-0">
                          {req.employeeName?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-ink group-hover:text-sky transition-colors truncate">
                            {req.employeeName}
                          </p>
                          <p className="text-xs text-ink-400 mt-0.5">
                            <span className="font-semibold text-ink-500">{req.leaveType}</span> • {req.totalDays} Hari ({formatShortDate(req.startDate)} - {formatShortDate(req.endDate)})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-xs text-ink-400 font-medium hidden sm:inline-block">
                          {formatDate(req.createdAt)}
                        </span>
                        <div className="w-7 h-7 rounded-xl bg-white shadow-2xs flex items-center justify-center text-ink-300 group-hover:text-sky group-hover:translate-x-0.5 transition">
                          →
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Evaluasi Kinerja (KPI) & Departemen */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-ink/5 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-ink/5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-leaf-50 text-leaf flex items-center justify-center shrink-0">
                  <Award size={18} />
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-ink">
                    Evaluasi Kinerja Departemen (KPI)
                  </h3>
                  <p className="text-xs text-ink-400 mt-0.5">
                    Rata-rata skor performa dan capaian target kerja per divisi
                  </p>
                </div>
              </div>
              <Link
                href="/management/hr/kpi"
                className="inline-flex items-center gap-1 text-xs font-bold text-leaf-700 hover:underline shrink-0"
              >
                Detail KPI <ArrowRight size={13} />
              </Link>
            </div>

            {/* Chart Area */}
            <HrKpiChart data={d.kpi.departmentScores} />

            {/* Quick Metrics Footer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-cloud/40 border border-ink/5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-ink-400 uppercase">Rata-Rata KPI</p>
                  <p className="font-display text-lg font-extrabold text-ink">{d.kpi.averageScore} / 100</p>
                </div>
                <span className="text-xs font-bold text-leaf-600 bg-leaf-50 px-2 py-0.5 rounded-md">
                  Sangat Baik
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-cloud/40 border border-ink/5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-ink-400 uppercase">Divisi Teratas</p>
                  <p className="font-display text-lg font-extrabold text-ink">Guru SMP</p>
                </div>
                <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                  92 Poin
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-cloud/40 border border-ink/5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-ink-400 uppercase">Perlu Perhatian</p>
                  <p className="font-display text-lg font-extrabold text-ink">{d.kpi.lowKpiAlerts.length} Staf</p>
                </div>
                <span className="text-xs font-bold text-coral bg-coral-50 px-2 py-0.5 rounded-md">
                  Skor &lt; 70
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== RIGHT COLUMN: ATTENDANCE, ANNOUNCEMENTS & ALERTS (1 COL) ===== */}
        <div className="space-y-5 sm:space-y-6">
          {/* Absensi Staf Hari Ini */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-ink/5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-ink/5">
              <h3 className="font-display text-base sm:text-lg font-bold text-ink">Presensi Staf Hari Ini</h3>
              <span className="text-xs font-bold text-leaf-600 bg-leaf-50 px-2.5 py-0.5 rounded-full">
                {d.attendance.hadir} Hadir
              </span>
            </div>

            {/* Attendance Mini Boxes */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-2xl bg-leaf-50 border border-leaf-100/60">
                <p className="text-lg font-display font-black text-leaf-700">{d.attendance.hadir}</p>
                <p className="text-[10px] font-bold text-leaf-600 uppercase">Hadir</p>
              </div>
              <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-100/60">
                <p className="text-lg font-display font-black text-amber-700">{d.attendance.sakit}</p>
                <p className="text-[10px] font-bold text-amber-600 uppercase">Sakit</p>
              </div>
              <div className="p-2.5 rounded-2xl bg-sky-50 border border-sky-100/60">
                <p className="text-lg font-display font-black text-sky-700">{d.attendance.izin}</p>
                <p className="text-[10px] font-bold text-sky-600 uppercase">Izin</p>
              </div>
              <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-100/60">
                <p className="text-lg font-display font-black text-rose-700">{d.attendance.alpha}</p>
                <p className="text-[10px] font-bold text-rose-600 uppercase">Alpha</p>
              </div>
            </div>

            {d.attendance.todayLogs.length === 0 ? (
              <p className="text-xs text-ink-400 text-center py-4">Belum ada catatan presensi masuk hari ini.</p>
            ) : (
              <div className="space-y-2">
                {d.attendance.todayLogs.slice(0, 4).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-cloud/40 border border-ink/5 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-gold-50 text-gold flex items-center justify-center font-bold text-xs shrink-0">
                        {log.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-ink truncate">{log.name}</p>
                        <p className="text-[10px] text-ink-400 font-mono">Masuk: {log.time}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-leaf-50 text-leaf-700 shrink-0">
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Link href="/management/absensi" className="block pt-1">
              <Button
                variant="outline"
                className="w-full h-10 rounded-2xl border-ink/15 font-bold text-xs text-ink-400 hover:text-ink hover:bg-cloud cursor-pointer"
              >
                Lihat Rekap Presensi Lengkap
              </Button>
            </Link>
          </div>

          {/* Pengumuman HR Terbaru */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-ink/5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-ink/5">
              <div className="flex items-center gap-2">
                <Megaphone size={16} className="text-coral" />
                <h3 className="font-display text-base sm:text-lg font-bold text-ink">Pengumuman HR</h3>
              </div>
              <Link href="/management/hr/pengumuman" className="text-xs font-bold text-sky hover:underline">
                Kelola
              </Link>
            </div>

            {d.announcements.length === 0 ? (
              <p className="text-xs text-ink-400 text-center py-6">Belum ada pengumuman HR diterbitkan.</p>
            ) : (
              <div className="space-y-2.5">
                {d.announcements.map((ann) => (
                  <Link
                    key={ann.id}
                    href="/management/hr/pengumuman"
                    className="block p-3 rounded-2xl bg-cloud/40 hover:bg-sky-50/50 border border-ink/5 transition text-xs space-y-1 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        ann.category === "PENTING"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : ann.category === "KEBIJAKAN_BARU"
                          ? "bg-sky-50 text-sky-700 border border-sky-200"
                          : ann.category === "INFO_CUTI"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : ann.category === "EVENT"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {ann.category === "KEBIJAKAN_BARU"
                          ? "Kebijakan Baru"
                          : ann.category === "INFO_CUTI"
                          ? "Info Cuti"
                          : ann.category === "EVENT"
                          ? "Event"
                          : ann.category === "PENTING"
                          ? "📌 Penting"
                          : "Umum"}
                      </span>
                      <span className="text-[10px] text-ink-400 font-medium">{formatDate(ann.publishedAt)}</span>
                    </div>
                    <p className="font-bold text-ink leading-snug line-clamp-2">{ann.title}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Peringatan Tindakan & Reminder HR */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-ink/5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-ink/5">
              <AlertTriangle size={16} className="text-amber-500" />
              <h3 className="font-display text-base sm:text-lg font-bold text-ink">Peringatan Sistem HR</h3>
            </div>

            <div className="space-y-2.5 text-xs">
              {d.kpi.expiringContracts.length > 0 && d.kpi.expiringContracts.map((c) => (
                <div key={c.id} className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock size={12} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink">Kontrak Segera Berakhir</p>
                    <p className="text-[11px] text-ink-500 mt-0.5">
                      <span className="font-semibold text-ink">{c.employeeName}</span> ({c.position}) berakhir dlm <span className="font-bold text-amber-700">{c.daysRemaining} hari</span>.
                    </p>
                  </div>
                </div>
              ))}

              {d.kpi.lowKpiAlerts.length > 0 && d.kpi.lowKpiAlerts.map((k) => (
                <div key={k.id} className="p-3 rounded-2xl bg-rose-50/60 border border-rose-200/60 flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle size={12} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-rose-900">Evaluasi KPI Diperlukan</p>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      Skor <span className="font-semibold">{k.employeeName}</span> ({k.score}/100) di bawah standar minimum.
                    </p>
                  </div>
                </div>
              ))}

              {d.kpi.expiringContracts.length === 0 && d.kpi.lowKpiAlerts.length === 0 && (
                <div className="py-4 text-center text-ink-400 text-xs bg-cloud/30 rounded-2xl border border-dashed border-ink/10">
                  Semua status kepegawaian dalam kondisi aman.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
