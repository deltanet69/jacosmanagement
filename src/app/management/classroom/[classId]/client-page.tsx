"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Users, CalendarDays, BookOpen, FileText, Bell,
  Check, X, Plus, ChevronRight, Clock, TrendingUp,
  CheckCircle2, XCircle, AlertCircle, UserCheck, ArrowLeft
} from "lucide-react";
import { approveAbsence, rejectAbsence, createClassPost } from "../actions";

const DAYS_ORDER = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT"];

const SUBJECT_COLORS: Record<string, string> = {
  akademik: "bg-sky-50 text-sky-700",
  islamic: "bg-leaf-50 text-leaf-600",
  ekstrakurikuler: "bg-violet-50 text-violet-600",
};

const ABSENCE_TYPE_COLORS: Record<string, string> = {
  SAKIT: "bg-coral-50 text-coral-600",
  IZIN: "bg-sky-50 text-sky-600",
  LAINNYA: "bg-gold-50 text-gold-600",
};

type Tab = "overview" | "jadwal" | "siswa" | "perizinan" | "informasi";

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

  // Post form state
  const [postForm, setPostForm] = useState({
    title: "", body: "", category: "Pengumuman", audience: "Semua", authorName: "Admin"
  });

  const TABS: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "jadwal", label: "Jadwal", icon: CalendarDays },
    { id: "siswa", label: "Siswa", icon: Users },
    { id: "perizinan", label: "Perizinan", icon: FileText, badge: summary.pendingAbsences },
    { id: "informasi", label: "Informasi", icon: Bell },
  ];

  // Group schedule by day
  const scheduleByDay = DAYS_ORDER.reduce<Record<string, any[]>>((acc, day) => {
    acc[day] = schedule.filter((s) => s.day_of_week === day);
    return acc;
  }, {});

  // All unique time slots
  const timeSlots = [...new Set(schedule.map((s) => `${s.time_start}–${s.time_end}`))].sort();

  // Filtered students
  const filteredStudents = students.filter((s) =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.nis?.toLowerCase().includes(search.toLowerCase())
  );

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
    await createClassPost({ classId, ...postForm });
    setShowPostModal(false);
    setPostForm({ title: "", body: "", category: "Pengumuman", audience: "Semua", authorName: "Admin" });
  };

  const todayName = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][new Date().getDay()];
  const now = new Date();
  const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const isOngoing = (timeStart: string, timeEnd: string) => {
    return currentTimeStr >= timeStart && currentTimeStr <= timeEnd;
  };

  return (
    <div className="flex min-h-screen">


      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Class Header + Tabs */}
        <div className="bg-white border-b border-ink/8 px-6 sm:px-10 pt-8 sticky top-0 z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-4">
              <Link 
                href="/management/classroom" 
                className="w-11 h-11 rounded-full bg-white shadow-sm border border-ink/5 flex items-center justify-center text-ink-400 hover:bg-cloud transition"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <p className="text-xs font-bold text-sky uppercase tracking-widest mb-1">Classroom</p>
                <h1 className="font-display text-3xl font-extrabold text-ink">Kelas {cls.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-cloud rounded-2xl px-4 py-2.5">
              <div className="w-9 h-9 rounded-full bg-leaf flex items-center justify-center font-bold text-xs text-white">
                {cls.homeroom_teacher ? cls.homeroom_teacher.substring(0, 2).toUpperCase() : "WK"}
              </div>
              <div>
                <p className="text-xs text-ink-300 font-semibold">Wali Kelas</p>
                <p className="text-sm font-bold -mt-0.5">{cls.homeroom_teacher || "Belum diset"}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto -mb-px hide-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-sky text-sky"
                    : "border-transparent text-ink-400 hover:text-ink"
                }`}
              >
                <tab.icon size={15} />
                {tab.label}
                {tab.badge && tab.badge > 0 ? (
                  <span className="bg-coral text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <main className="flex-1 px-6 sm:px-10 py-8 max-w-6xl">

          {/* ===== TAB: OVERVIEW ===== */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: "👥", label: "Jumlah Siswa", value: studentCount, color: "bg-sky-50 text-sky" },
                  { icon: "✓", label: "Hadir Hari Ini", value: `${summary.todayPct}%`, color: "bg-leaf-50 text-leaf-600" },
                  { icon: "📊", label: "Siswa Hadir", value: `${summary.presentToday}/${summary.totalStudents}`, color: "bg-violet-50 text-violet-600" },
                  { icon: "📝", label: "Perizinan Pending", value: summary.pendingAbsences, color: "bg-coral-50 text-coral-600" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-ink/5">
                    <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-4 text-lg`}>
                      {stat.icon}
                    </div>
                    <p className="font-display text-2xl font-extrabold text-ink">{stat.value}</p>
                    <p className="text-xs text-ink-300 font-semibold mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Today's Schedule */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-ink/5">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-display text-lg font-bold">Jadwal Hari Ini · {todayName}</h2>
                    <button
                      onClick={() => setActiveTab("jadwal")}
                      className="text-xs font-bold text-sky hover:underline"
                    >
                      Lihat lengkap →
                    </button>
                  </div>

                  {todaySchedule.length === 0 ? (
                    <p className="text-ink-300 text-sm font-medium py-8 text-center">Tidak ada jadwal hari ini</p>
                  ) : (
                    <div className="space-y-3">
                      {todaySchedule.map((s) => {
                        const ongoing = isOngoing(s.time_start, s.time_end);
                        return (
                          <div
                            key={s.id}
                            className={`flex items-center gap-4 p-3 rounded-2xl ${ongoing ? "bg-sky-50" : "hover:bg-cloud/50"} transition-colors`}
                          >
                            <div className="w-14 text-center shrink-0">
                              <p className={`font-mono text-xs font-bold ${ongoing ? "text-sky" : "text-ink-400"}`}>{s.time_start}</p>
                              <p className="font-mono text-[10px] text-ink-300">{s.time_end}</p>
                            </div>
                            <div className={`w-1 h-10 rounded-full ${ongoing ? "bg-sky" : "bg-ink/10"}`} />
                            <div className="flex-1">
                              <p className="font-bold text-sm">{s.subject_name}</p>
                              <p className="text-xs text-ink-300">{s.teacher_name}{s.room ? ` · ${s.room}` : ""}</p>
                            </div>
                            {ongoing && (
                              <span className="text-xs font-bold bg-sky text-white px-3 py-1 rounded-full">
                                Berlangsung
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Posts */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-ink/5">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-display text-lg font-bold">Info Terbaru</h2>
                    <button
                      onClick={() => setActiveTab("informasi")}
                      className="text-xs font-bold text-sky hover:underline"
                    >
                      Semua →
                    </button>
                  </div>

                  {posts.length === 0 ? (
                    <p className="text-ink-300 text-sm text-center py-6">Belum ada pengumuman</p>
                  ) : (
                    <div className="space-y-4">
                      {posts.slice(0, 3).map((p, i) => (
                        <div key={p.id} className={`${i < 2 ? "pb-4 border-b border-ink/5" : ""}`}>
                          <span className="inline-block bg-gold-50 text-gold-600 text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">
                            {p.category}
                          </span>
                          <p className="font-bold text-sm leading-snug">{p.title}</p>
                          <p className="text-xs text-ink-300 mt-1">
                            {new Date(p.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} · {p.author_name}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== TAB: JADWAL ===== */}
          {activeTab === "jadwal" && (
            <div className="animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display text-2xl font-bold">Jadwal Pelajaran</h2>
                  <p className="text-ink-400 text-sm">Kelas {cls.name}</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold flex-wrap">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky inline-block" />Akademik</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-leaf inline-block" />Islamic Studies</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet inline-block" />Ekstrakurikuler</span>
                </div>
              </div>

              {schedule.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-ink/15">
                  <CalendarDays size={40} className="text-ink-200 mx-auto mb-3" />
                  <p className="font-bold text-ink-400">Jadwal belum diisi</p>
                  <p className="text-sm text-ink-300 mt-1">Tambahkan jadwal melalui Supabase SQL Editor ke tabel class_schedules</p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-ink/5 overflow-x-auto">
                  <table className="w-full text-sm min-w-[720px] border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-left text-ink-300 text-xs font-bold uppercase tracking-wide">
                        <th className="pb-2 pr-3 w-24">Jam</th>
                        {DAYS_ORDER.map((day) => (
                          <th key={day} className={`pb-2 px-2 ${day === "RABU" || day === "JUMAT" ? "bg-sky-50/50 rounded-t-xl" : ""}`}>
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
                            <td className="pr-3 font-mono text-xs text-ink-300 font-bold align-top pt-2">{start}</td>
                            {DAYS_ORDER.map((day) => {
                              const entry = scheduleByDay[day]?.find(
                                (s) => `${s.time_start}–${s.time_end}` === slot
                              );
                              return (
                                <td key={day} className={`p-1 ${day === "RABU" || day === "JUMAT" ? "bg-sky-50/20" : ""}`}>
                                  {entry ? (
                                    <div className={`rounded-xl px-2.5 py-2 text-xs font-bold ${SUBJECT_COLORS[entry.subject_category] || "bg-cloud text-ink-400"}`}>
                                      <p>{entry.subject_name}</p>
                                      {entry.teacher_name && <p className="font-normal opacity-70 text-[10px] mt-0.5">{entry.teacher_name}</p>}
                                    </div>
                                  ) : (
                                    <div className="rounded-xl px-2.5 py-2 text-xs text-ink-200">—</div>
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

          {/* ===== TAB: SISWA ===== */}
          {activeTab === "siswa" && (
            <div className="animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display text-2xl font-bold">Daftar Siswa</h2>
                  <p className="text-ink-400 text-sm">{studentCount} siswa terdaftar di Kelas {cls.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Period toggle */}
                  <div className="flex bg-cloud rounded-full p-1 text-xs font-bold">
                    {(["harian", "mingguan", "bulanan"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setAttPeriod(p)}
                        className={`px-3.5 py-1.5 rounded-full transition-colors capitalize ${
                          attPeriod === p ? "bg-white text-ink shadow-sm font-bold" : "text-ink-400"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari siswa..."
                    className="text-sm rounded-full border border-ink/10 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky/30 w-40"
                  />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-ink/5 overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="text-left text-ink-300 text-xs font-bold uppercase tracking-wide border-b border-ink/5">
                      <th className="pb-3 pr-4">Siswa</th>
                      <th className="pb-3 pr-4">NIS</th>
                      <th className="pb-3 pr-4">
                        {attPeriod === "harian" ? "Kehadiran Hari Ini" : attPeriod === "mingguan" ? "% Minggu Ini" : "% Bulan Ini"}
                      </th>
                      <th className="pb-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {filteredStudents.map((s) => {
                      let cell;
                      if (attPeriod === "harian") {
                        const isHadir = s.todayStatus === "HADIR";
                        const isSakit = ["SAKIT", "IZIN"].includes(s.todayStatus);
                        const cls2 = isHadir
                          ? "bg-leaf-50 text-leaf-600"
                          : isSakit
                          ? "bg-coral-50 text-coral-600"
                          : "bg-cloud text-ink-300";
                        const label = isHadir
                          ? `Hadir ${s.todayCheckIn ? s.todayCheckIn.slice(0, 5) : ""}`
                          : isSakit
                          ? s.todayStatus
                          : "Belum absen";
                        cell = (
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${cls2}`}>
                            {label}
                          </span>
                        );
                      } else {
                        const val = attPeriod === "mingguan" ? s.weeklyPct : s.monthlyPct;
                        if (val === null) {
                          cell = <span className="text-xs text-ink-300">Data belum cukup</span>;
                        } else {
                          const barColor = val >= 95 ? "bg-leaf" : val >= 85 ? "bg-gold" : "bg-coral";
                          cell = (
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 rounded-full bg-cloud overflow-hidden">
                                <div className={`h-full ${barColor}`} style={{ width: `${val}%` }} />
                              </div>
                              <span className="font-bold text-xs">{val}%</span>
                            </div>
                          );
                        }
                      }
                      return (
                        <tr key={s.id} className="hover:bg-cloud/30 transition-colors">
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-3">
                              {s.profile_picture ? (
                                <img src={s.profile_picture} alt={s.full_name} className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-xs font-bold text-sky">
                                  {s.full_name?.charAt(0)}
                                </div>
                              )}
                              <span className="font-semibold">{s.full_name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 pr-4 font-mono text-ink-400 text-xs">{s.nis || "—"}</td>
                          <td className="py-3.5 pr-4">{cell}</td>
                          <td className="py-3.5">
                            <Link
                              href={`/management/siswa/${s.id}`}
                              className="text-xs font-bold text-sky hover:underline"
                            >
                              Lihat profil →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredStudents.length === 0 && (
                  <p className="text-center text-ink-300 py-10 text-sm">Tidak ada siswa ditemukan</p>
                )}
              </div>
            </div>
          )}

          {/* ===== TAB: PERIZINAN ===== */}
          {activeTab === "perizinan" && (
            <div className="animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display text-2xl font-bold">Perizinan Kelas {cls.name}</h2>
                  <p className="text-ink-400 text-sm">Pengajuan izin & sakit dari orang tua</p>
                </div>
                <div className="flex bg-cloud rounded-full p-1 text-xs font-bold">
                  {(["all", "PENDING", "done"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setAbsenceFilter(f)}
                      className={`px-3.5 py-1.5 rounded-full transition-colors ${
                        absenceFilter === f ? "bg-white text-ink shadow-sm font-bold" : "text-ink-400"
                      }`}
                    >
                      {f === "all" ? "Semua" : f === "PENDING" ? "Pending" : "Selesai"}
                    </button>
                  ))}
                </div>
              </div>

              {filteredAbsences.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-ink/15">
                  <FileText size={40} className="text-ink-200 mx-auto mb-3" />
                  <p className="font-bold text-ink-400">Tidak ada perizinan</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAbsences.map((a) => {
                    const isPending = a.status === "PENDING";
                    const isApproved = a.status === "APPROVED";
                    return (
                      <div
                        key={a.id}
                        className={`bg-white rounded-3xl p-6 shadow-sm border border-ink/5 transition-opacity ${!isPending ? "opacity-70" : ""}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${ABSENCE_TYPE_COLORS[a.absence_type] || "bg-cloud text-ink"}`}>
                              {a.students?.full_name?.charAt(0) || "?"}
                            </div>
                            <div>
                              <p className="font-bold text-sm">
                                {a.students?.full_name}
                                <span className="font-normal text-ink-300"> · diajukan oleh {a.submitted_by}</span>
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${ABSENCE_TYPE_COLORS[a.absence_type] || "bg-cloud text-ink"}`}>
                                  {a.absence_type}
                                </span>
                                <span className="text-xs text-ink-300">
                                  {new Date(a.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}
                                  {a.end_date !== a.start_date
                                    ? ` – ${new Date(a.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}`
                                    : ""}
                                </span>
                              </div>
                              {a.reason && (
                                <p className="text-sm text-ink-400 mt-2 max-w-md">"{a.reason}"</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => handleApprove(a.id)}
                                  disabled={isPending}
                                  className="bg-leaf hover:bg-leaf-600 text-white text-xs font-bold px-4 py-2.5 rounded-full transition flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  <Check size={14} /> Setujui
                                </button>
                                <button
                                  onClick={() => handleReject(a.id)}
                                  disabled={isPending}
                                  className="bg-white border border-ink/10 hover:bg-cloud text-ink-400 text-xs font-bold px-4 py-2.5 rounded-full transition flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  <X size={14} /> Tolak
                                </button>
                              </>
                            ) : isApproved ? (
                              <span className="bg-leaf-50 text-leaf-600 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 size={13} /> Disetujui
                              </span>
                            ) : (
                              <span className="bg-coral-50 text-coral-600 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                                <XCircle size={13} /> Ditolak
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===== TAB: INFORMASI ===== */}
          {activeTab === "informasi" && (
            <div className="animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display text-2xl font-bold">Informasi Kegiatan</h2>
                  <p className="text-ink-400 text-sm">Pengumuman untuk siswa & orang tua Kelas {cls.name}</p>
                </div>
                <button
                  onClick={() => setShowPostModal(true)}
                  className="bg-sky hover:bg-sky-600 text-white font-bold text-sm px-5 py-2.5 rounded-full shadow-lg shadow-sky/20 transition flex items-center gap-2"
                >
                  <Plus size={16} /> Buat Pengumuman
                </button>
              </div>

              {posts.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-ink/15">
                  <Bell size={40} className="text-ink-200 mx-auto mb-3" />
                  <p className="font-bold text-ink-400">Belum ada pengumuman</p>
                  <p className="text-sm text-ink-300 mt-1">Klik tombol "Buat Pengumuman" untuk mulai</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {posts.map((p) => {
                    const CATEGORY_STYLE: Record<string, string> = {
                      Kegiatan: "bg-gold-50 text-gold-600",
                      Pengumuman: "bg-sky-50 text-sky",
                      "Sekolah-wide": "bg-violet-50 text-violet-600",
                    };
                    const CATEGORY_EMOJI: Record<string, string> = {
                      Kegiatan: "🚌",
                      Pengumuman: "🎨",
                      "Sekolah-wide": "🕌",
                    };
                    return (
                      <div key={p.id} className="bg-white rounded-3xl p-6 shadow-sm border border-ink/5">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-2xl ${CATEGORY_STYLE[p.category]?.split(" ")[0] || "bg-cloud"} flex items-center justify-center text-xl shrink-0`}>
                            {CATEGORY_EMOJI[p.category] || "📌"}
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${CATEGORY_STYLE[p.category] || "bg-cloud text-ink"}`}>
                                {p.category}
                              </span>
                              <span className="bg-cloud text-ink-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                                Untuk: {p.audience}
                              </span>
                            </div>
                            <p className="font-display text-lg font-bold mb-1">{p.title}</p>
                            {p.body && (
                              <p className="text-sm text-ink-400 leading-relaxed mb-3">{p.body}</p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-ink-300">
                              <span>{p.author_name}</span>
                              <span>·</span>
                              <span>
                                {new Date(p.created_at).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ===== CREATE POST MODAL ===== */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl font-bold">Buat Pengumuman</h3>
              <button onClick={() => setShowPostModal(false)} className="w-8 h-8 rounded-full bg-cloud flex items-center justify-center hover:bg-ink/10 transition">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-ink-400 uppercase tracking-wide mb-1 block">Judul</label>
                <input
                  value={postForm.title}
                  onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  placeholder="Judul pengumuman..."
                  className="w-full rounded-xl border border-ink/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky/30"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-ink-400 uppercase tracking-wide mb-1 block">Isi</label>
                <textarea
                  value={postForm.body}
                  onChange={(e) => setPostForm({ ...postForm, body: e.target.value })}
                  placeholder="Isi pengumuman..."
                  rows={4}
                  className="w-full rounded-xl border border-ink/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky/30 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-ink-400 uppercase tracking-wide mb-1 block">Kategori</label>
                  <select
                    value={postForm.category}
                    onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                    className="w-full rounded-xl border border-ink/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky/30"
                  >
                    <option>Pengumuman</option>
                    <option>Kegiatan</option>
                    <option>Sekolah-wide</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-ink-400 uppercase tracking-wide mb-1 block">Ditujukan untuk</label>
                  <select
                    value={postForm.audience}
                    onChange={(e) => setPostForm({ ...postForm, audience: e.target.value })}
                    className="w-full rounded-xl border border-ink/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky/30"
                  >
                    <option>Semua</option>
                    <option>Siswa</option>
                    <option>Orang Tua & Siswa</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-ink-400 uppercase tracking-wide mb-1 block">Nama Pembuat</label>
                <input
                  value={postForm.authorName}
                  onChange={(e) => setPostForm({ ...postForm, authorName: e.target.value })}
                  placeholder="Nama guru / admin..."
                  className="w-full rounded-xl border border-ink/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky/30"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowPostModal(false)}
                className="flex-1 h-12 rounded-xl border border-ink/10 font-bold text-ink-400 hover:bg-cloud transition"
              >
                Batal
              </button>
              <button
                onClick={handleCreatePost}
                disabled={!postForm.title}
                className="flex-1 h-12 rounded-xl bg-sky hover:bg-sky-600 text-white font-bold transition disabled:opacity-50"
              >
                Publikasikan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
