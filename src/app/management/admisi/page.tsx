"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Plus,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  Layers,
  Globe,
  GraduationCap,
  Sparkles,
  School,
  ArrowRight,
  BookOpen,
  Calendar,
  AlertCircle,
  Check,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  getApplicants,
  getBatchApprovedStudents,
  getClasses,
  assignStudentToClass,
} from "./actions";
import {
  BATCH_CONFIG,
  BATCH_LIST,
  AdmissionBatchKey,
  getCurrentActiveBatch,
  getBatchInfo,
} from "@/lib/admission-config";

type TabMode = "private" | "public" | "batch";

export default function AdmisiPage() {
  const [activeTab, setActiveTab] = useState<TabMode>("private");
  const [isAdmissionOpen, setIsAdmissionOpen] = useState(true);

  // Data States
  const [applicants, setApplicants] = useState<any[]>([]);
  const [batchStudents, setBatchStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Private Admission Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [privateCurrentPage, setPrivateCurrentPage] = useState(1);
  const [privatePageSize, setPrivatePageSize] = useState(10);

  // Batch Approval Filters & Pagination
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>("ALL");
  const [batchSearchQuery, setBatchSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState<"ALL" | "UNASSIGNED" | "ASSIGNED">("ALL");
  const [batchCurrentPage, setBatchCurrentPage] = useState(1);
  const [batchPageSize, setBatchPageSize] = useState(10);

  // Class Assignment Modal States
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [studentToAssign, setStudentToAssign] = useState<any>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch initial data
  useEffect(() => {
    async function loadAllData() {
      setIsLoading(true);
      const [appsData, batchData, classData] = await Promise.all([
        getApplicants(),
        getBatchApprovedStudents(),
        getClasses(),
      ]);
      setApplicants(appsData || []);
      setBatchStudents(batchData || []);
      setClasses(classData || []);
      setIsLoading(false);
    }
    loadAllData();
  }, []);

  // Reset pagination on filter change
  useEffect(() => {
    setPrivateCurrentPage(1);
  }, [searchQuery, statusFilter, privatePageSize]);

  useEffect(() => {
    setBatchCurrentPage(1);
  }, [selectedBatchFilter, batchSearchQuery, classFilter, batchPageSize]);

  // Status Styling Helper
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return {
          color: "text-sky-600",
          bg: "bg-sky-50",
          border: "border-sky-200",
          icon: <CheckCircle2 size={14} className="text-sky-500" />,
          label: "Diverifikasi",
          gradient: "from-sky-500 to-sky-400",
        };
      case "ENROLLED":
      case "ACCEPTED":
        return {
          color: "text-leaf-600",
          bg: "bg-leaf-50",
          border: "border-leaf-200",
          icon: <CheckCircle2 size={14} className="text-leaf-500" />,
          label: "Diterima / Terdaftar",
          gradient: "from-leaf-500 to-leaf-400",
        };
      case "REJECTED":
        return {
          color: "text-coral-600",
          bg: "bg-coral-50",
          border: "border-coral-200",
          icon: <XCircle size={14} className="text-coral-500" />,
          label: "Ditolak",
          gradient: "from-coral-500 to-coral-400",
        };
      case "PAID":
        return {
          color: "text-sky-600",
          bg: "bg-sky-50",
          border: "border-sky-200",
          icon: <CheckCircle2 size={14} className="text-sky-500" />,
          label: "Sudah Bayar Form",
          gradient: "from-sky-500 to-sky-400",
        };
      case "WAITING_REVIEW":
      case "SUBMITTED":
      case "PENDING":
      default:
        return {
          color: "text-gold-600",
          bg: "bg-gold-50",
          border: "border-gold-200",
          icon: <Clock size={14} className="text-gold-500" />,
          label: "Menunggu Review",
          gradient: "from-gold to-gold-400",
        };
    }
  };

  const getProgramLabel = (prog: string) => {
    if (prog === "PRESCHOOL") return "Preschool (PG/TK A)";
    if (prog === "KINDERGARTEN") return "Kindergarten (TK B)";
    if (prog === "PRIMARY_SCHOOL") return "Primary School (SD)";
    return prog || "Primary School";
  };

  // Filtered Private Applicants
  const filteredApplicants = useMemo(() => {
    return applicants.filter((app) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        app.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.registration_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.guardians?.some?.((g: any) =>
          g.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
        );

      let matchStatus = true;
      if (statusFilter === "WAITING") {
        matchStatus =
          app.status === "PENDING" ||
          app.status === "SUBMITTED" ||
          app.status === "WAITING_REVIEW";
      } else if (statusFilter === "ACCEPTED") {
        matchStatus =
          app.status === "ENROLLED" ||
          app.status === "ACCEPTED" ||
          app.status === "VERIFIED";
      } else if (statusFilter === "REJECTED") {
        matchStatus = app.status === "REJECTED";
      }

      return matchSearch && matchStatus;
    });
  }, [applicants, searchQuery, statusFilter]);

  // Paginated Private Applicants
  const paginatedApplicants = useMemo(() => {
    const from = (privateCurrentPage - 1) * privatePageSize;
    return filteredApplicants.slice(from, from + privatePageSize);
  }, [filteredApplicants, privateCurrentPage, privatePageSize]);

  const privateTotalPages = Math.max(1, Math.ceil(filteredApplicants.length / privatePageSize));

  // Filtered Batch Students
  const filteredBatchStudents = useMemo(() => {
    return batchStudents.filter((student) => {
      const matchBatch =
        selectedBatchFilter === "ALL" || student.batch === selectedBatchFilter;

      const matchSearch =
        batchSearchQuery.trim() === "" ||
        student.full_name?.toLowerCase().includes(batchSearchQuery.toLowerCase()) ||
        student.registration_no?.toLowerCase().includes(batchSearchQuery.toLowerCase()) ||
        student.guardian_name?.toLowerCase().includes(batchSearchQuery.toLowerCase());

      let matchClass = true;
      if (classFilter === "UNASSIGNED") {
        matchClass = !student.class_id;
      } else if (classFilter === "ASSIGNED") {
        matchClass = !!student.class_id;
      }

      return matchBatch && matchSearch && matchClass;
    });
  }, [batchStudents, selectedBatchFilter, batchSearchQuery, classFilter]);

  // Paginated Batch Students
  const paginatedBatchStudents = useMemo(() => {
    const from = (batchCurrentPage - 1) * batchPageSize;
    return filteredBatchStudents.slice(from, from + batchPageSize);
  }, [filteredBatchStudents, batchCurrentPage, batchPageSize]);

  const batchTotalPages = Math.max(1, Math.ceil(filteredBatchStudents.length / batchPageSize));

  // Batch stats summary
  const batchStats = useMemo(() => {
    const currentList =
      selectedBatchFilter === "ALL"
        ? batchStudents
        : batchStudents.filter((s) => s.batch === selectedBatchFilter);

    const total = currentList.length;
    const assigned = currentList.filter((s) => s.class_id).length;
    const unassigned = total - assigned;

    return { total, assigned, unassigned };
  }, [batchStudents, selectedBatchFilter]);

  const handleOpenAssignModal = (student: any) => {
    setStudentToAssign(student);
    setSelectedClassId(student.class_id || "");
    setAssignModalOpen(true);
  };

  const handleSaveClassAssignment = async () => {
    if (!studentToAssign) return;
    setIsAssigning(true);
    const res = await assignStudentToClass(studentToAssign.id, selectedClassId || null);
    setIsAssigning(false);

    if (res.success) {
      setBatchStudents((prev) =>
        prev.map((s) => {
          if (s.id === studentToAssign.id) {
            const foundClass = classes.find((c) => c.id === selectedClassId);
            return {
              ...s,
              class_id: selectedClassId || null,
              school_class: foundClass || null,
            };
          }
          return s;
        })
      );
      setAssignModalOpen(false);
      setStudentToAssign(null);
    } else {
      alert(res.message || "Gagal meng-assign kelas.");
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-16 w-full">
      {/* Assign Classroom Modal */}
      {assignModalOpen && studentToAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-ink/5 space-y-5">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky flex items-center justify-center mb-3">
                <School size={22} />
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">
                Penempatan Kelas Siswa
              </h3>
              <p className="text-ink-400 text-xs sm:text-sm mt-1">
                Pilih classroom untuk ananda{" "}
                <strong className="text-ink">{studentToAssign.full_name}</strong>{" "}
                sebelum tahun ajaran baru dimulai.
              </p>
            </div>

            <div className="bg-cloud/60 rounded-2xl p-3.5 border border-ink/5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-400">No. Registrasi:</span>
                <span className="font-mono font-bold text-ink">{studentToAssign.registration_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">Batch Penerimaan:</span>
                <span className="font-bold text-sky-600">{getBatchInfo(studentToAssign.batch).label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">Jenjang:</span>
                <span className="font-bold text-ink">{studentToAssign.program}</span>
              </div>
            </div>

            <div>
              <Label className="block text-xs font-bold mb-1.5 text-ink">
                Pilih Kelas (Classroom)
              </Label>
              <select
                className="w-full h-11 px-3.5 rounded-xl border border-ink/15 bg-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sky/30 focus:border-sky outline-none"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="">-- Belum Ditentukan (Unassigned) --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Tingkat {c.grade})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2.5 pt-1">
              <Button
                variant="outline"
                onClick={() => {
                  setAssignModalOpen(false);
                  setStudentToAssign(null);
                }}
                className="flex-1 h-11 rounded-xl border-ink/15 font-bold text-xs sm:text-sm"
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveClassAssignment}
                disabled={isAssigning}
                className="flex-1 h-11 rounded-xl bg-sky hover:bg-sky-600 text-white font-bold text-xs sm:text-sm shadow-md"
              >
                {isAssigning ? "Menyimpan..." : "Simpan Kelas"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 via-white to-cloud border border-sky-100 p-5 sm:p-7 lg:p-8 shadow-sm">
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-64 h-64 bg-gradient-to-br from-sky-200/40 to-sky-100/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 translate-y-1/3 w-48 h-48 bg-gradient-to-tr from-leaf-200/30 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100/60 text-sky-700 text-[11px] font-bold tracking-wide uppercase mb-2.5 border border-sky-200/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              Portal Admisi Siswa Baru
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight leading-tight">
              Online <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky to-sky-600">Admission</span>
            </h1>
            <p className="text-ink-400 mt-1.5 text-xs sm:text-sm leading-relaxed">
              Kelola pendaftaran via link private, approval gelombang batch penerimaan, dan penempatan kelas siswa baru.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white/90 backdrop-blur-xl p-3 sm:p-4 rounded-2xl border border-white shadow-md shadow-ink/5">
            <div className="flex items-center justify-between sm:justify-start gap-3 px-3 py-2 bg-cloud/60 rounded-xl">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-ink-300 uppercase tracking-wider">Status Admisi</span>
                <Label htmlFor="admission-status-switch" className="font-bold cursor-pointer text-xs sm:text-sm">
                  {isAdmissionOpen ? (
                    <span className="text-leaf flex items-center gap-1"><CheckCircle2 size={13} /> Dibuka</span>
                  ) : (
                    <span className="text-coral flex items-center gap-1"><XCircle size={13} /> Ditutup</span>
                  )}
                </Label>
              </div>
              <div className="h-6 w-px bg-ink/10 mx-1" />
              <Switch
                id="admission-status-switch"
                checked={isAdmissionOpen}
                onCheckedChange={setIsAdmissionOpen}
                className="data-[state=checked]:bg-leaf scale-100"
              />
            </div>

            <Link href="/management/admisi/tambah" className="shrink-0">
              <Button className="w-full sm:w-auto h-11 px-5 bg-sky hover:bg-sky-600 text-white font-bold rounded-xl shadow-md transition-all text-xs sm:text-sm">
                <Plus size={16} className="mr-1.5" /> Pendaftaran Baru
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. RESPONSIVE SUB-SECTION TAB CONTROLS (NO OVERFLOW ON MOBILE) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-white rounded-2xl border border-ink/10 shadow-2xs">
        <button
          onClick={() => setActiveTab("private")}
          className={`flex items-center justify-between sm:justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === "private"
              ? "bg-sky text-white shadow-md shadow-sky/20"
              : "text-ink-400 hover:text-ink hover:bg-cloud"
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={15} />
            <span>1. Private Admission</span>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === "private" ? "bg-white/20 text-white" : "bg-cloud text-ink-400"
            }`}
          >
            {applicants.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("batch")}
          className={`flex items-center justify-between sm:justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === "batch"
              ? "bg-leaf-600 text-white shadow-md shadow-leaf/20"
              : "text-ink-400 hover:text-ink hover:bg-cloud"
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers size={15} />
            <span>2. Batch Approval</span>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === "batch" ? "bg-white/20 text-white" : "bg-cloud text-ink-400"
            }`}
          >
            {batchStudents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("public")}
          className={`flex items-center justify-between sm:justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === "public"
              ? "bg-ink text-white shadow-md"
              : "text-ink-400 hover:text-ink hover:bg-cloud"
          }`}
        >
          <div className="flex items-center gap-2">
            <Globe size={15} />
            <span>3. Public Admission</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gold-100 text-gold-700">
            Next
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-SECTION 1: PRIVATE ADMISSION (Halaman Utama Pendaftar) */}
      {/* ========================================================================= */}
      {activeTab === "private" && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative w-full md:max-w-md group">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                <Search size={16} className="text-ink-300 group-focus-within:text-sky transition-colors" />
              </div>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama siswa, no registrasi, atau orang tua..."
                className="pl-10 h-11 rounded-2xl bg-white border border-ink/10 shadow-2xs focus-visible:ring-2 focus-visible:ring-sky/30 text-xs sm:text-sm font-medium"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
              {[
                { id: "ALL", label: "Semua Status" },
                { id: "WAITING", label: "Menunggu Review" },
                { id: "ACCEPTED", label: "Diterima / Enrolled" },
                { id: "REJECTED", label: "Ditolak" },
              ].map((filter) => (
                <Button
                  key={filter.id}
                  variant="ghost"
                  onClick={() => setStatusFilter(filter.id)}
                  className={`h-10 px-3.5 rounded-xl font-bold text-xs whitespace-nowrap shadow-2xs transition-all ${
                    statusFilter === filter.id
                      ? "bg-ink text-white hover:bg-ink/90"
                      : "bg-white text-ink-400 hover:bg-sky-50 hover:text-sky border border-ink/5"
                  }`}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* List Content */}
          {isLoading ? (
            <div className="py-20 text-center text-ink-300 font-medium bg-white rounded-3xl border border-ink/5">
              <div className="w-8 h-8 border-3 border-sky border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Memuat data pendaftar Online Admission...
            </div>
          ) : filteredApplicants.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-ink/5 p-6 sm:p-8">
              <div className="w-14 h-14 rounded-2xl bg-cloud text-ink-300 flex items-center justify-center mx-auto mb-3">
                <Users size={24} />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-ink">Tidak Ada Data Pendaftar</h3>
              <p className="text-ink-400 text-xs mt-1 max-w-sm mx-auto">
                {searchQuery || statusFilter !== "ALL"
                  ? "Tidak ada pendaftar yang sesuai dengan kriteria pencarian Anda."
                  : "Belum ada calon siswa yang didaftarkan. Klik tombol Pendaftaran Baru untuk membuat slot pendaftaran."}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                  }}
                  className="mt-3.5 rounded-xl text-xs font-bold"
                >
                  Reset Filter
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* ========================================================= */}
              {/* 2A. MOBILE VIEW: COMPACT, CLEAN & INFORMATIVE CARDS */}
              {/* ========================================================= */}
              <div className="space-y-3 md:hidden">
                {paginatedApplicants.map((app) => {
                  const style = getStatusStyle(app.status);
                  const guardian = app.guardians
                    ? Array.isArray(app.guardians)
                      ? app.guardians[0]
                      : app.guardians
                    : null;
                  const parentName = guardian ? guardian.full_name : "-";
                  const avatar = app.student_name ? app.student_name.substring(0, 2).toUpperCase() : "CS";
                  const formattedDate = new Date(app.submitted_at || app.created_at || new Date()).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const paymentStatus = app.payment_status || "PAID";

                  return (
                    <Link
                      key={app.id}
                      href={`/management/admisi/${app.id}`}
                      className="block p-4 rounded-2xl bg-white border border-ink/10 shadow-2xs hover:border-sky/40 transition-all space-y-3"
                    >
                      {/* Top Row: Avatar + Name + Reg No + Arrow */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center font-display font-black text-white text-xs shadow-sm`}
                          >
                            {avatar}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-ink truncate leading-tight">
                              {app.student_name}
                            </h4>
                            <p className="text-[11px] font-mono text-ink-400 mt-0.5">
                              {app.registration_no || app.id.substring(0, 8)}
                            </p>
                          </div>
                        </div>

                        <span className="w-7 h-7 rounded-xl bg-cloud flex items-center justify-center text-ink-300 text-xs shrink-0">
                          →
                        </span>
                      </div>

                      {/* Middle Row: Program & Category & Parent */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-semibold border border-sky-100">
                          {getProgramLabel(app.program)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-cloud text-ink-400 font-medium">
                          Wali: {parentName}
                        </span>
                        <span className="text-ink-300 ml-auto font-mono text-[10px]">
                          {formattedDate}
                        </span>
                      </div>

                      {/* Bottom Row: Status Badge & Payment Badge */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-ink/5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${style.bg} ${style.color}`}>
                          {style.icon}
                          <span>{style.label}</span>
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            paymentStatus === "PAID"
                              ? "bg-leaf-50 text-leaf-600 border-leaf-200"
                              : "bg-coral-50 text-coral-600 border-coral-200"
                          }`}
                        >
                          {paymentStatus === "PAID" ? "Form Lunas" : "Belum Bayar"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* ========================================================= */}
              {/* 2B. DESKTOP VIEW: FULL RICH DATA TABLE */}
              {/* ========================================================= */}
              <div className="hidden md:block bg-white rounded-3xl border border-ink/5 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-ink/5 bg-cloud/50">
                        <th className="px-6 py-4 text-xs font-bold text-ink-300 uppercase tracking-wider">No. Registrasi</th>
                        <th className="px-6 py-4 text-xs font-bold text-ink-300 uppercase tracking-wider">Calon Siswa &amp; Orang Tua</th>
                        <th className="px-6 py-4 text-xs font-bold text-ink-300 uppercase tracking-wider">Jenjang Pendidikan</th>
                        <th className="px-6 py-4 text-xs font-bold text-ink-300 uppercase tracking-wider">Biaya &amp; Pembayaran</th>
                        <th className="px-6 py-4 text-xs font-bold text-ink-300 uppercase tracking-wider">Status Admisi</th>
                        <th className="px-6 py-4 text-xs font-bold text-ink-300 uppercase tracking-wider text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/5">
                      {paginatedApplicants.map((app) => {
                        const style = getStatusStyle(app.status);
                        const guardian = app.guardians
                          ? Array.isArray(app.guardians)
                            ? app.guardians[0]
                            : app.guardians
                          : null;
                        const parentName = guardian ? guardian.full_name : "-";
                        const avatar = app.student_name ? app.student_name.substring(0, 2).toUpperCase() : "CS";
                        const formattedDate = new Date(app.submitted_at || app.created_at || new Date()).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        });

                        const paymentStatus = app.payment_status || "PAID";
                        const paymentStyle =
                          paymentStatus === "PAID"
                            ? "bg-leaf-50 text-leaf-600 border-leaf-200"
                            : "bg-coral-50 text-coral-600 border-coral-200";

                        return (
                          <tr key={app.id} className="hover:bg-sky-50/40 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm font-bold font-mono text-ink mb-0.5">{app.registration_no || app.id.substring(0, 8)}</p>
                              <p className="text-xs font-medium text-ink-400">{formattedDate}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 shrink-0 rounded-full bg-gradient-to-br ${style.gradient} flex items-center justify-center font-display font-bold text-white text-sm shadow-sm`}>
                                  {avatar}
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-ink group-hover:text-sky transition-colors">{app.student_name}</p>
                                  <p className="text-xs text-ink-400">Wali: {parentName}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1 items-start">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-700 font-semibold text-[11px] border border-sky-100">
                                  {getProgramLabel(app.program)}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-cloud text-ink-400 font-semibold text-[11px] border border-ink/10">
                                  {app.category === "TRANSFER_STUDENT" ? "Pindahan" : "Siswa Baru"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${paymentStyle}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${paymentStatus === "PAID" ? "bg-leaf-500" : "bg-coral-500"}`} />
                                {paymentStatus === "PAID" ? "Rp 1.000.000 (Lunas)" : "Belum Bayar"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${style.bg} ${style.color} border`}>
                                {style.icon}
                                {style.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <Link href={`/management/admisi/${app.id}`}>
                                <Button variant="ghost" size="sm" className="h-9 px-4 text-sky hover:bg-sky-50 hover:text-sky-700 font-bold rounded-full">
                                  Detail →
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ========================================================= */}
              {/* 3. PAGINATION & SHORT VIEW (10/20/50/100) */}
              {/* ========================================================= */}
              <div className="p-4 bg-white rounded-2xl border border-ink/10 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3.5 text-xs">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                  <div className="flex items-center gap-2">
                    <span className="text-ink-400 font-medium">Tampilkan:</span>
                    <select
                      value={privatePageSize}
                      onChange={(e) => setPrivatePageSize(Number(e.target.value))}
                      className="h-8 px-2.5 rounded-lg border border-ink/15 bg-cloud font-bold text-ink focus:outline-none focus:border-sky text-xs"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-ink-400 font-medium">data</span>
                  </div>

                  <span className="text-ink-400">
                    Menampilkan{" "}
                    <strong className="text-ink">
                      {filteredApplicants.length === 0
                        ? 0
                        : (privateCurrentPage - 1) * privatePageSize + 1}
                      -
                      {Math.min(
                        privateCurrentPage * privatePageSize,
                        filteredApplicants.length
                      )}
                    </strong>{" "}
                    dari <strong className="text-ink">{filteredApplicants.length}</strong> data
                  </span>
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={privateCurrentPage <= 1}
                    onClick={() => setPrivateCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-2.5 rounded-lg border-ink/15 font-bold text-xs"
                  >
                    <ChevronLeft size={14} className="mr-1" /> Prev
                  </Button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: Math.min(5, privateTotalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (privateTotalPages > 5 && privateCurrentPage > 3) {
                        pageNum = privateCurrentPage - 2 + i;
                        if (pageNum > privateTotalPages) {
                          pageNum = privateTotalPages - (4 - i);
                        }
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPrivateCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg font-bold text-xs transition ${
                            privateCurrentPage === pageNum
                              ? "bg-sky text-white shadow-2xs"
                              : "text-ink-400 hover:bg-cloud hover:text-ink"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={privateCurrentPage >= privateTotalPages}
                    onClick={() => setPrivateCurrentPage((p) => Math.min(privateTotalPages, p + 1))}
                    className="h-8 px-2.5 rounded-lg border-ink/15 font-bold text-xs"
                  >
                    Next <ChevronRight size={14} className="ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-SECTION 2: BATCH APPROVAL & CLASSROOM ASSIGNMENT */}
      {/* ========================================================================= */}
      {activeTab === "batch" && (
        <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
          {/* Batch Selector & Period Explanations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
            {BATCH_LIST.map((batch) => {
              const isSelected = selectedBatchFilter === batch.key;
              const count = batchStudents.filter((s) => s.batch === batch.key).length;
              return (
                <div
                  key={batch.key}
                  onClick={() => setSelectedBatchFilter(isSelected ? "ALL" : batch.key)}
                  className={`p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? `${batch.theme.bg} ${batch.theme.border} ring-2 ring-sky-500/20 shadow-md`
                      : "bg-white border-ink/5 hover:border-ink/20 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${batch.theme.badge}`}>
                      {batch.label}
                    </span>
                    <span className="font-display text-2xl font-black text-ink">{count} Siswa</span>
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-ink mb-1">{batch.subLabel}</h3>
                  <p className="text-xs text-ink-400 mb-3">{batch.description}</p>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-400 bg-white/70 px-3 py-1.5 rounded-xl border border-ink/5 w-fit">
                    <Calendar size={13} className="text-sky-600" />
                    <span>Periode: <strong>{batch.periodLabel}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Metric Summary Bar */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-ink/5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3.5 w-full md:w-auto">
              <div className="w-11 h-11 rounded-2xl bg-leaf-50 text-leaf-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-ink-300 uppercase tracking-wider">Filter Batch Aktif</p>
                <h4 className="font-display text-base sm:text-lg font-bold text-ink">
                  {selectedBatchFilter === "ALL"
                    ? "Semua Gelombang (All Batches)"
                    : getBatchInfo(selectedBatchFilter).label + " (" + getBatchInfo(selectedBatchFilter).periodLabel + ")"}
                </h4>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 divide-x divide-ink/10 w-full md:w-auto justify-between sm:justify-start">
              <div className="px-2 text-center sm:text-left">
                <span className="text-xs text-ink-400 font-medium">Total Diterima</span>
                <p className="font-display text-xl sm:text-2xl font-black text-ink">{batchStats.total}</p>
              </div>
              <div className="px-2 text-center sm:text-left">
                <span className="text-xs text-leaf-600 font-bold">Sudah Ada Kelas</span>
                <p className="font-display text-xl sm:text-2xl font-black text-leaf-600">{batchStats.assigned}</p>
              </div>
              <div className="px-2 text-center sm:text-left">
                <span className="text-xs text-coral-600 font-bold">Belum Ada Kelas</span>
                <p className="font-display text-xl sm:text-2xl font-black text-coral-600">{batchStats.unassigned}</p>
              </div>
            </div>
          </div>

          {/* Batch Students Table & Filter */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative w-full md:max-w-md">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                <Search size={16} className="text-ink-300" />
              </div>
              <Input
                value={batchSearchQuery}
                onChange={(e) => setBatchSearchQuery(e.target.value)}
                placeholder="Cari siswa di listing batch..."
                className="pl-10 h-11 rounded-2xl bg-white border border-ink/10 text-xs sm:text-sm font-medium shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
              <Button
                variant={classFilter === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setClassFilter("ALL")}
                className="rounded-xl text-xs font-bold h-9 px-3 whitespace-nowrap"
              >
                Semua Siswa ({batchStats.total})
              </Button>
              <Button
                variant={classFilter === "UNASSIGNED" ? "default" : "outline"}
                size="sm"
                onClick={() => setClassFilter("UNASSIGNED")}
                className="rounded-xl text-xs font-bold text-coral-600 border-coral-200 h-9 px-3 whitespace-nowrap"
              >
                Belum Ada Kelas ({batchStats.unassigned})
              </Button>
              <Button
                variant={classFilter === "ASSIGNED" ? "default" : "outline"}
                size="sm"
                onClick={() => setClassFilter("ASSIGNED")}
                className="rounded-xl text-xs font-bold text-leaf-600 border-leaf-200 h-9 px-3 whitespace-nowrap"
              >
                Sudah Ada Kelas ({batchStats.assigned})
              </Button>
            </div>
          </div>

          {filteredBatchStudents.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-ink/5 p-6 sm:p-8">
              <School size={28} className="text-ink-300 mx-auto mb-2.5" />
              <h3 className="font-bold text-base sm:text-lg text-ink">Tidak Ada Siswa di Batch Ini</h3>
              <p className="text-ink-400 text-xs mt-1">
                Siswa yang di-approve pada menu Private Admission akan otomatis muncul di sini untuk penempatan kelas.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* ========================================================= */}
              {/* 2C. MOBILE VIEW: BATCH STUDENTS CARDS */}
              {/* ========================================================= */}
              <div className="space-y-3 md:hidden">
                {paginatedBatchStudents.map((student) => {
                  const batchInfo = getBatchInfo(student.batch);

                  return (
                    <div
                      key={student.id}
                      className="p-4 rounded-2xl bg-white border border-ink/10 shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-ink leading-tight">{student.full_name}</h4>
                          <p className="text-[11px] font-mono text-ink-400 mt-0.5">
                            Reg: {student.registration_no}
                          </p>
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${batchInfo.theme.badge}`}>
                          {batchInfo.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-semibold border border-sky-100">
                          {student.program}
                        </span>
                        <span className="text-ink-400">
                          Wali: {student.guardian_name || "-"} ({student.guardian_phone || "-"})
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-ink/5">
                        {student.school_class ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-leaf-50 text-leaf-700 border border-leaf-200 text-xs font-bold">
                            <Check size={12} /> {student.school_class.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-coral-50 text-coral-600 border border-coral-200 text-xs font-bold">
                            <AlertCircle size={12} /> Belum Ada Kelas
                          </span>
                        )}

                        <Button
                          onClick={() => handleOpenAssignModal(student)}
                          size="sm"
                          className="h-8 px-3 bg-sky hover:bg-sky-600 text-white font-bold rounded-xl text-xs shadow-2xs"
                        >
                          <School size={13} className="mr-1" />
                          {student.class_id ? "Ubah" : "Assign"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ========================================================= */}
              {/* 2D. DESKTOP VIEW: BATCH STUDENTS TABLE */}
              {/* ========================================================= */}
              <div className="hidden md:block bg-white rounded-3xl border border-ink/5 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-ink/5 bg-cloud/50">
                        <th className="px-6 py-4 text-xs font-bold text-ink-300 uppercase tracking-wider">Siswa</th>
                        <th className="px-6 py-4 text-xs font-bold text-ink-300 uppercase tracking-wider">Jenjang</th>
                        <th className="px-6 py-4 text-xs font-bold text-ink-300 uppercase tracking-wider">Gelombang (Batch)</th>
                        <th className="px-6 py-4 text-xs font-bold text-ink-300 uppercase tracking-wider">Orang Tua &amp; Kontak</th>
                        <th className="px-6 py-4 text-xs font-bold text-ink-300 uppercase tracking-wider">Penempatan Kelas</th>
                        <th className="px-6 py-4 text-xs font-bold text-ink-300 uppercase tracking-wider text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/5">
                      {paginatedBatchStudents.map((student) => {
                        const batchInfo = getBatchInfo(student.batch);
                        return (
                          <tr key={student.id} className="hover:bg-sky-50/40 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="font-bold text-sm text-ink">{student.full_name}</p>
                              <p className="text-xs text-ink-400 font-mono">Reg: {student.registration_no}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-700 font-semibold text-xs border border-sky-100">
                                {student.program}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${batchInfo.theme.badge}`}>
                                {batchInfo.label} ({batchInfo.periodLabel})
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-xs font-bold text-ink">{student.guardian_name}</p>
                              <p className="text-xs text-ink-400">{student.guardian_phone}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {student.school_class ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-leaf-50 text-leaf-700 border border-leaf-200 text-xs font-bold">
                                  <Check size={13} /> {student.school_class.name} (Tingkat {student.school_class.grade})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral-50 text-coral-600 border border-coral-200 text-xs font-bold">
                                  <AlertCircle size={13} /> Belum Ada Kelas
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <Button
                                onClick={() => handleOpenAssignModal(student)}
                                size="sm"
                                className="h-9 px-4 bg-sky hover:bg-sky-600 text-white font-bold rounded-xl text-xs shadow-sm"
                              >
                                <School size={14} className="mr-1.5" />
                                {student.class_id ? "Ubah Kelas" : "Assign Kelas"}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ========================================================= */}
              {/* 3B. PAGINATION & SHORT VIEW FOR BATCH STUDENTS */}
              {/* ========================================================= */}
              <div className="p-4 bg-white rounded-2xl border border-ink/10 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3.5 text-xs">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                  <div className="flex items-center gap-2">
                    <span className="text-ink-400 font-medium">Tampilkan:</span>
                    <select
                      value={batchPageSize}
                      onChange={(e) => setBatchPageSize(Number(e.target.value))}
                      className="h-8 px-2.5 rounded-lg border border-ink/15 bg-cloud font-bold text-ink focus:outline-none focus:border-sky text-xs"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-ink-400 font-medium">data</span>
                  </div>

                  <span className="text-ink-400">
                    Menampilkan{" "}
                    <strong className="text-ink">
                      {filteredBatchStudents.length === 0
                        ? 0
                        : (batchCurrentPage - 1) * batchPageSize + 1}
                      -
                      {Math.min(
                        batchCurrentPage * batchPageSize,
                        filteredBatchStudents.length
                      )}
                    </strong>{" "}
                    dari <strong className="text-ink">{filteredBatchStudents.length}</strong> data
                  </span>
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={batchCurrentPage <= 1}
                    onClick={() => setBatchCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-2.5 rounded-lg border-ink/15 font-bold text-xs"
                  >
                    <ChevronLeft size={14} className="mr-1" /> Prev
                  </Button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: Math.min(5, batchTotalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (batchTotalPages > 5 && batchCurrentPage > 3) {
                        pageNum = batchCurrentPage - 2 + i;
                        if (pageNum > batchTotalPages) {
                          pageNum = batchTotalPages - (4 - i);
                        }
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setBatchCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg font-bold text-xs transition ${
                            batchCurrentPage === pageNum
                              ? "bg-sky text-white shadow-2xs"
                              : "text-ink-400 hover:bg-cloud hover:text-ink"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={batchCurrentPage >= batchTotalPages}
                    onClick={() => setBatchCurrentPage((p) => Math.min(batchTotalPages, p + 1))}
                    className="h-8 px-2.5 rounded-lg border-ink/15 font-bold text-xs"
                  >
                    Next <ChevronRight size={14} className="ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-SECTION 3: PUBLIC ADMISSION (Portal Utama Pendaftaran) */}
      {/* ========================================================================= */}
      {activeTab === "public" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-ink/5 shadow-sm space-y-6 sm:space-y-8 animate-in fade-in duration-300">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-50 text-gold-700 text-xs font-bold border border-gold-200 mb-3">
              <Sparkles size={14} /> Jalur Pendaftaran Terbuka (Public Domain)
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
              Public Admission Portal
            </h2>
            <p className="text-ink-400 mt-2 leading-relaxed text-xs sm:text-sm">
              Jalur pendaftaran langsung dari domain utama admission JACOS untuk umum tanpa memerlukan private link dari admin. Sub-section ini akan diaktifkan setelah flow approval selesai terintegrasi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-5 rounded-2xl bg-cloud/50 border border-ink/5 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky flex items-center justify-center font-bold text-sm">1</div>
              <h4 className="font-bold text-sm text-ink">Landing Page Public</h4>
              <p className="text-xs text-ink-400 leading-relaxed">
                Halaman informasi kurikulum, fasilitas, biaya, dan formulir pendaftaran terbuka untuk orang tua.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-cloud/50 border border-ink/5 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-leaf-50 text-leaf-600 flex items-center justify-center font-bold text-sm">2</div>
              <h4 className="font-bold text-sm text-ink">Payment Gateway</h4>
              <p className="text-xs text-ink-400 leading-relaxed">
                Pembayaran otomatis via Virtual Account &amp; QRIS langsung memvalidasi formulir masuk ke sistem admin.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-cloud/50 border border-ink/5 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-gold-50 text-gold-700 flex items-center justify-center font-bold text-sm">3</div>
              <h4 className="font-bold text-sm text-ink">Batch Approval Otomatis</h4>
              <p className="text-xs text-ink-400 leading-relaxed">
                Pendaftar yang disetujui akan langsung terkelompokkan ke Batch 1, Batch 2, atau Batch 3 secara presisi.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-sky-50 border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Clock size={18} className="text-sky-600 shrink-0" />
              <p className="text-xs sm:text-sm font-semibold text-sky-900">
                Fitur ini sedang dalam antrian pengembangan dan akan dirilis segera.
              </p>
            </div>
            <Button
              onClick={() => setActiveTab("private")}
              variant="outline"
              className="rounded-xl border-sky-200 text-sky-700 hover:bg-sky-100 font-bold text-xs h-9 self-start sm:self-auto"
            >
              Kembali ke Private Admission →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
