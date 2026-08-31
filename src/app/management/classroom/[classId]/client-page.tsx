"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  CalendarDays,
  CalendarCheck,
  FileText,
  Bell,
  Check,
  X,
  Plus,
  ChevronRight,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  UserCheck,
  ArrowLeft,
  Search,
  School,
  Sparkles,
  ChevronLeft,
  FileSpreadsheet,
  Edit3,
  Calendar,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { approveAbsence, rejectAbsence, createClassPost } from "../actions";
import { updateStudentAttendanceRecord } from "../../absensi/actions";

const DAYS_ORDER = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT"];

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  akademik: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  islamic: { bg: "bg-leaf-50", text: "text-leaf-700", border: "border-leaf-200" },
  ekstrakurikuler: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
};

const ABSENCE_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  SAKIT: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  IZIN: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  LAINNYA: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
};

type Tab = "overview" | "jadwal" | "siswa" | "absensi" | "perizinan" | "informasi";

export default function ClassroomClientPage({
  classId,
  cls,
  allClasses,
  studentCount,
  students,
  schedule,
  posts,
  absences,
  todaySchedule,
  summary,
}: {
  classId: string;
  cls: any;
  allClasses: any[];
  studentCount: number;
  students: any[];
  schedule: any[];
  posts: any[];
  absences: any[];
  todaySchedule: any[];
  summary: { totalStudents: number; presentToday: number; todayPct: number; pendingAbsences: number };
}) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [attPeriod, setAttPeriod] = useState<"harian" | "mingguan" | "bulanan">("harian");
  const [absenceFilter, setAbsenceFilter] = useState<"all" | "PENDING" | "done">("all");
  const [showPostModal, setShowPostModal] = useState(false);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Pagination for Student List Tab
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // States for Class Attendance Tab
  const todayStr = new Date().toISOString().split("T")[0];
  const [classAttDate, setClassAttDate] = useState<string>(todayStr);
  const [classAttStatus, setClassAttStatus] = useState<string>("ALL");
  const [classAttSearch, setClassAttSearch] = useState<string>("");
  const [classAttPageSize, setClassAttPageSize] = useState<number>(20);
  const [classAttPage, setClassAttPage] = useState<number>(1);

  // Edit Modal State for Class Attendance
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState<"HADIR" | "IZIN" | "SAKIT" | "ALPHA">("HADIR");
  const [editNotes, setEditNotes] = useState("");

  // Post form state
  const [postForm, setPostForm] = useState({
    title: "",
    body: "",
    category: "Pengumuman",
    audience: "Semua",
    authorName: cls.homeroom_teacher || "Wali Kelas",
  });

  const TABS: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "jadwal", label: "Jadwal Pelajaran", icon: CalendarDays },
    { id: "siswa", label: "Daftar Siswa", icon: Users },
    { id: "absensi", label: "Rekap Absensi Kelas", icon: CalendarCheck },
    { id: "perizinan", label: "Perizinan", icon: FileText, badge: summary.pendingAbsences },
    { id: "informasi", label: "Pengumuman Kelas", icon: Bell },
  ];

  // Group schedule by day
  const scheduleByDay = DAYS_ORDER.reduce<Record<string, any[]>>((acc, day) => {
    acc[day] = schedule.filter((s) => s.day_of_week === day);
    return acc;
  }, {});

  // All unique time slots
  const timeSlots = [...new Set(schedule.map((s) => `${s.time_start}–${s.time_end}`))].sort();

  // Filtered students for Daftar Siswa Tab
  const filteredStudents = useMemo(() => {
    return students.filter((s) =>
      s.full_name?.toLowerCase().includes(search.toLowerCase().trim()) ||
      s.nis?.toLowerCase().includes(search.toLowerCase().trim())
    );
  }, [students, search]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredStudents.length);
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // Attendance items for Rekap Absensi Kelas Tab
  const classAttendanceItems = useMemo(() => {
    return students.map((s) => {
      const status = s.todayStatus || "ALPHA";
      return {
        studentId: s.id,
        studentName: s.full_name,
        nis: s.nis || "-",
        profilePicture: s.profile_picture,
        status,
        checkIn: s.todayCheckIn || null,
        checkOut: null,
        method: s.todayCheckIn ? "RFID / Scanner" : "Belum Presensi",
      };
    });
  }, [students]);

  const filteredClassAttendance = useMemo(() => {
    return classAttendanceItems.filter((item) => {
      const matchStatus = classAttStatus === "ALL" || item.status === classAttStatus;
      const matchSearch =
        !classAttSearch.trim() ||
        item.studentName.toLowerCase().includes(classAttSearch.toLowerCase().trim()) ||
        item.nis.toLowerCase().includes(classAttSearch.toLowerCase().trim());
      return matchStatus && matchSearch;
    });
  }, [classAttendanceItems, classAttStatus, classAttSearch]);

  const classAttTotalPages = Math.max(1, Math.ceil(filteredClassAttendance.length / classAttPageSize));
  const classAttActivePage = Math.min(classAttPage, classAttTotalPages);
  const classAttStartIndex = (classAttActivePage - 1) * classAttPageSize;
  const classAttEndIndex = Math.min(classAttStartIndex + classAttPageSize, filteredClassAttendance.length);
  const paginatedClassAttendance = filteredClassAttendance.slice(classAttStartIndex, classAttEndIndex);

  // Attendance summary for this class
  const classHadirCount = classAttendanceItems.filter((i) => i.status === "HADIR").length;
  const classIzinCount = classAttendanceItems.filter((i) => i.status === "IZIN" || i.status === "SAKIT").length;
  const classAlphaCount = classAttendanceItems.filter((i) => i.status === "ALPHA").length;
  const classPct = studentCount > 0 ? Math.round((classHadirCount / studentCount) * 100) : 0;

  // Filtered absences
  const filteredAbsences = absences.filter((a) => {
    if (absenceFilter === "all") return true;
    if (absenceFilter === "PENDING") return a.status === "PENDING";
    return a.status !== "PENDING";
  });

  const handleApprove = (absenceId: string) => {
    startTransition(() => {
      approveAbsence(absenceId, classId);
    });
  };

  const handleReject = (absenceId: string) => {
    startTransition(() => {
      rejectAbsence(absenceId, classId);
    });
  };

  const handleCreatePost = async () => {
    if (!postForm.title.trim()) return;
    await createClassPost({ classId, ...postForm });
    setShowPostModal(false);
    setPostForm({ title: "", body: "", category: "Pengumuman", audience: "Semua", authorName: cls.homeroom_teacher || "Wali Kelas" });
  };

  const handleOpenEditAttendance = (studentItem: any) => {
    setEditingStudent(studentItem);
    setEditStatus((studentItem.status as any) || "HADIR");
    setEditNotes("");
  };

  const handleSaveAttendanceEdit = async () => {
    if (!editingStudent) return;
    startTransition(async () => {
      const res = await updateStudentAttendanceRecord({
        studentId: editingStudent.studentId,
        classId,
        date: classAttDate,
        status: editStatus,
        notes: editNotes,
      });

      if (res.success) {
        setEditingStudent(null);
        window.location.reload();
      }
    });
  };

  const exportClassAttendanceCsv = () => {
    const headers = ["Nama Siswa", "NIS", "Kelas", "Tanggal", "Status Absensi", "Check In", "Metode"];
    const rows = filteredClassAttendance.map((item) => [
      `"${item.studentName}"`,
      `"${item.nis}"`,
      `"Kelas ${cls.name}"`,
      `"${classAttDate}"`,
      `"${item.status}"`,
      `"${item.checkIn || "-"}"`,
      `"${item.method}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Rekap_Absensi_Kelas_${cls.name}_${classAttDate}.csv`);
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

  const todayName = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][new Date().getDay()];
  const now = new Date();
  const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const isOngoing = (timeStart: string, timeEnd: string) => {
    return currentTimeStr >= timeStart && currentTimeStr <= timeEnd;
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Premium Hero Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 via-white to-cloud border border-sky-100 p-6 sm:p-8 shadow-xs">
        {/* Decorative ambient blur blobs */}
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/4 w-80 h-80 bg-gradient-to-br from-sky-200/50 via-purple-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 translate-y-1/3 w-60 h-60 bg-gradient-to-tr from-emerald-100/40 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <Link
              href="/management/classroom"
              className="w-11 h-11 rounded-2xl bg-white border border-ink/10 shadow-2xs flex items-center justify-center text-ink-400 hover:bg-cloud hover:text-ink transition shrink-0 cursor-pointer"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[11px] font-extrabold uppercase tracking-wider border border-sky-200/60">
                  Classroom Management
                </span>
                {cls.grade && (
                  <span className="px-2.5 py-0.5 rounded-full bg-cloud text-ink-400 text-[11px] font-bold border border-ink/5">
                    Grade {cls.grade}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight flex items-center gap-3">
                Kelas {cls.name}
              </h1>
              <p className="text-xs sm:text-sm text-ink-400">
                Pusat manajemen ruang kelas, presensi siswa, jadwal pelajaran, dan komunikasi wali murid.
              </p>
            </div>
          </div>

          {/* Homeroom Teacher Badge */}
          <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md rounded-2xl p-3.5 border border-ink/10 shadow-2xs shrink-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky text-white flex items-center justify-center font-extrabold text-sm shadow-2xs">
              {cls.homeroom_teacher ? cls.homeroom_teacher.substring(0, 2).toUpperCase() : "WK"}
            </div>
            <div>
              <p className="text-[10px] font-bold text-ink-300 uppercase tracking-wider">Wali Kelas</p>
              <p className="text-sm font-extrabold text-ink leading-tight">{cls.homeroom_teacher || "Belum ditentukan"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Floating Segmented Tabs */}
      <div className="bg-white rounded-2xl p-1.5 border border-ink/10 shadow-xs flex items-center gap-1 overflow-x-auto hide-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-sky text-white shadow-2xs font-extrabold"
                  : "text-ink-400 hover:text-ink hover:bg-cloud"
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 ? (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isActive ? "bg-white text-sky" : "bg-coral text-white"}`}>
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* ===== TAB 1: OVERVIEW ===== */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Executive Stats Bento Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Total Students */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-ink/10 shadow-xs space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">Jumlah Siswa</span>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky flex items-center justify-center">
                  <Users size={20} />
                </div>
              </div>
              <p className="text-3xl font-black text-ink">{studentCount}</p>
              <p className="text-[11px] font-semibold text-sky">Kapasitas Kursi Terisi</p>
            </div>

            {/* Attendance Rate */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-ink/10 shadow-xs space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-leaf-600 uppercase tracking-wider">Kehadiran Hari Ini</span>
                <div className="w-10 h-10 rounded-xl bg-leaf-50 text-leaf flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-leaf">{summary.todayPct}%</p>
                <span className="text-xs font-bold text-leaf bg-leaf-50 px-2 py-0.5 rounded-full border border-leaf-100">Rate</span>
              </div>
              <div className="w-full bg-cloud h-1.5 rounded-full overflow-hidden">
                <div className="bg-leaf h-full rounded-full transition-all duration-500" style={{ width: `${summary.todayPct}%` }} />
              </div>
            </div>

            {/* Siswa Hadir Ratio */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-ink/10 shadow-xs space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Siswa Presensi</span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <UserCheck size={20} />
                </div>
              </div>
              <p className="text-3xl font-black text-purple-700">{summary.presentToday} <span className="text-sm font-normal text-ink-300">/ {summary.totalStudents}</span></p>
              <p className="text-[11px] font-semibold text-purple-600">Terdaftar di Absensi Harian</p>
            </div>

            {/* Pending Absences */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-ink/10 shadow-xs space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-coral-600 uppercase tracking-wider">Izin Pending</span>
                <div className="w-10 h-10 rounded-xl bg-coral-50 text-coral flex items-center justify-center">
                  <FileText size={20} />
                </div>
              </div>
              <p className="text-3xl font-black text-coral">{summary.pendingAbsences}</p>
              <p className="text-[11px] font-semibold text-coral">Membutuhkan Verifikasi Guru</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Today's Schedule Timeline */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-ink/10 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky flex items-center justify-center">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-ink">Jadwal Hari Ini · {todayName}</h3>
                    <p className="text-xs text-ink-400">Mata pelajaran aktif dan lokasi ruang kelas</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("jadwal")}
                  className="text-xs font-bold text-sky hover:underline cursor-pointer"
                >
                  Lihat Semua →
                </button>
              </div>

              {todaySchedule.length === 0 ? (
                <div className="py-12 text-center space-y-2 border border-dashed border-ink/10 rounded-2xl">
                  <CalendarDays size={28} className="text-ink-300 mx-auto" />
                  <p className="text-sm font-bold text-ink">Tidak Ada Jadwal Pelajaran Hari Ini</p>
                  <p className="text-xs text-ink-400">Nikmati waktu belajar mandiri atau kegiatan ekstrakurikuler.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaySchedule.map((s) => {
                    const ongoing = isOngoing(s.time_start, s.time_end);
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all border ${
                          ongoing
                            ? "bg-sky-50/80 border-sky/30 shadow-2xs"
                            : "bg-cloud/50 border-ink/5 hover:bg-white"
                        }`}
                      >
                        <div className="w-16 text-center shrink-0">
                          <p className={`font-mono text-xs font-extrabold ${ongoing ? "text-sky" : "text-ink"}`}>{s.time_start}</p>
                          <p className="font-mono text-[10px] text-ink-300">{s.time_end}</p>
                        </div>
                        <div className={`w-1 h-10 rounded-full ${ongoing ? "bg-sky animate-pulse" : "bg-ink/10"}`} />
                        <div className="flex-1">
                          <p className="font-extrabold text-sm text-ink">{s.subject_name}</p>
                          <p className="text-xs text-ink-400">{s.teacher_name}{s.room ? ` · Ruang ${s.room}` : ""}</p>
                        </div>
                        {ongoing && (
                          <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-sky text-white px-3 py-1 rounded-full shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                            Berlangsung
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Announcements Board */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-ink/10 p-6 shadow-xs space-y-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gold-50 text-gold-600 flex items-center justify-center">
                      <Bell size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-ink">Pengumuman Terbaru</h3>
                      <p className="text-xs text-ink-400">Papan edaran internal kelas</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("informasi")}
                    className="text-xs font-bold text-sky hover:underline cursor-pointer"
                  >
                    Semua →
                  </button>
                </div>

                {posts.length === 0 ? (
                  <div className="py-12 text-center space-y-2 border border-dashed border-ink/10 rounded-2xl">
                    <Bell size={28} className="text-ink-300 mx-auto" />
                    <p className="text-sm font-bold text-ink">Belum Ada Pengumuman</p>
                    <p className="text-xs text-ink-400">Pengumuman terbaru wali kelas akan tampil di sini.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {posts.slice(0, 3).map((p) => (
                      <div key={p.id} className="p-3.5 rounded-2xl bg-cloud/50 border border-ink/5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="bg-sky-50 text-sky text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-sky/20">
                            {p.category}
                          </span>
                          <span className="text-[10px] text-ink-300 font-medium">
                            {new Date(p.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                        <p className="font-extrabold text-xs sm:text-sm text-ink leading-snug">{p.title}</p>
                        <p className="text-[11px] text-ink-400 line-clamp-2">{p.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-ink/5 flex items-center justify-between text-xs font-bold text-ink-400">
                <span>Total Pengumuman: {posts.length}</span>
                <button
                  type="button"
                  onClick={() => setShowPostModal(true)}
                  className="text-sky hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Plus size={14} /> Buat Pengumuman Baru
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB 2: JADWAL PELAJARAN ===== */}
      {activeTab === "jadwal" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-3xl border border-ink/10 p-6 shadow-xs">
            <div>
              <h2 className="font-extrabold text-xl text-ink">Matriks Jadwal Pelajaran Pekanan</h2>
              <p className="text-xs text-ink-400">Jadwal belajar mengajar Kelas {cls.name} (Senin - Jumat)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-sky border border-sky-300" /> Akademik
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-leaf border border-leaf-300" /> Islamic Studies
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-purple-600 border border-purple-300" /> Ekstrakurikuler
              </span>
            </div>
          </div>

          {schedule.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-ink/15 space-y-3 shadow-xs">
              <div className="w-14 h-14 bg-cloud rounded-2xl flex items-center justify-center text-ink-300 mx-auto">
                <CalendarDays size={28} />
              </div>
              <p className="font-extrabold text-ink text-base">Jadwal Pelajaran Belum Disusun</p>
              <p className="text-xs text-ink-400 max-w-md mx-auto">
                Jadwal mingguan kelas ini belum diinput. Hubungi Kurikulum / Admin Sekolah untuk pengisian jadwal.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 border border-ink/10 shadow-xs overflow-x-auto">
              <table className="w-full text-xs sm:text-sm min-w-[760px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-ink-400 text-xs font-extrabold uppercase tracking-wider">
                    <th className="pb-3 pr-3 w-28">Jam Pelajaran</th>
                    {DAYS_ORDER.map((day) => (
                      <th key={day} className="pb-3 px-2 text-center bg-cloud/50 rounded-xl">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot) => {
                    const [start, end] = slot.split("–");
                    return (
                      <tr key={slot}>
                        <td className="pr-3 font-mono text-xs text-ink font-bold align-middle py-2">
                          <span className="px-2.5 py-1 rounded-xl bg-cloud border border-ink/5 inline-block">
                            {start} - {end}
                          </span>
                        </td>
                        {DAYS_ORDER.map((day) => {
                          const entry = scheduleByDay[day]?.find(
                            (s) => `${s.time_start}–${s.time_end}` === slot
                          );
                          const style = entry?.subject_category
                            ? SUBJECT_COLORS[entry.subject_category] || { bg: "bg-cloud", text: "text-ink", border: "border-ink/5" }
                            : null;

                          return (
                            <td key={day} className="p-1.5">
                              {entry ? (
                                <div className={`rounded-2xl p-3 border ${style?.bg} ${style?.text} ${style?.border} shadow-2xs space-y-0.5`}>
                                  <p className="font-extrabold text-xs">{entry.subject_name}</p>
                                  {entry.teacher_name && (
                                    <p className="font-medium text-[10px] opacity-80">{entry.teacher_name}</p>
                                  )}
                                  {entry.room && (
                                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md bg-white/70 text-[9px] font-bold">
                                      Ruang {entry.room}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="rounded-2xl p-3 bg-cloud/30 border border-ink/5 text-center text-ink-300 text-xs">
                                  -
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 3: DAFTAR SISWA ===== */}
      {activeTab === "siswa" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white rounded-3xl border border-ink/10 p-6 shadow-xs">
            <div>
              <h2 className="font-extrabold text-xl text-ink">Daftar Siswa Kelas {cls.name}</h2>
              <p className="text-xs text-ink-400">Total {studentCount} siswa aktif terdaftar di kelas ini</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Period toggle */}
              <div className="flex bg-cloud rounded-2xl p-1 text-xs font-bold border border-ink/5">
                {(["harian", "mingguan", "bulanan"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAttPeriod(p)}
                    className={`px-3 py-1.5 rounded-xl transition-all capitalize cursor-pointer ${
                      attPeriod === p ? "bg-white text-sky shadow-2xs font-extrabold" : "text-ink-400 hover:text-ink"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Cari siswa / NIS..."
                  className="pl-9 h-10 rounded-xl bg-cloud border-transparent focus-visible:border-sky text-xs w-44 sm:w-56"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-ink/10 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-ink/5 flex items-center justify-between text-xs text-ink-400">
              <span>Menampilkan {filteredStudents.length === 0 ? 0 : startIndex + 1} - {endIndex} dari total {filteredStudents.length} siswa</span>
            </div>

            {paginatedStudents.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-14 h-14 bg-cloud rounded-2xl flex items-center justify-center text-ink-300 mx-auto">
                  <Users size={28} />
                </div>
                <p className="font-extrabold text-ink text-base">Tidak Ada Siswa Ditemukan</p>
                <p className="text-xs text-ink-400 max-w-sm mx-auto">
                  Kata kunci pencarian Anda tidak cocok dengan nama atau NIS siswa di kelas ini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-cloud/60 border-b border-ink/5 text-ink-400 font-bold uppercase text-[11px] tracking-wider">
                      <th className="py-3.5 px-6">Siswa</th>
                      <th className="py-3.5 px-4">NIS</th>
                      <th className="py-3.5 px-4">
                        {attPeriod === "harian" ? "Kehadiran Hari Ini" : attPeriod === "mingguan" ? "% Kehadiran Pekan Ini" : "% Kehadiran Bulan Ini"}
                      </th>
                      <th className="py-3.5 px-6 text-right">Profil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5 font-semibold text-ink">
                    {paginatedStudents.map((s) => {
                      let statusBadge;
                      if (attPeriod === "harian") {
                        const isHadir = s.todayStatus === "HADIR";
                        const isSakit = ["SAKIT", "IZIN"].includes(s.todayStatus);
                        const badgeStyle = isHadir
                          ? "bg-leaf-50 text-leaf border-leaf-200"
                          : isSakit
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-coral-50 text-coral border-coral-200";
                        const label = isHadir
                          ? `Hadir (${s.todayCheckIn ? s.todayCheckIn.slice(0, 5) : "Checked"})`
                          : isSakit
                          ? s.todayStatus
                          : "Belum Presensi / Alpha";
                        statusBadge = (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeStyle}`}>
                            {isHadir ? <CheckCircle2 size={13} /> : isSakit ? <Clock size={13} /> : <XCircle size={13} />}
                            {label}
                          </span>
                        );
                      } else {
                        const val = attPeriod === "mingguan" ? s.weeklyPct : s.monthlyPct;
                        if (val === null) {
                          statusBadge = <span className="text-xs text-ink-300 font-normal">Data belum tersedia</span>;
                        } else {
                          const barColor = val >= 90 ? "bg-leaf" : val >= 75 ? "bg-amber-500" : "bg-coral";
                          statusBadge = (
                            <div className="flex items-center gap-3">
                              <div className="w-32 h-2 rounded-full bg-cloud overflow-hidden border border-ink/5">
                                <div className={`h-full ${barColor} rounded-full`} style={{ width: `${val}%` }} />
                              </div>
                              <span className="font-extrabold text-xs text-ink">{val}%</span>
                            </div>
                          );
                        }
                      }

                      return (
                        <tr key={s.id} className="hover:bg-cloud/40 transition-colors">
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              {s.profile_picture ? (
                                <img src={s.profile_picture} alt={s.full_name} className="w-10 h-10 rounded-xl object-cover border border-ink/10" />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky border border-sky/20 flex items-center justify-center font-extrabold text-sm shrink-0">
                                  {s.full_name?.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-extrabold text-ink text-sm leading-snug">{s.full_name}</p>
                                <p className="text-[11px] text-ink-300 font-mono">ID: {s.id.slice(0, 8)}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-xs text-ink-400">{s.nis || "-"}</td>
                          <td className="py-3.5 px-4">{statusBadge}</td>
                          <td className="py-3.5 px-6 text-right">
                            <Link
                              href={`/management/siswa/${s.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cloud hover:bg-sky-50 text-ink-400 hover:text-sky font-bold text-xs border border-ink/5 transition cursor-pointer"
                            >
                              <span>Lihat Profil</span>
                              <ChevronRight size={14} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {filteredStudents.length > 0 && (
              <div className="px-6 py-4 bg-cloud/40 border-t border-ink/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
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
                          pageSize === size ? "bg-sky text-white shadow-2xs" : "text-ink-400 hover:text-ink"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  <span className="text-ink-300 font-semibold">per halaman</span>
                </div>

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
        </div>
      )}

      {/* ===== TAB 4: REKAP ABSENSI KELAS (NEW DEDICATED TAB!) ===== */}
      {activeTab === "absensi" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Action Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl border border-ink/10 p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-0.5 rounded-full bg-sky-50 text-sky text-[11px] font-extrabold border border-sky/20">
                  Kelas {cls.name}
                </span>
                <span className="text-xs font-semibold text-ink-400">• Modul Presensi Kelas</span>
              </div>
              <h2 className="font-extrabold text-xl text-ink">Rekap Absensi Siswa Kelas {cls.name}</h2>
              <p className="text-xs text-ink-400">Rekapitulasi presensi harian, histori check-in RFID, dan manajemen perizinan khusus kelas ini.</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Date Selector */}
              <div className="flex items-center gap-2 bg-cloud border border-ink/10 rounded-2xl px-3 py-2">
                <Calendar size={16} className="text-sky shrink-0" />
                <input
                  type="date"
                  value={classAttDate}
                  onChange={(e) => setClassAttDate(e.target.value)}
                  className="text-xs sm:text-sm font-bold text-ink bg-transparent focus:outline-none cursor-pointer"
                />
              </div>

              <Button
                onClick={exportClassAttendanceCsv}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xs transition cursor-pointer"
              >
                <FileSpreadsheet size={16} />
                <span>Export CSV Kelas</span>
              </Button>

              <Link
                href={`/management/absensi?classId=${classId}`}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky font-extrabold text-xs border border-sky/20 transition cursor-pointer"
              >
                <span>Absensi Umum Sekolah</span>
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>

          {/* Class Attendance Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-ink/10 shadow-xs space-y-1">
              <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">Total Siswa</span>
              <p className="text-2xl sm:text-3xl font-black text-ink">{studentCount}</p>
              <p className="text-[11px] font-semibold text-sky">Kelas {cls.name}</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-ink/10 shadow-xs space-y-1">
              <span className="text-xs font-bold text-leaf-600 uppercase tracking-wider">Hadir</span>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl sm:text-3xl font-black text-leaf">{classHadirCount}</p>
                <span className="text-xs font-bold text-leaf bg-leaf-50 px-2 py-0.5 rounded-full border border-leaf-100">{classPct}%</span>
              </div>
              <div className="w-full bg-cloud h-1.5 rounded-full overflow-hidden">
                <div className="bg-leaf h-full rounded-full transition-all duration-500" style={{ width: `${classPct}%` }} />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-ink/10 shadow-xs space-y-1">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Izin & Sakit</span>
              <p className="text-2xl sm:text-3xl font-black text-amber-600">{classIzinCount}</p>
              <p className="text-[11px] font-semibold text-ink-400">Tercatat di Perizinan</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-ink/10 shadow-xs space-y-1">
              <span className="text-xs font-bold text-coral-600 uppercase tracking-wider">Alpha</span>
              <p className="text-2xl sm:text-3xl font-black text-coral">{classAlphaCount}</p>
              <p className="text-[11px] font-semibold text-coral">Tanpa Keterangan</p>
            </div>
          </div>

          {/* Controls Bar & Filter Status */}
          <div className="bg-white rounded-3xl border border-ink/10 p-4 sm:p-6 space-y-4 shadow-xs">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
                <Input
                  placeholder="Cari nama siswa atau NIS di kelas ini..."
                  value={classAttSearch}
                  onChange={(e) => {
                    setClassAttSearch(e.target.value);
                    setClassAttPage(1);
                  }}
                  className="pl-10 h-11 rounded-2xl bg-cloud border-transparent focus-visible:border-sky text-xs sm:text-sm"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-xs font-bold text-ink-300 shrink-0 uppercase tracking-wider">Status:</span>
                {[
                  { key: "ALL", label: "Semua", count: classAttendanceItems.length },
                  { key: "HADIR", label: "Hadir", count: classAttendanceItems.filter((i) => i.status === "HADIR").length },
                  { key: "IZIN", label: "Izin", count: classAttendanceItems.filter((i) => i.status === "IZIN").length },
                  { key: "SAKIT", label: "Sakit", count: classAttendanceItems.filter((i) => i.status === "SAKIT").length },
                  { key: "ALPHA", label: "Alpha", count: classAttendanceItems.filter((i) => i.status === "ALPHA").length },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setClassAttStatus(tab.key);
                      setClassAttPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      classAttStatus === tab.key
                        ? "bg-sky text-white shadow-xs"
                        : "bg-cloud text-ink-400 hover:text-ink hover:bg-ink/5"
                    }`}
                  >
                    {tab.label} <span className="opacity-80 font-normal">({tab.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Class Attendance Table */}
          <div className="bg-white rounded-3xl border border-ink/10 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-ink/5 text-xs text-ink-400">
              <span>Menampilkan {filteredClassAttendance.length === 0 ? 0 : classAttStartIndex + 1} - {classAttEndIndex} dari total {filteredClassAttendance.length} siswa di Kelas {cls.name}</span>
            </div>

            {paginatedClassAttendance.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-14 h-14 bg-cloud rounded-2xl flex items-center justify-center text-ink-300 mx-auto">
                  <CalendarCheck size={28} />
                </div>
                <p className="font-extrabold text-ink text-base">Tidak Ada Presensi Siswa Found</p>
                <p className="text-xs text-ink-400 max-w-sm mx-auto">
                  Tidak ditemukan data siswa yang cocok dengan filter status atau pencarian di Kelas {cls.name}.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-cloud/60 border-b border-ink/5 text-ink-400 font-bold uppercase text-[11px] tracking-wider">
                      <th className="py-3.5 px-6">Siswa & NIS</th>
                      <th className="py-3.5 px-4">Status Absensi</th>
                      <th className="py-3.5 px-4">Waktu Check-In</th>
                      <th className="py-3.5 px-4">Metode Presensi</th>
                      <th className="py-3.5 px-6 text-right">Aksi Wali Kelas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5 font-semibold text-ink">
                    {paginatedClassAttendance.map((item) => {
                      return (
                        <tr key={item.studentId} className="hover:bg-cloud/40 transition-colors">
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              {item.profilePicture ? (
                                <img src={item.profilePicture} alt={item.studentName} className="w-10 h-10 rounded-xl object-cover border border-ink/10" />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky border border-sky/20 font-bold flex items-center justify-center shrink-0">
                                  {item.studentName.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-extrabold text-ink text-sm leading-snug">{item.studentName}</p>
                                <p className="text-[11px] font-mono text-ink-300">NIS: {item.nis}</p>
                              </div>
                            </div>
                          </td>

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
                          </td>

                          <td className="py-3.5 px-4 font-mono text-xs">
                            <span className="font-bold text-ink">{item.checkIn ? item.checkIn.substring(0, 5) : "-"}</span>
                          </td>

                          <td className="py-3.5 px-4 text-xs text-ink-400 font-medium">
                            <span className="inline-flex items-center gap-1">
                              <Sparkles size={12} className="text-sky" /> {item.method}
                            </span>
                          </td>

                          <td className="py-3.5 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenEditAttendance(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cloud hover:bg-sky-50 text-ink-400 hover:text-sky font-bold text-xs border border-ink/5 transition cursor-pointer"
                            >
                              <Edit3 size={14} />
                              <span>Edit Presensi</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {filteredClassAttendance.length > 0 && (
              <div className="px-6 py-4 bg-cloud/40 border-t border-ink/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink-400">Tampilkan:</span>
                  <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-ink/10 shadow-2xs">
                    {[20, 50, 100].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setClassAttPageSize(size);
                          setClassAttPage(1);
                        }}
                        className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          classAttPageSize === size ? "bg-sky text-white shadow-2xs" : "text-ink-400 hover:text-ink"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  <span className="text-ink-300 font-semibold">per halaman</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={classAttActivePage <= 1}
                    onClick={() => setClassAttPage((p) => Math.max(1, p - 1))}
                    className="w-8 h-8 rounded-xl bg-white border border-ink/10 flex items-center justify-center text-ink hover:bg-cloud disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {getPageNumbers(classAttActivePage, classAttTotalPages).map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={typeof p !== "number"}
                      onClick={() => typeof p === "number" && setClassAttPage(p)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                        p === classAttActivePage
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
                    disabled={classAttActivePage >= classAttTotalPages}
                    onClick={() => setClassAttPage((p) => Math.min(classAttTotalPages, p + 1))}
                    className="w-8 h-8 rounded-xl bg-white border border-ink/10 flex items-center justify-center text-ink hover:bg-cloud disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== TAB 5: PERIZINAN ===== */}
      {activeTab === "perizinan" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-3xl border border-ink/10 p-6 shadow-xs">
            <div>
              <h2 className="font-extrabold text-xl text-ink">Perizinan Siswa Kelas {cls.name}</h2>
              <p className="text-xs text-ink-400">Pengajuan izin & sakit oleh orang tua murid</p>
            </div>
            <div className="flex bg-cloud rounded-2xl p-1 text-xs font-bold border border-ink/5">
              {(["all", "PENDING", "done"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setAbsenceFilter(f)}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    absenceFilter === f ? "bg-white text-ink shadow-2xs font-extrabold" : "text-ink-400 hover:text-ink"
                  }`}
                >
                  {f === "all" ? "Semua" : f === "PENDING" ? `Pending (${summary.pendingAbsences})` : "Selesai"}
                </button>
              ))}
            </div>
          </div>

          {filteredAbsences.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-ink/15 space-y-3 shadow-xs">
              <div className="w-14 h-14 bg-cloud rounded-2xl flex items-center justify-center text-ink-300 mx-auto">
                <FileText size={28} />
              </div>
              <p className="font-extrabold text-ink text-base">Tidak Ada Permohonan Perizinan</p>
              <p className="text-xs text-ink-400 max-w-sm mx-auto">
                Tidak ditemukan riwayat perizinan yang sesuai dengan filter yang dipilih.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAbsences.map((a) => {
                const isPendingState = a.status === "PENDING";
                const isApproved = a.status === "APPROVED";
                const typeStyle = ABSENCE_TYPE_COLORS[a.absence_type] || { bg: "bg-cloud", text: "text-ink", border: "border-ink/10" };

                return (
                  <div
                    key={a.id}
                    className={`bg-white rounded-3xl p-6 border border-ink/10 shadow-xs space-y-4 transition-all ${
                      !isPendingState ? "opacity-80 hover:opacity-100" : "ring-1 ring-amber-200"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky border border-sky/20 flex items-center justify-center font-extrabold text-sm shrink-0">
                          {a.students?.full_name?.substring(0, 2).toUpperCase() || "SW"}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-base text-ink">{a.students?.full_name}</h3>
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
                              {a.absence_type}
                            </span>
                          </div>
                          <p className="text-xs text-ink-400">
                            Diajukan oleh <strong className="text-ink">{a.submitted_by}</strong> · Tanggal:{" "}
                            <span className="font-semibold text-ink">
                              {new Date(a.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                              {a.end_date !== a.start_date
                                ? ` - ${new Date(a.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`
                                : ""}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Approval Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isPendingState ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(a.id)}
                              disabled={isPending}
                              className="px-4 py-2 rounded-xl bg-leaf hover:bg-leaf-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer disabled:opacity-50"
                            >
                              <Check size={14} /> Setujui
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(a.id)}
                              disabled={isPending}
                              className="px-4 py-2 rounded-xl bg-cloud hover:bg-coral-50 text-ink-400 hover:text-coral font-bold text-xs flex items-center gap-1.5 border border-ink/10 transition cursor-pointer disabled:opacity-50"
                            >
                              <X size={14} /> Tolak
                            </button>
                          </>
                        ) : isApproved ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-leaf-50 text-leaf border border-leaf-200">
                            <CheckCircle2 size={14} /> Disetujui
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-coral-50 text-coral border border-coral-200">
                            <XCircle size={14} /> Ditolak
                          </span>
                        )}
                      </div>
                    </div>

                    {a.reason && (
                      <div className="p-3.5 rounded-2xl bg-cloud/60 border border-ink/5 text-xs text-ink-400 font-medium italic">
                        &quot;{a.reason}&quot;
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 6: PENGUMUMAN INFORMASI ===== */}
      {activeTab === "informasi" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-3xl border border-ink/10 p-6 shadow-xs">
            <div>
              <h2 className="font-extrabold text-xl text-ink">Pengumuman & Informasi Kelas {cls.name}</h2>
              <p className="text-xs text-ink-400">Papan pengumuman resmi dari wali kelas dan pihak sekolah</p>
            </div>
            <Button
              type="button"
              onClick={() => setShowPostModal(true)}
              className="bg-sky hover:bg-sky/90 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-xs transition cursor-pointer flex items-center gap-2"
            >
              <Plus size={16} /> Buat Pengumuman Baru
            </Button>
          </div>

          {posts.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-ink/15 space-y-3 shadow-xs">
              <div className="w-14 h-14 bg-cloud rounded-2xl flex items-center justify-center text-ink-300 mx-auto">
                <Bell size={28} />
              </div>
              <p className="font-extrabold text-ink text-base">Belum Ada Pengumuman</p>
              <p className="text-xs text-ink-400 max-w-sm mx-auto">
                Klik tombol &quot;Buat Pengumuman Baru&quot; untuk menyiarkan informasi ke wali murid dan siswa.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((p) => {
                return (
                  <div key={p.id} className="bg-white rounded-3xl border border-ink/10 p-6 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-sky-50 text-sky border border-sky/20">
                          {p.category}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-cloud text-ink-400 text-[11px] font-bold">
                          Untuk: {p.audience}
                        </span>
                      </div>
                      <span className="text-xs text-ink-300 font-medium">
                        {new Date(p.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-lg text-ink leading-snug">{p.title}</h3>
                    {p.body && (
                      <p className="text-xs sm:text-sm text-ink-400 leading-relaxed whitespace-pre-line">
                        {p.body}
                      </p>
                    )}

                    <div className="pt-2 border-t border-ink/5 flex items-center justify-between text-xs text-ink-400 font-semibold">
                      <span>Diterbitkan oleh: <strong className="text-ink">{p.author_name}</strong></span>
                      <span className="inline-flex items-center gap-1 text-leaf">
                        <CheckCircle2 size={13} /> Terpublikasi
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE POST MODAL OVERLAY */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-ink">Buat Pengumuman Kelas {cls.name}</h3>
                <p className="text-xs text-ink-400 mt-0.5">Sampaikan pengumuman atau instruksi untuk siswa dan orang tua.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="w-8 h-8 rounded-full bg-cloud hover:bg-ink/10 flex items-center justify-center text-ink-400 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1 block">Judul Pengumuman</label>
                <Input
                  value={postForm.title}
                  onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  placeholder="Contoh: Persiapan Field Trip Ke Museum..."
                  className="rounded-2xl bg-cloud border-transparent focus-visible:border-sky text-xs sm:text-sm h-11"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1 block">Isi Pengumuman</label>
                <textarea
                  value={postForm.body}
                  onChange={(e) => setPostForm({ ...postForm, body: e.target.value })}
                  placeholder="Tuliskan pesan lengkap pengumuman di sini..."
                  rows={4}
                  className="w-full p-3 rounded-2xl bg-cloud border border-ink/10 text-xs sm:text-sm text-ink focus:outline-none focus:border-sky"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1 block">Kategori</label>
                  <select
                    value={postForm.category}
                    onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-cloud border border-ink/10 text-xs font-bold text-ink focus:outline-none cursor-pointer"
                  >
                    <option>Pengumuman</option>
                    <option>Kegiatan</option>
                    <option>Penting</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1 block">Ditujukan Untuk</label>
                  <select
                    value={postForm.audience}
                    onChange={(e) => setPostForm({ ...postForm, audience: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-cloud border border-ink/10 text-xs font-bold text-ink focus:outline-none cursor-pointer"
                  >
                    <option>Semua</option>
                    <option>Orang Tua & Siswa</option>
                    <option>Siswa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1 block">Nama Pembuat</label>
                <Input
                  value={postForm.authorName}
                  onChange={(e) => setPostForm({ ...postForm, authorName: e.target.value })}
                  placeholder="Wali Kelas / Admin"
                  className="rounded-2xl bg-cloud border-transparent focus-visible:border-sky text-xs sm:text-sm h-11"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-ink/5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPostModal(false)}
                  className="rounded-2xl text-xs font-bold border-ink/10 cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={handleCreatePost}
                  disabled={!postForm.title.trim()}
                  className="bg-sky hover:bg-sky/90 text-white font-bold text-xs rounded-2xl px-5 cursor-pointer disabled:opacity-50"
                >
                  Publikasikan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CLASS ATTENDANCE MODAL OVERLAY */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-ink">Edit Presensi Siswa Kelas</h3>
                <p className="text-xs text-ink-400 mt-1">
                  Ubah status presensi untuk <strong className="text-ink">{editingStudent.studentName}</strong> (Kelas {cls.name}) tanggal {classAttDate}.
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
                  Catatan / Alasan Wali Kelas
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Contoh: Izin terlambat karena kendala transportasi..."
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
                  onClick={handleSaveAttendanceEdit}
                  disabled={isPending}
                  className="bg-sky hover:bg-sky/90 text-white font-bold text-xs rounded-2xl px-5 cursor-pointer"
                >
                  {isPending ? "Menyimpan..." : "Simpan Presensi"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
