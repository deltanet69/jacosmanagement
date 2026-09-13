"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  School,
  Users,
  CalendarCheck,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  Search,
  LayoutGrid,
  List,
  ArrowRight,
  User,
  PieChart,
  ChevronRight,
  ShieldAlert,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  ClassroomWithStats,
  ClassroomGlobalStats,
  createClass,
  updateClass,
  deleteClass,
} from "./actions";

const GRADE_PALETTES: Record<
  string,
  {
    gradient: string;
    border: string;
    badge: string;
    accent: string;
    bar: string;
    iconBg: string;
  }
> = {
  "1": {
    gradient: "from-sky-500/10 via-sky-500/5 to-transparent",
    border: "hover:border-sky-300",
    badge: "bg-sky-50 text-sky-700 border-sky-200/60",
    accent: "text-sky-600",
    bar: "from-sky-500 to-blue-600",
    iconBg: "bg-sky-50 text-sky-600 border-sky-100",
  },
  "2": {
    gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    border: "hover:border-emerald-300",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    accent: "text-emerald-600",
    bar: "from-emerald-500 to-teal-600",
    iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  "3": {
    gradient: "from-purple-500/10 via-purple-500/5 to-transparent",
    border: "hover:border-purple-300",
    badge: "bg-purple-50 text-purple-700 border-purple-200/60",
    accent: "text-purple-600",
    bar: "from-purple-500 to-indigo-600",
    iconBg: "bg-purple-50 text-purple-600 border-purple-100",
  },
  "4": {
    gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
    border: "hover:border-amber-300",
    badge: "bg-amber-50 text-amber-700 border-amber-200/60",
    accent: "text-amber-600",
    bar: "from-amber-500 to-orange-600",
    iconBg: "bg-amber-50 text-amber-600 border-amber-100",
  },
  "5": {
    gradient: "from-rose-500/10 via-rose-500/5 to-transparent",
    border: "hover:border-rose-300",
    badge: "bg-rose-50 text-rose-700 border-rose-200/60",
    accent: "text-rose-600",
    bar: "from-rose-500 to-pink-600",
    iconBg: "bg-rose-50 text-rose-600 border-rose-100",
  },
  "6": {
    gradient: "from-cyan-500/10 via-cyan-500/5 to-transparent",
    border: "hover:border-cyan-300",
    badge: "bg-cyan-50 text-cyan-700 border-cyan-200/60",
    accent: "text-cyan-600",
    bar: "from-cyan-500 to-teal-600",
    iconBg: "bg-cyan-50 text-cyan-600 border-cyan-100",
  },
};

const DEFAULT_PALETTE = {
  gradient: "from-indigo-500/10 via-indigo-500/5 to-transparent",
  border: "hover:border-indigo-300",
  badge: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
  accent: "text-indigo-600",
  bar: "from-indigo-500 to-sky-600",
  iconBg: "bg-indigo-50 text-indigo-600 border-indigo-100",
};

export default function ClassroomListClient({
  initialClasses,
  initialStats,
}: {
  initialClasses: ClassroomWithStats[];
  stats?: ClassroomGlobalStats;
  initialStats?: ClassroomGlobalStats;
}) {
  const [classes] = useState<ClassroomWithStats[]>(initialClasses || []);
  const stats = initialStats || {
    totalClasses: classes.length,
    totalStudents: classes.reduce((sum, c) => sum + c.studentCount, 0),
    totalCapacity: classes.reduce((sum, c) => sum + c.capacity, 0),
    avgOccupancyPct: 0,
    overallTodayAttendancePct: 0,
    pendingAbsencesTotal: 0,
    gradeList: Array.from(new Set(classes.map((c) => c.grade).filter(Boolean))),
  };

  const [isPending, startTransition] = useTransition();

  // Filter and view states
  const [search, setSearch] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "grade" | "name" | "students_desc" | "attendance_desc" | "occupancy_desc"
  >("grade");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    grade: "",
    level: "Primary",
    capacity: 25,
    homeroom_teacher: "",
  });

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<ClassroomWithStats | null>(null);

  // Dropdown menu state
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Compute gender distribution across all classes
  const totalMale = useMemo(
    () => classes.reduce((sum, c) => sum + (c.maleCount || 0), 0),
    [classes]
  );
  const totalFemale = useMemo(
    () => classes.reduce((sum, c) => sum + (c.femaleCount || 0), 0),
    [classes]
  );

  // Filtered & Sorted Classes
  const filteredClasses = useMemo(() => {
    let result = [...classes];

    // Filter by grade
    if (selectedGrade !== "all") {
      result = result.filter((c) => c.grade === selectedGrade);
    }

    // Filter by search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.grade.toLowerCase().includes(q) ||
          (c.level && c.level.toLowerCase().includes(q)) ||
          (c.homeroom_teacher && c.homeroom_teacher.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name, undefined, { numeric: true });
      }
      if (sortBy === "students_desc") {
        return b.studentCount - a.studentCount;
      }
      if (sortBy === "attendance_desc") {
        return b.todayAttendancePct - a.todayAttendancePct;
      }
      if (sortBy === "occupancy_desc") {
        return b.capacityPct - a.capacityPct;
      }
      // default: grade
      const gA = parseInt(a.grade) || 999;
      const gB = parseInt(b.grade) || 999;
      if (gA !== gB) return gA - gB;
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });

    return result;
  }, [classes, selectedGrade, search, sortBy]);

  // Modal actions
  const handleOpenModal = (mode: "create" | "edit", cls?: ClassroomWithStats) => {
    setModalMode(mode);
    if (mode === "edit" && cls) {
      setActiveClassId(cls.id);
      setFormData({
        name: cls.name,
        grade: cls.grade,
        level: cls.level || "Primary",
        capacity: cls.capacity || 25,
        homeroom_teacher: cls.homeroom_teacher || "",
      });
    } else {
      setActiveClassId(null);
      setFormData({
        name: "",
        grade: "",
        level: "Primary",
        capacity: 25,
        homeroom_teacher: "",
      });
    }
    setShowModal(true);
    setMenuOpen(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (modalMode === "create") {
        const res = await createClass(formData);
        if (res.success) {
          setShowModal(false);
          window.location.reload();
        } else {
          alert("Gagal membuat kelas: " + res.message);
        }
      } else if (modalMode === "edit" && activeClassId) {
        const res = await updateClass(activeClassId, formData);
        if (res.success) {
          setShowModal(false);
          window.location.reload();
        } else {
          alert("Gagal mengupdate kelas: " + res.message);
        }
      }
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteClass(deleteTarget.id);
      if (res.success) {
        setDeleteTarget(null);
        window.location.reload();
      } else {
        alert("Gagal menghapus kelas: " + res.message);
      }
    });
  };

  return (
    <div className="bg-slate-50/50 pb-16 sm:pb-20">
      <div className="max-w-full mx-auto py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        
        {/* ========================================================================= */}
        {/* 1. HERO BANNER (Mobile Proportional & Compact)                           */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-xl lg:rounded-2xl bg-gradient-to-br from-sky-900 via-indigo-950 to-slate-950 text-white p-4.5 sm:p-7 md:p-10 shadow-lg shadow-sky-950/10 border border-white/10">
          {/* Subtle Ambient Shapes */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 sm:w-96 h-64 sm:h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 translate-y-12 w-56 sm:w-80 h-56 sm:h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-1.5 sm:space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-sky-200 text-[10px] sm:text-xs font-bold tracking-wide uppercase">
                <School size={12} className="text-sky-300" />
                <span>Manajemen Kelas</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight leading-tight">
                Daftar Classroom
              </h1>
              
              <p className="text-sky-100/80 text-xs sm:text-sm md:text-base leading-relaxed font-normal line-clamp-2 sm:line-clamp-none">
                Pantau kapasitas kelas, rasio gender siswa, presensi harian, dan navigasi cepat jadwal & perizinan secara interaktif.
              </p>
            </div>

            {/* Action CTA Button */}
            <div className="pt-1 md:pt-0 shrink-0">
              <button
                onClick={() => handleOpenModal("create")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/25 active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <Plus size={14} />
                </div>
                <span>Tambah Kelas Baru</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. STATS OVERVIEW RIBBON (2x2 Grid on Mobile, 4 Cols on Desktop)          */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
          
          {/* Stat 1: Total Kelas */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 lg:p-6 border border-slate-200/70 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                Total Kelas
              </span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <School size={15} className="sm:size-18" />
              </div>
            </div>
            <div className="mt-2 sm:mt-4">
              <div className="text-xl sm:text-3xl lg:text-4xl font-display font-extrabold text-slate-900 leading-tight">
                {stats.totalClasses} <span className="text-xs sm:text-sm font-semibold text-slate-400">Kelas</span>
              </div>
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 mt-1 truncate">
                {stats.gradeList.length} Tingkat Pendidikan
              </p>
            </div>
          </div>

          {/* Stat 2: Total Siswa */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 lg:p-6 border border-slate-200/70 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                Total Siswa
              </span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Users size={15} className="sm:size-18" />
              </div>
            </div>
            <div className="mt-2 sm:mt-4">
              <div className="text-xl sm:text-3xl lg:text-4xl font-display font-extrabold text-slate-900 leading-tight">
                {stats.totalStudents} <span className="text-xs sm:text-sm font-semibold text-slate-400">Siswa</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] sm:text-xs font-semibold text-slate-600 truncate">
                <span className="text-sky-600 font-bold">{totalMale} L</span>
                <span className="text-slate-300">•</span>
                <span className="text-rose-600 font-bold">{totalFemale} P</span>
              </div>
            </div>
          </div>

          {/* Stat 3: Okupansi Ruang */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 lg:p-6 border border-slate-200/70 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                Okupansi Ruang
              </span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <PieChart size={15} className="sm:size-18" />
              </div>
            </div>
            <div className="mt-2 sm:mt-4">
              <div className="flex items-baseline justify-between gap-1">
                <div className="text-xl sm:text-3xl lg:text-4xl font-display font-extrabold text-slate-900 leading-tight">
                  {stats.avgOccupancyPct}%
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 truncate">
                  {stats.totalStudents}/{stats.totalCapacity} Kursi
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 sm:h-2 mt-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, stats.avgOccupancyPct)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stat 4: Kehadiran Hari Ini */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 lg:p-6 border border-slate-200/70 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                Kehadiran Hari Ini
              </span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <CalendarCheck size={15} className="sm:size-18" />
              </div>
            </div>
            <div className="mt-2 sm:mt-4">
              <div className="text-xl sm:text-3xl lg:text-4xl font-display font-extrabold text-slate-900 leading-tight">
                {stats.overallTodayAttendancePct}%
              </div>
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 mt-1 truncate">
                {stats.pendingAbsencesTotal > 0 ? (
                  <span className="text-amber-600 font-bold flex items-center gap-1">
                    <AlertCircle size={11} /> {stats.pendingAbsencesTotal} Izin Menunggu
                  </span>
                ) : (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={11} /> Presensi Terpantau
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. TOOLBAR: GRADE FILTERS, SEARCH, SORT, & VIEW SWITCHER                  */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4.5 border border-slate-200/70 shadow-xs space-y-3">
          {/* Top Row: Grade Filter Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedGrade("all")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                selectedGrade === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Semua ({classes.length})
            </button>

            {stats.gradeList.map((grade) => {
              const count = classes.filter((c) => c.grade === grade).length;
              const isSelected = selectedGrade === grade;
              return (
                <button
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    isSelected
                      ? "bg-sky-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Tingkat {grade} ({count})
                </button>
              );
            })}
          </div>

          {/* Bottom Row: Search, Sort & View Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 border-t border-slate-100">
            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Cari kelas atau wali kelas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8.5 pr-7 py-1.5 sm:py-2 rounded-xl sm:rounded-full bg-slate-100/80 border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Sort Select & View Toggle */}
            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full appearance-none pl-3 pr-7 py-1.5 sm:py-2 rounded-xl sm:rounded-full bg-slate-100/80 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer"
                >
                  <option value="grade">Urut: Tingkat</option>
                  <option value="name">Urut: Nama (A-Z)</option>
                  <option value="students_desc">Urut: Siswa Terbanyak</option>
                  <option value="attendance_desc">Urut: Presensi Tertinggi</option>
                  <option value="occupancy_desc">Urut: Okupansi Tertinggi</option>
                </select>
                <SlidersHorizontal
                  size={12}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-slate-100 rounded-xl sm:rounded-full p-1 border border-slate-200 shrink-0">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg sm:rounded-full transition-all cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white text-sky-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Tampilan Grid"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-lg sm:rounded-full transition-all cursor-pointer ${
                    viewMode === "table"
                      ? "bg-white text-sky-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Tampilan Tabel"
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. CLASSROOM CARDS / TABLE DISPLAY                                        */}
        {/* ========================================================================= */}
        {filteredClasses.length === 0 ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center border border-slate-200/70 shadow-xs max-w-lg mx-auto space-y-3">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-xl sm:text-2xl">
              🔍
            </div>
            <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900">
              Tidak Ada Kelas Ditemukan
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
              Tidak ada data kelas yang sesuai dengan filter atau kata kunci pencarian Anda.
            </p>
            <div className="pt-2 flex justify-center gap-2.5">
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedGrade("all");
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
              >
                Reset Filter
              </button>
              <button
                onClick={() => handleOpenModal("create")}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-xs font-bold text-white transition shadow-sm"
              >
                + Buat Kelas
              </button>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-5">
            {filteredClasses.map((cls) => {
              const palette = GRADE_PALETTES[cls.grade] || DEFAULT_PALETTE;

              return (
                <div
                  key={cls.id}
                  className={`group relative bg-white rounded-2xl sm:rounded-3xl p-4.5 sm:p-6 border border-slate-200/80 ${palette.border} shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between overflow-hidden`}
                >
                  {/* Decorative Subtle Top Ambient Gradient */}
                  <div
                    className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${palette.gradient} rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform`}
                  />

                  {/* Top Bar: Icon, Grade Badge, & Menu */}
                  <div className="relative z-10 flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl ${palette.iconBg} border flex items-center justify-center font-bold text-base shadow-xs shrink-0 group-hover:scale-105 transition-transform`}
                      >
                        <School size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border uppercase tracking-wider ${palette.badge}`}
                          >
                            Tingkat {cls.grade || "-"}
                          </span>
                          {cls.level && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/60">
                              {cls.level}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Dropdown Menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setMenuOpen(menuOpen === cls.id ? null : cls.id);
                        }}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
                        title="Opsi Kelas"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {menuOpen === cls.id && (
                        <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 slide-down">
                          <button
                            onClick={() => handleOpenModal("edit", cls)}
                            className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                          >
                            <Edit2 size={12} className="text-sky-600" /> Edit Detail
                          </button>
                          <div className="my-1 border-t border-slate-100" />
                          <button
                            onClick={() => {
                              setDeleteTarget(cls);
                              setMenuOpen(null);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition"
                          >
                            <Trash2 size={12} /> Hapus Kelas
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title & Homeroom Teacher */}
                  <div className="relative z-10 mt-3 sm:mt-4 space-y-0.5 sm:space-y-1">
                    <h3 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 group-hover:text-sky-600 transition-colors">
                      Kelas {cls.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500">
                      <User size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">
                        {cls.homeroom_teacher
                          ? cls.homeroom_teacher
                          : "Belum Ditentukan"}
                      </span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="relative z-10 mt-3 sm:mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] sm:text-xs">
                      <span className="text-slate-500 font-medium">Kapasitas</span>
                      <span className="font-bold text-slate-800">
                        {cls.studentCount} / {cls.capacity} Siswa ({cls.capacityPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 sm:h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${
                          cls.capacityPct >= 100
                            ? "from-rose-500 to-red-600"
                            : cls.capacityPct >= 80
                            ? "from-amber-500 to-orange-600"
                            : palette.bar
                        } transition-all duration-500`}
                        style={{ width: `${Math.min(100, cls.capacityPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Demographics & Attendance Highlights */}
                  <div className="relative z-10 mt-3 grid grid-cols-2 gap-1.5 sm:gap-2">
                    {/* Gender Breakdown */}
                    <div className="bg-slate-50/90 rounded-lg sm:rounded-xl p-2 sm:p-2.5 border border-slate-100 text-[10px] sm:text-[11px] flex flex-col justify-between">
                      <span className="text-slate-400 font-medium">Gender</span>
                      <div className="font-bold text-slate-700 mt-0.5 flex items-center gap-1.5">
                        <span className="text-sky-600">{cls.maleCount} L</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-rose-600">{cls.femaleCount} P</span>
                      </div>
                    </div>

                    {/* Today Attendance */}
                    <div className="bg-slate-50/90 rounded-lg sm:rounded-xl p-2 sm:p-2.5 border border-slate-100 text-[10px] sm:text-[11px] flex flex-col justify-between">
                      <span className="text-slate-400 font-medium">Presensi Hari Ini</span>
                      <div className="font-bold text-slate-700 mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                        <span className="truncate">{cls.todayPresentCount}/{cls.studentCount} Hadir</span>
                      </div>
                    </div>
                  </div>

                  {/* Pending Permission Notice (If any) */}
                  {cls.pendingAbsencesCount > 0 && (
                    <Link
                      href={`/management/classroom/${cls.id}?tab=perizinan`}
                      className="relative z-10 mt-2.5 inline-flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-800 text-[10px] sm:text-[11px] font-bold hover:bg-amber-100 transition"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <AlertCircle size={12} className="text-amber-600 shrink-0" />
                        {cls.pendingAbsencesCount} Izin Menunggu
                      </span>
                      <ChevronRight size={12} className="shrink-0" />
                    </Link>
                  )}

                  {/* Action Navigation Hub */}
                  <div className="relative z-10 mt-3 sm:mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                    {/* Primary Button: Buka Kelas */}
                    <Link
                      href={`/management/classroom/${cls.id}`}
                      className="w-full bg-slate-900 hover:bg-sky-600 text-white font-bold text-xs py-2.5 sm:py-3 rounded-xl transition-all flex items-center justify-center gap-2 group/btn shadow-xs hover:shadow-md hover:shadow-sky-600/20"
                    >
                      <span>Buka Kelas</span>
                      <ArrowRight
                        size={13}
                        className="group-hover/btn:translate-x-1 transition-transform"
                      />
                    </Link>

                    {/* Quick Shortcut Buttons */}
                    <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                      <Link
                        href={`/management/classroom/${cls.id}?tab=siswa`}
                        className="py-1.5 px-1.5 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-700 text-[10px] sm:text-xs font-bold text-center border border-slate-200/60 transition"
                      >
                        👥 Siswa
                      </Link>
                      <Link
                        href={`/management/classroom/${cls.id}?tab=absensi`}
                        className="py-1.5 px-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-[10px] sm:text-xs font-bold text-center border border-slate-200/60 transition"
                      >
                        📋 Absensi
                      </Link>
                      <Link
                        href={`/management/classroom/${cls.id}?tab=jadwal`}
                        className="py-1.5 px-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-700 text-[10px] sm:text-xs font-bold text-center border border-slate-200/60 transition"
                      >
                        🗓️ Jadwal
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 sm:px-6">Nama Kelas & Tingkat</th>
                    <th className="py-3 px-4 sm:px-6">Wali Kelas</th>
                    <th className="py-3 px-4 sm:px-6">Siswa / Kuota</th>
                    <th className="py-3 px-4 sm:px-6">Gender</th>
                    <th className="py-3 px-4 sm:px-6">Presensi</th>
                    <th className="py-3 px-4 sm:px-6">Perizinan</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredClasses.map((cls) => {
                    const palette = GRADE_PALETTES[cls.grade] || DEFAULT_PALETTE;
                    return (
                      <tr
                        key={cls.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-3 px-4 sm:px-6">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-lg ${palette.iconBg} border flex items-center justify-center font-bold text-xs shrink-0`}
                            >
                              <School size={14} />
                            </div>
                            <div>
                              <Link
                                href={`/management/classroom/${cls.id}`}
                                className="font-bold text-slate-900 group-hover:text-sky-600 text-xs sm:text-sm transition-colors"
                              >
                                Kelas {cls.name}
                              </Link>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${palette.badge}`}
                                >
                                  Tingkat {cls.grade}
                                </span>
                                {cls.level && (
                                  <span className="text-[9px] font-semibold text-slate-400">
                                    • {cls.level}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 sm:px-6">
                          <div className="font-medium text-slate-800 text-xs">
                            {cls.homeroom_teacher || (
                              <span className="text-slate-400 italic">Belum Ditentukan</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 sm:px-6">
                          <div className="space-y-1 w-28">
                            <div className="flex justify-between font-bold text-[10px] sm:text-[11px] text-slate-700">
                              <span>{cls.studentCount} Siswa</span>
                              <span className="text-slate-400 font-normal">/ {cls.capacity}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full bg-gradient-to-r ${palette.bar}`}
                                style={{ width: `${Math.min(100, cls.capacityPct)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 sm:px-6">
                          <div className="flex items-center gap-1 font-bold text-[10px]">
                            <span className="text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                              {cls.maleCount} L
                            </span>
                            <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                              {cls.femaleCount} P
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 sm:px-6">
                          <div className="flex items-center gap-1 font-semibold text-slate-700 text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>
                              {cls.todayPresentCount}/{cls.studentCount} ({cls.todayAttendancePct}%)
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 sm:px-6">
                          {cls.pendingAbsencesCount > 0 ? (
                            <Link
                              href={`/management/classroom/${cls.id}?tab=perizinan`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold hover:bg-amber-100"
                            >
                              <AlertCircle size={10} className="text-amber-600" />
                              {cls.pendingAbsencesCount} Menunggu
                            </Link>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>

                        <td className="py-3 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/management/classroom/${cls.id}`}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-sky-600 text-white font-bold text-[11px] transition"
                            >
                              Buka
                            </Link>
                            <button
                              onClick={() => handleOpenModal("edit", cls)}
                              className="p-1 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"
                              title="Edit"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(cls)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Hapus"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. MODAL: CREATE / EDIT CLASSROOM                                         */}
        {/* ========================================================================= */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 slide-down">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                    <School size={18} />
                  </div>
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-slate-900">
                      {modalMode === "create" ? "Tambah Kelas Baru" : "Edit Detail Kelas"}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500">
                      {modalMode === "create"
                        ? "Lengkapi informasi kelas akademik"
                        : "Perbarui pengaturan ruang kelas"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-3.5 sm:space-y-4">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Nama Kelas <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Contoh: 1A, Abu Bakar, Grade 2B"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                      Tingkat / Grade <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: 1, 2, TK-A"
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      className="w-full rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                      Kapasitas <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          capacity: parseInt(e.target.value) || 25,
                        })
                      }
                      className="w-full rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Jenjang / Level
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer"
                  >
                    <option value="Preschool">Preschool (KB / TK)</option>
                    <option value="Primary">Primary (SD)</option>
                    <option value="Secondary">Secondary (SMP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Nama Wali Kelas (Homeroom Teacher)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Ustadzah Sarah, S.Pd"
                    value={formData.homeroom_teacher}
                    onChange={(e) =>
                      setFormData({ ...formData, homeroom_teacher: e.target.value })
                    }
                    className="w-full rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                  />
                </div>

                <div className="pt-3 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 sm:py-3 rounded-xl sm:rounded-2xl transition text-xs uppercase tracking-wide cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold py-2.5 sm:py-3 rounded-xl sm:rounded-2xl shadow-md shadow-sky-600/20 transition disabled:opacity-50 text-xs uppercase tracking-wide cursor-pointer"
                  >
                    {isPending ? "Menyimpan..." : "Simpan Kelas"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. MODAL: DELETE CONFIRMATION                                             */}
        {/* ========================================================================= */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 p-5 sm:p-7 text-center space-y-3 slide-down">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <ShieldAlert size={26} className="sm:size-32" />
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900">
                  Hapus Kelas {deleteTarget.name}?
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Apakah Anda yakin ingin menghapus kelas ini? Siswa yang terdaftar di kelas ini ({deleteTarget.studentCount} siswa) akan kehilangan relasi kelas.
                </p>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition text-xs uppercase cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={confirmDelete}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl shadow-md shadow-rose-600/20 transition disabled:opacity-50 text-xs uppercase cursor-pointer"
                >
                  {isPending ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
