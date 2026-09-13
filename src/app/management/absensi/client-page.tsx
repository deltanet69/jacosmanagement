"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Edit3,
  Sparkles,
  FileSpreadsheet,
  Check,
  RefreshCw,
  School,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateStudentAttendanceRecord } from "./actions";

interface StudentItem {
  studentId: string;
  studentName: string;
  nis: string;
  profilePicture?: string | null;
  classId?: string | null;
  className: string;
  date: string;
  status: string;
  checkIn?: string | null;
  checkOut?: string | null;
  notes?: string | null;
  method: string;
}

interface ClassItem {
  id: string;
  name?: string;
  grade?: string;
  level?: string;
}

interface ClassStat {
  classId: string;
  className: string;
  total: number;
  hadir: number;
  izin: number;
  sakit: number;
  alpha: number;
}

interface Props {
  initialDate: string;
  initialClassId?: string;
  summary: {
    totalStudents: number;
    totalHadir: number;
    totalIzin: number;
    totalSakit: number;
    totalAlpha: number;
    percentage: number;
  };
  items: StudentItem[];
  classes: ClassItem[];
  classBreakdown: ClassStat[];
}

export function StudentAttendanceClient({
  initialDate,
  initialClassId = "ALL",
  summary,
  items,
  classes,
  classBreakdown,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [filterDate, setFilterDate] = useState(initialDate);
  const [selectedClass, setSelectedClass] = useState(initialClassId);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination States
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [editStatus, setEditStatus] = useState<"HADIR" | "IZIN" | "SAKIT" | "ALPHA">("HADIR");
  const [editNotes, setEditNotes] = useState("");

  // Filtered items logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchClass = selectedClass === "ALL" || item.classId === selectedClass;
      const matchStatus = selectedStatus === "ALL" || item.status === selectedStatus;
      const matchSearch =
        !searchQuery.trim() ||
        item.studentName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        item.nis.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        item.className.toLowerCase().includes(searchQuery.toLowerCase().trim());

      return matchClass && matchStatus && matchSearch;
    });
  }, [items, selectedClass, selectedStatus, searchQuery]);

  // Reset to page 1 on filter/pageSize change
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);

  const startIndex = (activePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredItems.length);
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const handleDateChange = (newDate: string) => {
    setFilterDate(newDate);
    setCurrentPage(1);
    startTransition(() => {
      router.push(`/management/absensi?date=${newDate}&classId=${selectedClass}`);
    });
  };

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setCurrentPage(1);
    startTransition(() => {
      router.push(`/management/absensi?date=${filterDate}&classId=${classId}`);
    });
  };

  const handleOpenEdit = (item: StudentItem) => {
    setEditingStudent(item);
    setEditStatus((item.status as any) || "HADIR");
    setEditNotes(item.notes || "");
  };

  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    startTransition(async () => {
      const res = await updateStudentAttendanceRecord({
        studentId: editingStudent.studentId,
        classId: editingStudent.classId || undefined,
        date: filterDate,
        status: editStatus,
        notes: editNotes,
      });

      if (res.success) {
        setEditingStudent(null);
        router.refresh();
      }
    });
  };

  const exportToCsv = () => {
    const headers = ["Nama Siswa", "NIS", "Kelas", "Tanggal", "Status Absensi", "Check In", "Check Out", "Metode", "Catatan"];
    const rows = filteredItems.map((item) => [
      `"${item.studentName}"`,
      `"${item.nis}"`,
      `"${item.className}"`,
      `"${item.date}"`,
      `"${item.status}"`,
      `"${item.checkIn || "-"}"`,
      `"${item.checkOut || "-"}"`,
      `"${item.method}"`,
      `"${item.notes || "-"}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Rekap_Absensi_Siswa_${filterDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPageNumbers = (current: number, total: number) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
    if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    return [1, "...", current - 1, current, current + 1, "...", total];
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Main Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-sky-50 text-sky border border-sky/20">
              Kesiswaan
            </span>
            <span className="text-ink-300 text-xs font-bold">•</span>
            <span className="text-xs font-semibold text-ink-400">Rekapitulasi Harian & Bulanan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Rekap Absensi Siswa
          </h1>
          <p className="text-sm text-ink-400 mt-1">
            Pantau tingkat kehadiran seluruh siswa per kelas, histori jam kedatangan, dan perizinan sekolah.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick Date Picker */}
          <div className="flex items-center gap-2 bg-white border border-ink/10 rounded-2xl px-3 py-2 shadow-xs">
            <Calendar size={16} className="text-sky shrink-0" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="text-xs sm:text-sm font-bold text-ink bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          {filterDate !== todayStr && (
            <button
              onClick={() => handleDateChange(todayStr)}
              className="px-3 py-2 rounded-2xl bg-sky-50 text-sky font-semibold text-xs border border-sky/20 hover:bg-sky-100 transition cursor-pointer"
            >
              Hari Ini
            </button>
          )}

          <Button
            onClick={exportToCsv}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet size={16} />
            <span>Export Excel (CSV)</span>
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Overview Stat Cards (Modern, Playful, Colorful & Eye-Catching)            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* 1. Total Active Students (Sky/Blue) */}
        <div className="group relative bg-gradient-to-br from-sky-500/10 via-sky-50/70 to-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-sky-200/80 hover:border-sky-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-sky-400/20 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />
          
          <div className="relative z-10 flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] sm:text-xs font-extrabold text-sky-800 uppercase tracking-wider block">
                Total Siswa
              </span>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-sky-100 text-sky-700 border border-sky-200/60">
                Terdaftar Aktif
              </span>
            </div>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users size={18} className="sm:size-20" />
            </div>
          </div>

          <div className="relative z-10 mt-3 sm:mt-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 leading-tight">
                {summary.totalStudents}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-500">Siswa</span>
            </div>
          </div>

          <div className="relative z-10 mt-3 pt-3 border-t border-sky-100/80 flex items-center justify-between text-[11px] sm:text-xs font-semibold text-sky-800">
            <span className="flex items-center gap-1">
              <School size={13} className="text-sky-600" />
              {classes.length} Kelas
            </span>
            <span className="text-[10px] text-sky-600/80 font-medium">Basis Database</span>
          </div>
        </div>

        {/* 2. Hadir (Emerald/Leaf Green) */}
        <div className="group relative bg-gradient-to-br from-emerald-500/10 via-emerald-50/70 to-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-emerald-200/80 hover:border-emerald-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />
          
          <div className="relative z-10 flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] sm:text-xs font-extrabold text-emerald-800 uppercase tracking-wider block">
                Siswa Hadir
              </span>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/60">
                {summary.percentage}% Rate
              </span>
            </div>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CheckCircle2 size={18} className="sm:size-20" />
            </div>
          </div>

          <div className="relative z-10 mt-3 sm:mt-4 space-y-1.5">
            <div className="flex items-baseline justify-between gap-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 leading-tight">
                  {summary.totalHadir}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-500">Siswa</span>
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-700">
                {summary.totalHadir}/{summary.totalStudents}
              </span>
            </div>
            <div className="w-full bg-emerald-100/70 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${summary.percentage}%` }}
              />
            </div>
          </div>

          <div className="relative z-10 mt-3 pt-3 border-t border-emerald-100/80 flex items-center justify-between text-[11px] sm:text-xs font-semibold text-emerald-800">
            <span className="flex items-center gap-1 truncate">
              <Check size={13} className="text-emerald-600 shrink-0" />
              Presensi Tepat Waktu
            </span>
            <span className="text-[10px] text-emerald-700 font-bold shrink-0">Hari Ini</span>
          </div>
        </div>

        {/* 3. Izin & Sakit (Amber/Gold) */}
        <div className="group relative bg-gradient-to-br from-amber-500/10 via-amber-50/70 to-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-amber-200/80 hover:border-amber-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-400/20 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />
          
          <div className="relative z-10 flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] sm:text-xs font-extrabold text-amber-800 uppercase tracking-wider block">
                Izin & Sakit
              </span>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200/60">
                Terkonfirmasi
              </span>
            </div>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Clock size={18} className="sm:size-20" />
            </div>
          </div>

          <div className="relative z-10 mt-3 sm:mt-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 leading-tight">
                {summary.totalIzin + summary.totalSakit}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-500">Siswa</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] sm:text-[11px] font-bold">
              <span className="px-2 py-0.5 rounded-md bg-sky-100/90 text-sky-800 border border-sky-200/80">
                📋 {summary.totalIzin} Izin
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100/90 text-amber-800 border border-amber-200/80">
                🩺 {summary.totalSakit} Sakit
              </span>
            </div>
          </div>

          <div className="relative z-10 mt-3 pt-3 border-t border-amber-100/80 flex items-center justify-between text-[11px] sm:text-xs font-semibold text-amber-800">
            <span className="truncate">Ada Keterangan</span>
            <span className="text-[10px] text-amber-700/90 font-medium">Tervalidasi</span>
          </div>
        </div>

        {/* 4. Alpha (Rose/Coral) */}
        <div className="group relative bg-gradient-to-br from-rose-500/10 via-rose-50/70 to-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-rose-200/80 hover:border-rose-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-rose-400/20 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />
          
          <div className="relative z-10 flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] sm:text-xs font-extrabold text-rose-800 uppercase tracking-wider block">
                Alpha / Belum Presensi
              </span>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200/60">
                {summary.totalAlpha > 0 ? "Perlu Tindak Lanjut" : "Lengkap"}
              </span>
            </div>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <XCircle size={18} className="sm:size-20" />
            </div>
          </div>

          <div className="relative z-10 mt-3 sm:mt-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 leading-tight">
                {summary.totalAlpha}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-500">Siswa</span>
            </div>
            <div className="mt-1.5">
              {summary.totalAlpha > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100/90 text-rose-800 border border-rose-200/80 text-[10px] sm:text-[11px] font-bold">
                  <AlertTriangle size={11} className="text-rose-600" />
                  Tanpa Keterangan
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100/90 text-emerald-800 border border-emerald-200/80 text-[10px] sm:text-[11px] font-bold">
                  <CheckCircle2 size={11} className="text-emerald-600" />
                  Semua Siswa Terabsen
                </span>
              )}
            </div>
          </div>

          <div className="relative z-10 mt-3 pt-3 border-t border-rose-100/80 flex items-center justify-between text-[11px] sm:text-xs font-semibold text-rose-800">
            <span className="truncate">Status Kehadiran</span>
            <span className="text-[10px] text-rose-700/90 font-medium">
              {summary.totalAlpha > 0 ? "Belum Tap RFID" : "Nol Alpha"}
            </span>
          </div>
        </div>
      </div>

      {/* Per-Class Progress Breakdown Grid */}
      {classBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-6 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <School size={16} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Ringkasan Kehadiran Per Kelas</h2>
                <p className="text-[11px] sm:text-xs text-slate-500">Klik kelas untuk memfilter daftar siswa secara instan</p>
              </div>
            </div>
            {selectedClass !== "ALL" && (
              <button
                onClick={() => handleClassChange("ALL")}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer"
              >
                Reset Filter Kelas
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {classBreakdown.map((cls) => {
              const pct = cls.total > 0 ? Math.round((cls.hadir / cls.total) * 100) : 0;
              const isSelected = selectedClass === cls.classId;

              return (
                <button
                  key={cls.classId}
                  onClick={() => handleClassChange(cls.classId)}
                  className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-sky-50 border-sky-400 ring-2 ring-sky-400/20 shadow-xs"
                      : "bg-slate-50/70 border-slate-200/70 hover:bg-white hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900 truncate">{cls.className}</p>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-800">
                      {cls.hadir}/{cls.total}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        pct >= 90
                          ? "text-emerald-600"
                          : pct >= 75
                          ? "text-amber-600"
                          : "text-rose-600"
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full rounded-full ${
                        pct >= 90
                          ? "bg-emerald-500"
                          : pct >= 75
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      } transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Controls & Filters */}
      <div className="bg-white rounded-3xl border border-ink/10 p-4 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
            <Input
              placeholder="Cari nama siswa, NIS, atau kelas..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 h-11 rounded-2xl bg-cloud border-transparent focus-visible:border-sky text-xs sm:text-sm"
            />
          </div>

          {/* Class Select Dropdown */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-ink-400 shrink-0 flex items-center gap-1">
              <Filter size={14} /> Filter Kelas:
            </span>
            <select
              value={selectedClass}
              onChange={(e) => handleClassChange(e.target.value)}
              className="h-10 px-3 py-1 rounded-xl bg-cloud border border-ink/10 text-xs sm:text-sm font-bold text-ink focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || `Kelas ${c.grade}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pt-2.5 border-t border-slate-100 scrollbar-none">
          <span className="text-[11px] sm:text-xs font-bold text-slate-400 shrink-0 uppercase tracking-wider">Status:</span>
          {[
            { key: "ALL", label: "Semua Status", count: items.length, activeClass: "bg-slate-900 text-white shadow-xs" },
            { key: "HADIR", label: "Hadir", count: items.filter((i) => i.status === "HADIR").length, activeClass: "bg-emerald-600 text-white shadow-xs" },
            { key: "IZIN", label: "Izin", count: items.filter((i) => i.status === "IZIN").length, activeClass: "bg-sky-600 text-white shadow-xs" },
            { key: "SAKIT", label: "Sakit", count: items.filter((i) => i.status === "SAKIT").length, activeClass: "bg-amber-600 text-white shadow-xs" },
            { key: "ALPHA", label: "Alpha", count: items.filter((i) => i.status === "ALPHA").length, activeClass: "bg-rose-600 text-white shadow-xs" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setSelectedStatus(tab.key);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                selectedStatus === tab.key
                  ? tab.activeClass
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              {tab.label} <span className="opacity-80 font-normal">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Student Attendance Log Table */}
      <div className="bg-white rounded-3xl border border-ink/10 overflow-hidden shadow-xs">
        <div className="px-6 py-5 border-b border-ink/5 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-extrabold text-base text-ink">Daftar Rekapitulasi Absensi Siswa</h2>
            <p className="text-xs text-ink-400">
              Menampilkan {filteredItems.length === 0 ? 0 : startIndex + 1} - {endIndex} dari total {filteredItems.length} siswa (Tanggal: {filterDate})
            </p>
          </div>
          {isPending && (
            <div className="flex items-center gap-2 text-xs font-bold text-sky">
              <RefreshCw size={14} className="animate-spin" />
              <span>Memuat data...</span>
            </div>
          )}
        </div>

        {paginatedItems.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 bg-cloud rounded-2xl flex items-center justify-center text-ink-300 mx-auto">
              <Users size={28} />
            </div>
            <p className="font-extrabold text-ink text-base">Tidak Ada Data Absensi Found</p>
            <p className="text-xs text-ink-400 max-w-sm mx-auto">
              Tidak ditemukan data siswa yang cocok dengan filter tanggal ({filterDate}), kelas, atau kata kunci pencarian Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-cloud/60 border-b border-ink/5 text-ink-400 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3.5 px-6">Siswa & NIS</th>
                  <th className="py-3.5 px-4">Kelas</th>
                  <th className="py-3.5 px-4">Status Absensi</th>
                  <th className="py-3.5 px-4">Check-In / Out</th>
                  <th className="py-3.5 px-4">Metode</th>
                  <th className="py-3.5 px-6 text-right">Aksi Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5 font-semibold text-ink">
                {paginatedItems.map((item) => {
                  return (
                    <tr key={item.studentId} className="hover:bg-cloud/40 transition-colors">
                      {/* Siswa & NIS */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky border border-sky/20 font-bold flex items-center justify-center shrink-0">
                            {item.studentName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-extrabold text-ink text-sm leading-snug">
                              {item.studentName}
                            </p>
                            <p className="text-[11px] font-mono text-ink-300">NIS: {item.nis}</p>
                          </div>
                        </div>
                      </td>

                      {/* Kelas */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-xl bg-cloud border border-ink/5 text-ink-500 text-xs font-bold">
                          {item.className}
                        </span>
                      </td>

                      {/* Status Absensi */}
                      <td className="py-3.5 px-4">
                        {item.status === "HADIR" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-leaf-50 text-leaf border border-leaf-200">
                            <CheckCircle2 size={13} /> HADIR
                          </span>
                        )}
                        {item.status === "IZIN" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky border border-sky-200">
                            <Clock size={13} /> IZIN
                          </span>
                        )}
                        {item.status === "SAKIT" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock size={13} /> SAKIT
                          </span>
                        )}
                        {item.status === "ALPHA" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-coral-50 text-coral border border-coral-200">
                            <XCircle size={13} /> ALPHA
                          </span>
                        )}

                        {item.notes && (
                          <p className="text-[11px] text-ink-400 font-normal italic mt-1 max-w-xs truncate">
                            &quot;{item.notes}&quot;
                          </p>
                        )}
                      </td>

                      {/* Check-In / Out */}
                      <td className="py-3.5 px-4 text-xs font-medium">
                        <div>
                          <span className="text-ink-300 font-mono text-[10px]">IN: </span>
                          <span className="font-bold text-ink">{item.checkIn ? item.checkIn.substring(0, 5) : "-"}</span>
                        </div>
                        <div>
                          <span className="text-ink-300 font-mono text-[10px]">OUT: </span>
                          <span className="font-bold text-ink">{item.checkOut ? item.checkOut.substring(0, 5) : "-"}</span>
                        </div>
                      </td>

                      {/* Metode */}
                      <td className="py-3.5 px-4 text-xs text-ink-400">
                        <span className="inline-flex items-center gap-1 font-semibold">
                          <Sparkles size={12} className="text-sky" /> {item.method}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cloud hover:bg-sky-50 text-ink-400 hover:text-sky font-bold text-xs border border-ink/5 transition cursor-pointer"
                        >
                          <Edit3 size={14} />
                          <span>Edit Status</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredItems.length > 0 && (
          <div className="px-6 py-4 bg-cloud/40 border-t border-ink/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            {/* Left: Page Size Selector */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink-400">Tampilkan:</span>
              <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-ink/10 shadow-2xs">
                {[20, 50, 100].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      pageSize === size
                        ? "bg-sky text-white shadow-2xs"
                        : "text-ink-400 hover:text-ink hover:bg-cloud"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <span className="text-ink-300 font-semibold">per halaman</span>
            </div>

            {/* Middle: Info */}
            <div className="text-ink-400 font-medium">
              Menampilkan <span className="font-extrabold text-ink">{startIndex + 1}</span> - <span className="font-extrabold text-ink">{endIndex}</span> dari <span className="font-extrabold text-ink">{filteredItems.length}</span> data
            </div>

            {/* Right: Page Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={activePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-xl bg-white border border-ink/10 flex items-center justify-center text-ink hover:bg-cloud disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>

              {getPageNumbers(activePage, totalPages).map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={typeof p !== "number"}
                  onClick={() => typeof p === "number" && setCurrentPage(p)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                    p === activePage
                      ? "bg-sky text-white shadow-2xs"
                      : typeof p === "number"
                      ? "bg-white border border-ink/10 text-ink hover:bg-cloud cursor-pointer"
                      : "text-ink-300 cursor-default"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                disabled={activePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded-xl bg-white border border-ink/10 flex items-center justify-center text-ink hover:bg-cloud disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Edit Status Modal Overlay */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-ink">Update Status Absensi Siswa</h3>
                <p className="text-xs text-ink-400 mt-1">
                  Ubah status presensi harian untuk <strong className="text-ink">{editingStudent.studentName}</strong> ({editingStudent.className}) tanggal {filterDate}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="w-8 h-8 rounded-full bg-cloud hover:bg-ink/10 flex items-center justify-center text-ink-400 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 pt-1">
              {/* Status Options */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-ink-400 uppercase tracking-wider">
                  Pilih Status Absensi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "HADIR", label: "HADIR", bg: "bg-leaf-50 text-leaf border-leaf-200" },
                    { value: "IZIN", label: "IZIN", bg: "bg-sky-50 text-sky border-sky-200" },
                    { value: "SAKIT", label: "SAKIT", bg: "bg-amber-50 text-amber-700 border-amber-200" },
                    { value: "ALPHA", label: "ALPHA", bg: "bg-coral-50 text-coral border-coral-200" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEditStatus(opt.value as any)}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                        editStatus === opt.value
                          ? `${opt.bg} ring-2 ring-sky/30`
                          : "bg-cloud/50 border-ink/10 text-ink-400 hover:bg-white"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {editStatus === opt.value && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes / Reason Textarea */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-ink-400 uppercase tracking-wider">
                  Catatan / Alasan (Opsional)
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Contoh: Sakit demam dengan surat dokter, atau izin acara keluarga..."
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-cloud border border-ink/10 text-xs sm:text-sm text-ink focus:outline-none focus:border-sky"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingStudent(null)}
                  className="rounded-2xl text-xs font-bold border-ink/10 cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isPending}
                  className="bg-sky hover:bg-sky/90 text-white font-bold text-xs rounded-2xl px-5 cursor-pointer"
                >
                  {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
