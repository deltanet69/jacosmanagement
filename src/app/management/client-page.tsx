"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  UserCheck,
  Receipt,
  Car,
  QrCode,
  Megaphone,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Plus,
  Tv,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAdminDashboardData, DashboardData } from "./actions";

export default function DashboardClient({
  initialData,
}: {
  initialData: DashboardData;
}) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setIsRefreshing(true);
      const result = await getAdminDashboardData();
      setData(result);
    } catch (err) {
      console.error("Error loading dashboard:", err);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ENROLLED":
      case "ACCEPTED":
        return {
          bg: "bg-leaf-50 text-leaf-700 border-leaf-200",
          label: "Diterima (Enrolled)",
        };
      case "REJECTED":
        return {
          bg: "bg-coral-50 text-coral-600 border-coral-200",
          label: "Ditolak",
        };
      default:
        return {
          bg: "bg-gold-50 text-gold-700 border-gold-200",
          label: "Menunggu Review",
        };
    }
  };

  const getProgramLabel = (prog: string) => {
    if (prog === "PRESCHOOL") return "Preschool";
    if (prog === "KINDERGARTEN") return "Kindergarten";
    if (prog === "PRIMARY_SCHOOL") return "Primary School";
    return prog || "Primary School";
  };

  const d = data || {
    students: { total: 0, preschool: 0, kindergarten: 0, primary: 0 },
    admissions: {
      total: 0,
      pending: 0,
      enrolled: 0,
      rejected: 0,
      activeBatch: "BATCH_1",
      activeBatchLabel: "Batch 1",
      recentApplicants: [],
    },
    teachers: { total: 0, presentToday: 0, attendanceRate: 0, todayLogs: [] },
    pickups: { totalToday: 0, waitingCount: 0, completedCount: 0, activeQueue: [] },
    announcements: [],
    classroomsCount: 0,
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-14 w-full">
      {/* ========================================================================= */}
      {/* 1. WELCOME HEADER & ACTIONS */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">
            Selamat Datang di Management Dashboard
          </h1>
          <p className="text-ink-400 text-xs sm:text-sm">
            Dashboard overview operasional harian Jakarta Cosmopolite Islamic School.
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

          <Link href="/management/informasi/tambah">
            <Button className="h-10 sm:h-11 px-4 sm:px-5 rounded-xl sm:rounded-2xl bg-ink hover:bg-ink/90 text-white font-bold text-xs shadow-md cursor-pointer">
              <Plus size={14} className="mr-1.5" /> Buat Pengumuman
            </Button>
          </Link>

          <Link href="/penjemputan-app" target="_blank">
            <Button
              variant="outline"
              className="h-10 sm:h-11 px-3.5 sm:px-4 rounded-xl sm:rounded-2xl bg-white border-purple-200 text-purple-700 hover:bg-purple-50 font-bold text-xs shadow-2xs cursor-pointer"
            >
              <Tv size={14} className="mr-1.5" /> TV Lobby
              <ExternalLink size={12} className="ml-1 text-purple-400" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PRIMARY METRICS CARDS (4 MASTER KPIs - STANDOUT & CLEAN) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Total Siswa Aktif */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/3 to-white p-5 sm:p-6 rounded-[2rem] border border-emerald-200/80 shadow-[0_4px_24px_rgba(16,185,129,0.06)] hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-400 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
          <GraduationCap className="absolute -right-4 -bottom-4 w-32 h-32 text-emerald-600/5 pointer-events-none group-hover:scale-110 transition-transform duration-500" />
          
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider bg-emerald-100/70 px-2.5 py-1 rounded-xl">
                Total Siswa Aktif
              </span>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0 group-hover:scale-105 transition-transform">
                <GraduationCap size={20} />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <p className="font-display text-3xl sm:text-4xl font-black text-ink">{d.students.total}</p>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  Terdaftar
                </span>
              </div>
              
              {/* Distribution Mini Pills */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px] font-bold">
                <span className="bg-white/80 border border-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-lg shadow-2xs">
                  PS: {d.students.preschool}
                </span>
                <span className="bg-white/80 border border-teal-200/60 text-teal-800 px-2 py-0.5 rounded-lg shadow-2xs">
                  TK: {d.students.kindergarten}
                </span>
                <span className="bg-white/80 border border-sky-200/60 text-sky-800 px-2 py-0.5 rounded-lg shadow-2xs">
                  SD: {d.students.primary}
                </span>
              </div>

              {/* Visual Distribution Ratio Bar */}
              <div className="w-full bg-emerald-100/60 h-1.5 rounded-full overflow-hidden mt-3 flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{
                    width: `${d.students.total > 0 ? (d.students.preschool / d.students.total) * 100 : 33}%`,
                  }}
                  title={`Preschool: ${d.students.preschool}`}
                />
                <div
                  className="bg-teal-400 h-full transition-all duration-500"
                  style={{
                    width: `${d.students.total > 0 ? (d.students.kindergarten / d.students.total) * 100 : 33}%`,
                  }}
                  title={`Kindergarten: ${d.students.kindergarten}`}
                />
                <div
                  className="bg-sky-400 h-full transition-all duration-500"
                  style={{
                    width: `${d.students.total > 0 ? (d.students.primary / d.students.total) * 100 : 34}%`,
                  }}
                  title={`Primary: ${d.students.primary}`}
                />
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-3 mt-3 border-t border-emerald-100 flex items-center justify-between text-xs">
            <span className="text-ink-400 text-[11px] font-medium">Data Siswa</span>
            <Link
              href="/management/siswa"
              className="font-extrabold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              Kelola Siswa <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* KPI 2: Online Admission */}
        <div className="bg-gradient-to-br from-rose-500/10 via-amber-500/3 to-white p-5 sm:p-6 rounded-[2rem] border border-rose-200/80 shadow-[0_4px_24px_rgba(244,63,94,0.06)] hover:shadow-xl hover:shadow-rose-500/10 hover:border-rose-400 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
          <Users className="absolute -right-4 -bottom-4 w-32 h-32 text-rose-600/5 pointer-events-none group-hover:scale-110 transition-transform duration-500" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-rose-800 uppercase tracking-wider bg-rose-100/70 px-2.5 py-1 rounded-xl">
                Online Admission
              </span>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 text-white flex items-center justify-center shadow-md shadow-rose-500/25 shrink-0 group-hover:scale-105 transition-transform">
                <Users size={20} />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <p className="font-display text-3xl sm:text-4xl font-black text-ink">{d.admissions.total}</p>
                {d.admissions.pending > 0 ? (
                  <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300 animate-pulse">
                    {d.admissions.pending} Menunggu Review
                  </span>
                ) : (
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    Semua Terproses
                  </span>
                )}
              </div>

              {/* Distribution Mini Pills */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px] font-bold">
                <span className="bg-white/80 border border-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-lg shadow-2xs">
                  {d.admissions.enrolled} Diterima
                </span>
                <span className="bg-white/80 border border-rose-200/60 text-rose-800 px-2 py-0.5 rounded-lg shadow-2xs">
                  {d.admissions.activeBatchLabel}
                </span>
              </div>

              {/* Visual Admission Ratio Bar */}
              <div className="w-full bg-rose-100/60 h-1.5 rounded-full overflow-hidden mt-3 flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{
                    width: `${d.admissions.total > 0 ? (d.admissions.enrolled / d.admissions.total) * 100 : 0}%`,
                  }}
                  title={`Diterima: ${d.admissions.enrolled}`}
                />
                <div
                  className="bg-amber-400 h-full transition-all duration-500"
                  style={{
                    width: `${d.admissions.total > 0 ? (d.admissions.pending / d.admissions.total) * 100 : 100}%`,
                  }}
                  title={`Menunggu: ${d.admissions.pending}`}
                />
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-3 mt-3 border-t border-rose-100 flex items-center justify-between text-xs">
            <span className="text-ink-400 text-[11px] font-medium">Review Pendaftar</span>
            <Link
              href="/management/admisi"
              className="font-extrabold text-rose-700 hover:text-rose-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              Buka Admisi <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* KPI 3: Penjemputan Hari Ini */}
        <div className="bg-gradient-to-br from-purple-500/10 via-violet-500/3 to-white p-5 sm:p-6 rounded-[2rem] border border-purple-200/80 shadow-[0_4px_24px_rgba(168,85,247,0.06)] hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-400 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
          <Car className="absolute -right-4 -bottom-4 w-32 h-32 text-purple-600/5 pointer-events-none group-hover:scale-110 transition-transform duration-500" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-purple-800 uppercase tracking-wider bg-purple-100/70 px-2.5 py-1 rounded-xl">
                Penjemputan Hari Ini
              </span>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-violet-400 text-white flex items-center justify-center shadow-md shadow-purple-500/25 shrink-0 group-hover:scale-105 transition-transform">
                <Car size={20} />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <p className="font-display text-3xl sm:text-4xl font-black text-ink">{d.pickups.totalToday}</p>
                {d.pickups.waitingCount > 0 ? (
                  <span className="text-xs font-extrabold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-lg border border-purple-300 animate-pulse">
                    {d.pickups.waitingCount} Antri
                  </span>
                ) : (
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    Semua Selesai
                  </span>
                )}
              </div>

              {/* Details breakdown */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px] font-bold">
                <span className="bg-white/80 border border-purple-200/60 text-purple-800 px-2 py-0.5 rounded-lg shadow-2xs">
                  {d.pickups.completedCount} Diserahkan
                </span>
              </div>

              {/* Visual Pickup Progress Bar */}
              <div className="w-full bg-purple-100/60 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-gradient-to-r from-purple-600 to-violet-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${d.pickups.totalToday > 0 ? (d.pickups.completedCount / d.pickups.totalToday) * 100 : 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-3 mt-3 border-t border-purple-100 flex items-center justify-between text-xs">
            <span className="text-ink-400 text-[11px] font-medium">Papan Penjemputan</span>
            <Link
              href="/management/absensi/penjemputan"
              className="font-extrabold text-purple-700 hover:text-purple-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              Papan Antrian <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* KPI 4: Kehadiran Guru */}
        <div className="bg-gradient-to-br from-sky-500/10 via-blue-500/3 to-white p-5 sm:p-6 rounded-[2rem] border border-sky-200/80 shadow-[0_4px_24px_rgba(14,165,233,0.06)] hover:shadow-xl hover:shadow-sky-500/10 hover:border-sky-400 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
          <UserCheck className="absolute -right-4 -bottom-4 w-32 h-32 text-sky-600/5 pointer-events-none group-hover:scale-110 transition-transform duration-500" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-sky-800 uppercase tracking-wider bg-sky-100/70 px-2.5 py-1 rounded-xl">
                Kehadiran Guru
              </span>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-400 text-white flex items-center justify-center shadow-md shadow-sky-500/25 shrink-0 group-hover:scale-105 transition-transform">
                <UserCheck size={20} />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <p className="font-display text-3xl sm:text-4xl font-black text-ink">{d.teachers.presentToday}</p>
                <span className="text-xs font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
                  / {d.teachers.total} Guru ({d.teachers.attendanceRate}%)
                </span>
              </div>

              <p className="text-[11px] font-bold text-sky-800 mt-2.5">
                Tingkat kehadiran: {d.teachers.attendanceRate}% hari ini
              </p>

              {/* Visual Rate Progress Bar */}
              <div className="w-full bg-sky-100/60 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-gradient-to-r from-sky-600 to-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, d.teachers.attendanceRate)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-3 mt-3 border-t border-sky-100 flex items-center justify-between text-xs">
            <span className="text-ink-400 text-[11px] font-medium">Rekap Presensi</span>
            <Link
              href="/management/absensi"
              className="font-extrabold text-sky-700 hover:text-sky-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
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
        {/* ===== LEFT COLUMN: ADMISSIONS & PICKUP (2 COLS) ===== */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          {/* Pendaftar Admisi Terbaru */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-ink/5 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-ink/5">
              <div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-ink">Pendaftar Online Admission Terbaru</h3>
                <p className="text-xs text-ink-400 mt-0.5">
                  Calon siswa baru yang mendaftar melalui sistem Online Admission
                </p>
              </div>
              <Link
                href="/management/admisi"
                className="inline-flex items-center gap-1 text-xs font-bold text-sky hover:underline shrink-0"
              >
                Lihat Semua ({d.admissions.total}) <ArrowRight size={13} />
              </Link>
            </div>

            {d.admissions.recentApplicants.length === 0 ? (
              <div className="py-8 text-center text-ink-400 text-xs bg-cloud/50 rounded-2xl border border-dashed border-ink/10">
                Belum ada data pendaftar baru.
              </div>
            ) : (
              <div className="space-y-2.5">
                {d.admissions.recentApplicants.map((applicant) => {
                  const badge = getStatusBadge(applicant.status);

                  return (
                    <Link
                      key={applicant.id}
                      href={`/management/admisi/${applicant.id}`}
                      className="p-3.5 sm:p-4 rounded-2xl bg-cloud/40 hover:bg-cloud/90 border border-ink/5 hover:border-sky/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky border border-sky-100 flex items-center justify-center font-display font-black text-xs shrink-0">
                          {applicant.student_name?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-ink group-hover:text-sky transition-colors truncate">
                            {applicant.student_name}
                          </p>
                          <p className="text-xs text-ink-400 mt-0.5">
                            {getProgramLabel(applicant.program)} • No:{" "}
                            <span className="font-mono text-ink">{applicant.registration_no}</span>
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
                          {formatDate(applicant.created_at)}
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

          {/* Live Monitor Antrian Penjemputan Siswa */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-ink/5 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-ink/5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Car size={18} />
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-ink">Antrian Penjemputan Live</h3>
                  <p className="text-xs text-ink-400 mt-0.5">Status panggilan siswa di lobby saat ini</p>
                </div>
              </div>
              <Link
                href="/management/absensi/penjemputan"
                className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:underline shrink-0"
              >
                Papan Lengkap <ArrowRight size={13} />
              </Link>
            </div>

            {d.pickups.activeQueue.length === 0 ? (
              <div className="py-8 text-center bg-cloud/50 rounded-2xl border border-dashed border-ink/10 space-y-1.5">
                <p className="font-bold text-sm text-ink">Lobby Tertib — Tidak Ada Antrian</p>
                <p className="text-xs text-ink-400 max-w-xs mx-auto">
                  Semua siswa sudah dijemput atau belum ada scan QR baru dari orang tua.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {d.pickups.activeQueue.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-cloud/50 border border-ink/5 flex items-start gap-3"
                  >
                    <span className="w-7 h-7 rounded-xl bg-ink text-white flex items-center justify-center font-display font-bold text-xs shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs sm:text-sm text-ink truncate">{item.student_name}</p>
                      <p className="text-[11px] font-semibold text-sky-700 mt-0.5">{item.class_name}</p>
                      <p className="text-[11px] text-ink-400 mt-0.5 truncate">
                        Dijemput: <span className="font-bold text-ink">{item.picker_name}</span> ({item.picker_relation})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===== RIGHT COLUMN: TEACHER ATTENDANCE & ANNOUNCEMENTS (1 COL) ===== */}
        <div className="space-y-5 sm:space-y-6">
          {/* Absensi Guru Hari Ini */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-ink/5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-ink/5">
              <h3 className="font-display text-base sm:text-lg font-bold text-ink">Absensi Guru Hari Ini</h3>
              <span className="text-xs font-bold text-leaf-600 bg-leaf-50 px-2.5 py-0.5 rounded-full">
                {d.teachers.presentToday} Hadir
              </span>
            </div>

            {d.teachers.todayLogs.length === 0 ? (
              <p className="text-xs text-ink-400 text-center py-6">Belum ada absensi guru hari ini.</p>
            ) : (
              <div className="space-y-2.5">
                {d.teachers.todayLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-cloud/40 border border-ink/5 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-gold-50 text-gold flex items-center justify-center font-bold text-xs shrink-0">
                        {log.teacher_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-ink truncate">{log.teacher_name}</p>
                        <p className="text-[11px] text-ink-400 font-mono">Masuk: {log.check_in_time}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-leaf-50 text-leaf-700 shrink-0">
                      Hadir
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
                Lihat Rekap Absensi Staf
              </Button>
            </Link>
          </div>

          {/* Informasi & Kegiatan Sekolah Terbaru */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-ink/5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-ink/5">
              <div className="flex items-center gap-2">
                <Megaphone size={16} className="text-coral" />
                <h3 className="font-display text-base sm:text-lg font-bold text-ink">Informasi Terbaru</h3>
              </div>
              <Link href="/management/informasi" className="text-xs font-bold text-sky hover:underline">
                Kelola
              </Link>
            </div>

            {d.announcements.length === 0 ? (
              <p className="text-xs text-ink-400 text-center py-6">Belum ada pengumuman diterbitkan.</p>
            ) : (
              <div className="space-y-2.5">
                {d.announcements.map((ann) => (
                  <Link
                    key={ann.id}
                    href="/management/informasi"
                    className="block p-3 rounded-2xl bg-cloud/40 hover:bg-sky-50/50 border border-ink/5 transition text-xs space-y-1 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold bg-coral-50 text-coral px-2 py-0.5 rounded-md uppercase">
                        {ann.category}
                      </span>
                      <span className="text-[10px] text-ink-300">{formatDate(ann.created_at)}</span>
                    </div>
                    <p className="font-bold text-ink leading-snug line-clamp-2">{ann.title}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
