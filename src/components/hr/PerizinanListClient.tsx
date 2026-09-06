"use client";

import { useState, useTransition, useMemo } from "react";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Plus,
  Filter,
  Eye,
  Check,
  X,
  User,
  Users,
  Briefcase,
  FileText,
  FileSpreadsheet,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  UploadCloud,
  Paperclip,
  ExternalLink,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  SlidersHorizontal,
  Edit2,
  Trash2,
  UserCheck,
  Info,
  CalendarCheck,
  CalendarX,
  Send,
  Building,
  GraduationCap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  LeaveRequestRecord,
  LeaveBalanceRecord,
  LeaveTypeRecord,
  LeaveStatus,
  LeaveDashboardStats,
  LeaveRequestInput,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  deleteLeaveRequest,
  updateEmployeeLeaveBalance,
  uploadLeaveDocument,
} from "@/app/management/hr/perizinan/actions";

function calculateDaysBetween(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (end < start) return 0;

  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dayOfWeek = cur.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count > 0 ? count : 1;
}

interface PerizinanListClientProps {
  initialRequests: LeaveRequestRecord[];
  initialBalances: LeaveBalanceRecord[];
  leaveTypes: LeaveTypeRecord[];
  employees: any[];
  initialStats: LeaveDashboardStats;
}

type MainTab = "requests" | "balances" | "calendar";

const STATUS_CONFIG: Record<
  LeaveStatus,
  { label: string; badge: string; icon: any; dot: string }
> = {
  PENDING: {
    label: "Menunggu Persetujuan",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
    dot: "bg-amber-500",
  },
  APPROVED: {
    label: "Disetujui",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "Ditolak",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    icon: XCircle,
    dot: "bg-rose-500",
  },
};

export function PerizinanListClient({
  initialRequests,
  initialBalances,
  leaveTypes,
  employees,
  initialStats,
}: PerizinanListClientProps) {
  // Main Data States
  const [requests, setRequests] = useState<LeaveRequestRecord[]>(initialRequests);
  const [balances, setBalances] = useState<LeaveBalanceRecord[]>(initialBalances);
  const [activeTab, setActiveTab] = useState<MainTab>("requests");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "duration">("newest");

  // Calendar States
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // Transitions & Notifications
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestRecord | null>(null);

  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalTarget, setApprovalTarget] = useState<LeaveRequestRecord | null>(null);
  const [approvalAction, setApprovalAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [approvalNotes, setApprovalNotes] = useState("");

  const [isAdjustBalanceOpen, setIsAdjustBalanceOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<LeaveBalanceRecord | null>(null);
  const [adjustTotalDays, setAdjustTotalDays] = useState<number>(12);
  const [adjustUsedDays, setAdjustUsedDays] = useState<number>(0);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingRequest, setDeletingRequest] = useState<LeaveRequestRecord | null>(null);

  // Form State for New Leave Submission
  const [formData, setFormData] = useState<LeaveRequestInput>({
    employee_id: employees[0]?.id || "",
    leave_type_id: leaveTypes[0]?.id || "",
    start_date: "",
    end_date: "",
    total_days: 1,
    reason: "",
    document_url: "",
  });
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const totalPending = requests.filter((r) => r.status === "PENDING").length;
    const currentMonthPrefix = new Date().toISOString().substring(0, 7);
    const totalApprovedThisMonth = requests.filter(
      (r) => r.status === "APPROVED" && r.start_date.startsWith(currentMonthPrefix)
    ).length;
    const todayStr = new Date().toISOString().split("T")[0];
    const activeLeaveToday = requests.filter(
      (r) =>
        r.status === "APPROVED" &&
        r.start_date <= todayStr &&
        r.end_date >= todayStr
    ).length;

    return {
      totalPending,
      totalApprovedThisMonth,
      activeLeaveToday,
      totalEmployees: employees.length,
    };
  }, [requests, employees]);

  // Selected Employee Leave Balance lookup for form
  const selectedEmpBalance = useMemo(() => {
    if (!formData.employee_id || !formData.leave_type_id) return null;
    const currentYear = new Date().getFullYear();
    const found = balances.find(
      (b) =>
        b.employee_id === formData.employee_id &&
        b.leave_type_id === formData.leave_type_id &&
        b.year === currentYear
    );
    if (found) return found;

    const selectedType = leaveTypes.find((t) => t.id === formData.leave_type_id);
    return {
      total_days: selectedType?.annual_quota || 12,
      used_days: 0,
      remaining_days: selectedType?.annual_quota || 12,
    };
  }, [formData.employee_id, formData.leave_type_id, balances, leaveTypes]);

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    return requests
      .filter((r) => {
        // Status filter
        if (statusFilter !== "ALL" && r.status !== statusFilter) return false;

        // Leave type filter
        if (typeFilter !== "ALL" && r.leave_type_id !== typeFilter) return false;

        // Role filter
        if (roleFilter !== "ALL") {
          const empRole = r.employee?.employee_type || "STAF";
          if (roleFilter === "GURU" && empRole !== "GURU") return false;
          if (roleFilter === "STAF" && empRole === "GURU") return false;
        }

        // Search query
        if (search.trim() !== "") {
          const q = search.toLowerCase();
          const nameMatch = r.employee?.full_name.toLowerCase().includes(q);
          const codeMatch = r.employee?.employee_code.toLowerCase().includes(q);
          const reasonMatch = r.reason.toLowerCase().includes(q);
          const typeMatch = r.leave_type?.name.toLowerCase().includes(q);
          if (!nameMatch && !codeMatch && !reasonMatch && !typeMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortBy === "duration") {
          return b.total_days - a.total_days;
        }
        return 0;
      });
  }, [requests, statusFilter, typeFilter, roleFilter, search, sortBy]);

  // Filtered Balances
  const filteredBalances = useMemo(() => {
    return balances.filter((b) => {
      if (search.trim() !== "") {
        const q = search.toLowerCase();
        const nameMatch = b.employee_name?.toLowerCase().includes(q);
        const codeMatch = b.employee_code?.toLowerCase().includes(q);
        const posMatch = b.position?.toLowerCase().includes(q);
        if (!nameMatch && !codeMatch && !posMatch) return false;
      }
      if (roleFilter !== "ALL") {
        if (roleFilter === "GURU" && b.employee_type !== "GURU") return false;
        if (roleFilter === "STAF" && b.employee_type === "GURU") return false;
      }
      return true;
    });
  }, [balances, search, roleFilter]);

  // Date Formatting Helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Handlers
  const openCreateModal = () => {
    const today = new Date().toISOString().split("T")[0];
    setFormData({
      employee_id: employees[0]?.id || "",
      leave_type_id: leaveTypes[0]?.id || "",
      start_date: today,
      end_date: today,
      total_days: 1,
      reason: "",
      document_url: "",
    });
    setUploadedDocName(null);
    setIsCreateModalOpen(true);
  };

  const handleDateChange = (start: string, end: string) => {
    const days = calculateDaysBetween(start, end);
    setFormData((prev) => ({
      ...prev,
      start_date: start,
      end_date: end,
      total_days: days,
    }));
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDoc(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await uploadLeaveDocument(data);
      if (res.success && res.url) {
        setFormData((prev) => ({ ...prev, document_url: res.url }));
        setUploadedDocName(res.fileName || file.name);
        showNotification("success", "Dokumen pendukung berhasil diunggah");
      } else {
        showNotification("error", res.message || "Gagal mengunggah dokumen");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Gagal mengunggah file");
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createLeaveRequest(formData);
      if (res.success && res.data) {
        const emp = employees.find((e) => e.id === formData.employee_id);
        const lt = leaveTypes.find((t) => t.id === formData.leave_type_id);

        const newRecord: LeaveRequestRecord = {
          id: res.data.id,
          employee_id: res.data.employee_id,
          leave_type_id: res.data.leave_type_id,
          start_date: res.data.start_date,
          end_date: res.data.end_date,
          total_days: res.data.total_days,
          reason: res.data.reason,
          status: "PENDING",
          approved_by: null,
          approved_at: null,
          notes: res.data.notes,
          document_url: res.data.notes && res.data.notes.startsWith("http") ? res.data.notes : null,
          created_at: res.data.created_at,
          updated_at: res.data.updated_at,
          employee: emp
            ? {
                id: emp.id,
                employee_code: emp.employee_code || "-",
                full_name: emp.full_name,
                position: emp.position || "-",
                employee_type: emp.employee_type || "STAF",
                photo_url: emp.photo_url || null,
                phone: emp.phone || null,
              }
            : null,
          leave_type: lt || null,
        };

        setRequests((prev) => [newRecord, ...prev]);
        setIsCreateModalOpen(false);
        showNotification("success", "Permohonan perizinan berhasil diajukan!");
      } else {
        showNotification("error", res.message || "Gagal membuat permohonan");
      }
    });
  };

  // Open Approval Modal
  const openApprovalModal = (req: LeaveRequestRecord, action: "APPROVE" | "REJECT") => {
    setApprovalTarget(req);
    setApprovalAction(action);
    setApprovalNotes("");
    setIsApprovalModalOpen(true);
  };

  const handleApprovalSubmit = () => {
    if (!approvalTarget) return;

    startTransition(async () => {
      let res;
      if (approvalAction === "APPROVE") {
        res = await approveLeaveRequest(approvalTarget.id, approvalNotes);
      } else {
        res = await rejectLeaveRequest(approvalTarget.id, approvalNotes);
      }

      if (res.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === approvalTarget.id
              ? {
                  ...r,
                  status: approvalAction === "APPROVE" ? "APPROVED" : "REJECTED",
                  notes: approvalNotes || r.notes,
                  approved_at: new Date().toISOString(),
                }
              : r
          )
        );

        // Update balances locally if approved & deductible
        if (approvalAction === "APPROVE" && approvalTarget.leave_type?.is_deductible) {
          setBalances((prev) =>
            prev.map((b) =>
              b.employee_id === approvalTarget.employee_id &&
              b.leave_type_id === approvalTarget.leave_type_id
                ? {
                    ...b,
                    used_days: b.used_days + approvalTarget.total_days,
                    remaining_days: Math.max(0, b.remaining_days - approvalTarget.total_days),
                  }
                : b
            )
          );
        }

        setIsApprovalModalOpen(false);
        setApprovalTarget(null);
        showNotification(
          "success",
          approvalAction === "APPROVE"
            ? "Permohonan izin berhasil disetujui"
            : "Permohonan izin telah ditolak"
        );
      } else {
        showNotification("error", res.message || "Gagal memproses approval");
      }
    });
  };

  // Open Adjust Balance Modal
  const openAdjustBalanceModal = (bal: LeaveBalanceRecord) => {
    setAdjustTarget(bal);
    setAdjustTotalDays(bal.total_days);
    setAdjustUsedDays(bal.used_days);
    setIsAdjustBalanceOpen(true);
  };

  const handleAdjustBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;

    startTransition(async () => {
      const res = await updateEmployeeLeaveBalance({
        employee_id: adjustTarget.employee_id,
        leave_type_id: adjustTarget.leave_type_id,
        year: adjustTarget.year,
        total_days: adjustTotalDays,
        used_days: adjustUsedDays,
      });

      if (res.success) {
        setBalances((prev) =>
          prev.map((b) =>
            b.id === adjustTarget.id
              ? {
                  ...b,
                  total_days: adjustTotalDays,
                  used_days: adjustUsedDays,
                  remaining_days: Math.max(0, adjustTotalDays - adjustUsedDays),
                }
              : b
          )
        );
        setIsAdjustBalanceOpen(false);
        setAdjustTarget(null);
        showNotification("success", "Saldo cuti berhasil disesuaikan");
      } else {
        showNotification("error", res.message || "Gagal menyesuaikan saldo");
      }
    });
  };

  // Delete Request
  const handleDeleteConfirm = () => {
    if (!deletingRequest) return;

    startTransition(async () => {
      const res = await deleteLeaveRequest(deletingRequest.id);
      if (res.success) {
        setRequests((prev) => prev.filter((r) => r.id !== deletingRequest.id));
        setIsDeleteModalOpen(false);
        setDeletingRequest(null);
        showNotification("success", "Permohonan perizinan berhasil dihapus");
      } else {
        showNotification("error", res.message || "Gagal menghapus permohonan");
      }
    });
  };

  // Calendar Helpers
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Previous month padding
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
      days.push(null);
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const activeOnDay = requests.filter(
        (r) =>
          r.status === "APPROVED" &&
          r.start_date <= dateStr &&
          r.end_date >= dateStr
      );
      days.push({ dayNumber: d, dateStr, leaves: activeOnDay });
    }
    return days;
  }, [calendarDate, requests]);

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-bottom-4 duration-300 ${
            notification.type === "success"
              ? "bg-emerald-600 text-white shadow-emerald-600/20"
              : "bg-rose-600 text-white shadow-rose-600/20"
          }`}
        >
          {notification.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-ink/5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-gradient-to-br from-amber-100 to-emerald-50 rounded-full blur-2xl opacity-60 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold tracking-wide uppercase flex items-center gap-1.5">
              <CalendarDays size={14} className="text-emerald-600 mr-1" /> JACOS Leave & Attendance Center
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">
            Perizinan & Cuti HR
          </h1>
          <p className="text-ink-500 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Pusat manajemen permohonan cuti tahunan, izin sakit dengan surat dokter, dinas luar, dan pelacakan saldo kuota cuti karyawan secara otomatis.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5 sm:self-start">
          <Button
            onClick={openCreateModal}
            className="gap-2 h-11 px-5 rounded-2xl bg-ink hover:bg-ink/90 text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-transform active:scale-95"
          >
            <Plus size={16} /> Ajukan Permohonan Izin
          </Button>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Pending */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-ink/5 shadow-2xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-ink-400">Menunggu Approval</span>
            <div className="w-13 h-13 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">
            {stats.totalPending}
          </div>
          <p className="text-xs text-ink-400 mt-3 flex items-center gap-1">
            <span className="text-amber-600 font-bold">● Perlu tindakan</span> persetujuan HR
          </p>
        </div>

        {/* Card 2: Approved This Month */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-ink/5 shadow-2xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-ink-400">Disetujui Bulan Ini</span>
            <div className="w-13 h-13 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
            {stats.totalApprovedThisMonth}
          </div>
          <p className="text-xs text-ink-400 mt-3 flex items-center gap-1">
            <span className="text-emerald-600 font-bold">● Terverifikasi</span> resmi manajemen
          </p>
        </div>

        {/* Card 3: Active Leave Today */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-ink/5 shadow-2xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-ink-400">Sedang Cuti Hari Ini</span>
            <div className="w-13 h-13 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
              <CalendarCheck size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sky-600 tracking-tight">
            {stats.activeLeaveToday}
          </div>
          <p className="text-xs text-ink-400 mt-3">
            Guru & staf tidak aktif hari ini
          </p>
        </div>

        {/* Card 4: Total Staff */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-ink/5 shadow-2xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-ink-400">Total Karyawan</span>
            <div className="w-13 h-13 rounded-full bg-cloud text-ink-600 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-ink-700 tracking-tight">
            {stats.totalEmployees}
          </div>
          <p className="text-xs text-ink-400 mt-3">Guru & staf aktif terdaftar</p>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex p-1.5 bg-cloud/70 rounded-2xl max-w-fit border border-ink/5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "requests"
              ? "bg-white text-ink shadow-sm"
              : "text-ink-400 hover:text-ink hover:bg-white/40"
          }`}
        >
          <FileText size={16} /> Daftar Permohonan ({requests.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("balances")}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "balances"
              ? "bg-white text-ink shadow-sm"
              : "text-ink-400 hover:text-ink hover:bg-white/40"
          }`}
        >
          <FileSpreadsheet size={16} /> Rekap Saldo Cuti ({balances.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("calendar")}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "calendar"
              ? "bg-white text-ink shadow-sm"
              : "text-ink-400 hover:text-ink hover:bg-white/40"
          }`}
        >
          <CalendarIcon size={16} /> Kalender Cuti Tim
        </button>
      </div>

      {/* TAB 1: DAFTAR PERMOHONAN */}
      {activeTab === "requests" && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-ink/5 shadow-2xs space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Status Filter Chips */}
              <div className="flex p-1 bg-cloud/70 rounded-2xl overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === "ALL"
                      ? "bg-white text-ink shadow-sm"
                      : "text-ink-400 hover:text-ink"
                  }`}
                >
                  Semua ({requests.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("PENDING")}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === "PENDING"
                      ? "bg-white text-amber-600 shadow-sm"
                      : "text-ink-400 hover:text-ink"
                  }`}
                >
                  Menunggu ({stats.totalPending})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("APPROVED")}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === "APPROVED"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-ink-400 hover:text-ink"
                  }`}
                >
                  Disetujui
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("REJECTED")}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === "REJECTED"
                      ? "bg-white text-rose-600 shadow-sm"
                      : "text-ink-400 hover:text-ink"
                  }`}
                >
                  Ditolak
                </button>
              </div>

              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <Input
                  placeholder="Cari nama karyawan, ID, atau alasan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10 sm:h-11 rounded-2xl bg-cloud/40 border-ink/10 text-xs sm:text-sm font-medium focus-visible:ring-emerald-500"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* View switch & Sort */}
              <div className="flex items-center gap-2 self-end lg:self-auto">
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="h-10 sm:h-11 px-3 rounded-2xl bg-cloud/40 border border-ink/10 text-xs font-bold text-ink-600 outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="newest">Pengajuan Terbaru</option>
                  <option value="oldest">Pengajuan Terlama</option>
                  <option value="duration">Durasi Terpanjang</option>
                </select>

                <div className="flex p-1 bg-cloud/70 rounded-2xl border border-ink/5">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      viewMode === "grid" ? "bg-white text-ink shadow-xs" : "text-ink-400 hover:text-ink"
                    }`}
                    title="Tampilan Kartu"
                  >
                    <LayoutGrid size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      viewMode === "table" ? "bg-white text-ink shadow-xs" : "text-ink-400 hover:text-ink"
                    }`}
                    title="Tampilan Tabel"
                  >
                    <TableIcon size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Sub-Filters: Leave Type & Role */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-ink/5">
              <span className="text-[11px] font-extrabold text-ink-400 uppercase tracking-wider mr-1">
                Jenis Izin:
              </span>
              <button
                type="button"
                onClick={() => setTypeFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  typeFilter === "ALL"
                    ? "bg-ink text-white border-ink shadow-xs"
                    : "bg-cloud/40 text-ink-500 border-ink/5 hover:bg-cloud"
                }`}
              >
                Semua Jenis
              </button>
              {leaveTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeFilter(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    typeFilter === t.id
                      ? "bg-ink text-white border-ink shadow-xs"
                      : "bg-cloud/40 text-ink-600 border-ink/10 hover:bg-cloud"
                  }`}
                >
                  {t.name}
                </button>
              ))}

              <div className="h-4 w-px bg-ink/10 mx-1 hidden sm:block" />

              {/* Role Filter */}
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-[11px] font-extrabold text-ink-400 uppercase tracking-wider">
                  Divisi:
                </span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="h-8 px-2.5 rounded-xl bg-cloud/40 border border-ink/10 text-xs font-bold text-ink-600 outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Divisi</option>
                  <option value="GURU">Tenaga Pendidik (Guru)</option>
                  <option value="STAF">Staf & Operasional</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRequests.map((req) => {
                const statusConf = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
                const StatusIcon = statusConf.icon;

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-ink/5 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Bar: Status + Date Range */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${statusConf.badge}`}
                        >
                          <StatusIcon size={12} />
                          {statusConf.label}
                        </span>

                        <span className="text-[11px] text-ink-400 font-bold bg-cloud/60 px-2 py-0.5 rounded-lg">
                          {req.total_days} Hari
                        </span>
                      </div>

                      {/* Employee Info Header */}
                      <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-cloud/30 border border-ink/5">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center overflow-hidden shrink-0">
                          {req.employee?.photo_url ? (
                            <img
                              src={req.employee.photo_url}
                              alt={req.employee.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            req.employee?.full_name.substring(0, 2).toUpperCase() || "KW"
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sm text-ink truncate group-hover:text-emerald-700 transition-colors">
                            {req.employee?.full_name || "Karyawan"}
                          </h4>
                          <p className="text-[11px] text-ink-400">
                            {req.employee?.position || "-"} • {req.employee?.employee_code}
                          </p>
                        </div>
                      </div>

                      {/* Leave Type & Dates */}
                      <div className="space-y-2 mb-4 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-ink-400 font-medium">Jenis Izin:</span>
                          <span className="font-bold text-ink bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded-md border border-sky-200">
                            {req.leave_type?.name || "Cuti Tahunan"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-ink-400 font-medium">Periode:</span>
                          <span className="font-bold text-ink font-mono text-[11px]">
                            {formatDate(req.start_date)} - {formatDate(req.end_date)}
                          </span>
                        </div>
                      </div>

                      {/* Reason Excerpt */}
                      <div className="p-3 rounded-2xl bg-cloud/40 border border-ink/5 text-xs text-ink-600 leading-relaxed mb-4">
                        <span className="font-bold text-ink-400 block text-[10px] uppercase mb-0.5">
                          Alasan Pengajuan:
                        </span>
                        <p className="line-clamp-2">{req.reason}</p>
                      </div>

                      {req.document_url && (
                        <div className="mb-4">
                          <a
                            href={req.document_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl transition"
                          >
                            <Paperclip size={12} /> Lihat Surat / Dokumen Pendukung
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-ink/5 space-y-2">
                      {req.status === "PENDING" ? (
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            onClick={() => openApprovalModal(req, "APPROVE")}
                            className="rounded-xl h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1 cursor-pointer"
                          >
                            <Check size={14} /> Setujui
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openApprovalModal(req, "REJECT")}
                            className="rounded-xl h-9 text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 gap-1 cursor-pointer"
                          >
                            <X size={14} /> Tolak
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-ink-400">
                          <span>
                            {req.status === "APPROVED" ? "Disetujui" : "Ditolak"} pada {formatDate(req.approved_at || req.updated_at)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(req);
                            setIsDetailModalOpen(true);
                          }}
                          className="h-8 px-2 text-xs font-bold text-ink-500 hover:text-ink gap-1"
                        >
                          <Eye size={13} /> Lihat Detail
                        </Button>

                        <button
                          type="button"
                          onClick={() => {
                            setDeletingRequest(req);
                            setIsDeleteModalOpen(true);
                          }}
                          className="w-8 h-8 rounded-xl bg-cloud/50 text-ink-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all cursor-pointer"
                          title="Hapus Permohonan"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Table View */}
          {viewMode === "table" && (
            <div className="bg-white rounded-3xl border border-ink/5 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-cloud/50 text-ink-400 font-extrabold uppercase tracking-wider border-b border-ink/5">
                    <tr>
                      <th className="py-4 px-5">Karyawan</th>
                      <th className="py-4 px-4">Jenis Izin</th>
                      <th className="py-4 px-4">Periode & Durasi</th>
                      <th className="py-4 px-4">Alasan</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {filteredRequests.map((req) => {
                      const statusConf = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
                      const StatusIcon = statusConf.icon;

                      return (
                        <tr key={req.id} className="hover:bg-cloud/30 transition-colors">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-cloud text-ink-700 font-bold flex items-center justify-center overflow-hidden shrink-0 text-xs">
                                {req.employee?.photo_url ? (
                                  <img
                                    src={req.employee.photo_url}
                                    alt={req.employee.full_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  req.employee?.full_name.substring(0, 2).toUpperCase() || "KW"
                                )}
                              </div>
                              <div>
                                <div className="font-extrabold text-ink text-sm">
                                  {req.employee?.full_name}
                                </div>
                                <div className="text-[11px] text-ink-400">
                                  {req.employee?.position} • {req.employee?.employee_code}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">
                              {req.leave_type?.name}
                            </span>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="font-bold text-ink">
                              {formatDate(req.start_date)} - {formatDate(req.end_date)}
                            </div>
                            <div className="text-[11px] text-ink-400">Total: {req.total_days} Hari</div>
                          </td>
                          <td className="py-4 px-4 max-w-xs">
                            <p className="line-clamp-2 text-ink-600">{req.reason}</p>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${statusConf.badge}`}>
                              <StatusIcon size={11} /> {statusConf.label}
                            </span>
                          </td>
                          <td className="py-4 px-5 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {req.status === "PENDING" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openApprovalModal(req, "APPROVE")}
                                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                                    title="Setujui"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openApprovalModal(req, "REJECT")}
                                    className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                                    title="Tolak"
                                  >
                                    <X size={14} />
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setIsDetailModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-cloud/50 text-ink-600 hover:bg-cloud cursor-pointer"
                                title="Detail"
                              >
                                <Eye size={14} />
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

          {/* Empty State */}
          {filteredRequests.length === 0 && (
            <div className="py-16 text-center flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-ink/10 p-6">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-4">
                <CalendarDays size={28} />
              </div>
              <h3 className="text-base font-extrabold text-ink">Tidak Ada Permohonan Izin</h3>
              <p className="text-ink-400 text-xs sm:text-sm mt-1 max-w-sm">
                Belum ada data permohonan cuti atau izin yang sesuai dengan kriteria filter.
              </p>
              <Button
                onClick={openCreateModal}
                className="mt-5 rounded-2xl text-xs font-bold bg-ink text-white"
              >
                <Plus size={14} className="mr-1.5" /> Ajukan Izin Baru
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REKAP SALDO CUTI */}
      {activeTab === "balances" && (
        <div className="space-y-5">
          {/* Balance Filter Header */}
          <div className="bg-white rounded-3xl p-5 border border-ink/5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-lg text-ink">Rekap Kuota Saldo Cuti Karyawan</h3>
              <p className="text-xs text-ink-400 mt-0.5">
                Monitoring hak kuota cuti tahunan (12 hari/tahun) dan sisa saldo seluruh guru & staf.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <Input
                placeholder="Cari nama karyawan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 rounded-2xl bg-cloud/40 border-ink/10 text-xs"
              />
            </div>
          </div>

          {/* Balance Cards / Table */}
          <div className="bg-white rounded-3xl border border-ink/5 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-cloud/50 text-ink-400 font-extrabold uppercase tracking-wider border-b border-ink/5">
                  <tr>
                    <th className="py-4 px-5">Karyawan</th>
                    <th className="py-4 px-4">Jabatan & Divisi</th>
                    <th className="py-4 px-4 text-center">Hak Cuti</th>
                    <th className="py-4 px-4 text-center">Terpakai</th>
                    <th className="py-4 px-4 text-center">Sisa Saldo</th>
                    <th className="py-4 px-4">Penggunaan Kuota</th>
                    <th className="py-4 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {filteredBalances.map((bal) => {
                    const usagePercent =
                      bal.total_days > 0
                        ? Math.min(100, Math.round((bal.used_days / bal.total_days) * 100))
                        : 0;

                    return (
                      <tr key={bal.id} className="hover:bg-cloud/30 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-cloud text-ink-700 font-bold flex items-center justify-center overflow-hidden shrink-0 text-xs">
                              {bal.photo_url ? (
                                <img
                                  src={bal.photo_url}
                                  alt={bal.employee_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                bal.employee_name?.substring(0, 2).toUpperCase() || "KW"
                              )}
                            </div>
                            <div>
                              <div className="font-extrabold text-ink text-sm">
                                {bal.employee_name}
                              </div>
                              <div className="text-[11px] text-ink-400 font-mono">
                                {bal.employee_code}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-ink">{bal.position}</div>
                          <div className="text-[11px] text-ink-400">
                            {bal.employee_type === "GURU" ? "Tenaga Pendidik" : "Staf Operasional"}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center font-extrabold text-ink">
                          {bal.total_days} Hari
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-amber-600">
                          {bal.used_days} Hari
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200">
                            {bal.remaining_days} Hari
                          </span>
                        </td>
                        <td className="py-4 px-4 min-w-[140px]">
                          <div className="flex items-center justify-between text-[10px] font-bold text-ink-400 mb-1">
                            <span>{usagePercent}%</span>
                            <span>{bal.used_days}/{bal.total_days}</span>
                          </div>
                          <div className="w-full bg-cloud-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                usagePercent > 80
                                  ? "bg-rose-500"
                                  : usagePercent > 50
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAdjustBalanceModal(bal)}
                            className="rounded-xl text-xs font-bold border-ink/10 hover:bg-cloud"
                          >
                            <SlidersHorizontal size={13} className="mr-1" /> Sesuaikan
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KALENDER CUTI TIM */}
      {activeTab === "calendar" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-ink/5 shadow-2xs space-y-6">
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-ink/5">
            <div>
              <h3 className="font-extrabold text-xl text-ink">
                Kalender Jadwal Cuti & Izin
              </h3>
              <p className="text-xs text-ink-400 mt-0.5">
                Visualisasi siapa saja guru & staf yang sedang izin atau cuti pada bulan ini.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCalendarDate(
                    new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1)
                  )
                }
                className="rounded-xl h-9 w-9"
              >
                <ChevronLeft size={16} />
              </Button>
              <div className="px-4 py-1.5 rounded-xl bg-cloud font-extrabold text-sm text-ink min-w-[140px] text-center">
                {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCalendarDate(
                    new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1)
                  )
                }
                className="rounded-xl h-9 w-9"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-2">
            {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((dayName) => (
              <div
                key={dayName}
                className="p-2 text-center text-xs font-extrabold text-ink-400 uppercase tracking-wider"
              >
                {dayName}
              </div>
            ))}

            {calendarDays.map((d, index) => {
              if (!d) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="min-h-[100px] p-2 rounded-2xl bg-cloud/20 border border-transparent"
                  />
                );
              }

              const isToday =
                new Date().toISOString().split("T")[0] === d.dateStr;

              return (
                <div
                  key={d.dateStr}
                  className={`min-h-[100px] p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                    isToday
                      ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200"
                      : "bg-white border-ink/5 hover:border-ink/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-extrabold ${
                        isToday
                          ? "w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]"
                          : "text-ink-600"
                      }`}
                    >
                      {d.dayNumber}
                    </span>
                    {d.leaves.length > 0 && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded-md">
                        {d.leaves.length} Cuti
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-[60px]">
                    {d.leaves.map((l) => (
                      <div
                        key={l.id}
                        onClick={() => {
                          setSelectedRequest(l);
                          setIsDetailModalOpen(true);
                        }}
                        className="px-1.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/60 text-[10px] font-bold truncate cursor-pointer hover:bg-amber-100"
                        title={`${l.employee?.full_name} (${l.leave_type?.name})`}
                      >
                        {l.employee?.full_name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: AJUKAN PERMOHONAN IZIN BARU */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-ink/10 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-ink/5 flex items-center justify-between bg-cloud/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-ink tracking-tight">
                    Ajukan Permohonan Izin / Cuti
                  </h2>
                  <p className="text-xs text-ink-400">
                    Isi formulir permohonan izin karyawan untuk diverifikasi HR
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-white border border-ink/10 hover:bg-cloud flex items-center justify-center text-ink-400 hover:text-ink transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
              {/* Employee Selector */}
              <div className="space-y-1.5">
                <Label htmlFor="emp_id" className="text-sm font-bold text-ink-700">
                  Pilih Karyawan Pemohon <span className="text-rose-500">*</span>
                </Label>
                <select
                  id="emp_id"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  required
                  className="w-full h-12 px-4 rounded-2xl bg-cloud/40 border border-ink/10 text-sm font-bold text-ink-700 outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_code}) - {emp.position || emp.employee_type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Leave Type Selector + Quota Alert */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="leave_type" className="text-sm font-bold text-ink-700">
                    Jenis Izin / Cuti <span className="text-rose-500">*</span>
                  </Label>
                  <select
                    id="leave_type"
                    value={formData.leave_type_id}
                    onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
                    required
                    className="w-full h-12 px-4 rounded-2xl bg-cloud/40 border border-ink/10 text-sm font-bold text-ink-700 outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {leaveTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.is_deductible ? "(Potong Cuti)" : "(Non-Kuota)"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quota Indicator Box */}
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-center">
                  <div className="text-[11px] font-bold text-emerald-800">
                    Status Saldo Cuti Pemohon:
                  </div>
                  <div className="text-xs text-emerald-900 font-extrabold mt-0.5">
                    Sisa: {selectedEmpBalance?.remaining_days ?? 12} Hari (dari {selectedEmpBalance?.total_days ?? 12} Hari)
                  </div>
                </div>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="start_date" className="text-sm font-bold text-ink-700">
                    Tanggal Mulai <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => handleDateChange(e.target.value, formData.end_date || e.target.value)}
                    className="h-12 rounded-2xl bg-cloud/40 border-ink/10 text-sm font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="end_date" className="text-sm font-bold text-ink-700">
                    Tanggal Selesai <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="end_date"
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => handleDateChange(formData.start_date, e.target.value)}
                    className="h-12 rounded-2xl bg-cloud/40 border-ink/10 text-sm font-bold"
                  />
                </div>
              </div>

              {/* Duration Calculation Banner */}
              <div className="p-3.5 rounded-2xl bg-cloud/50 border border-ink/5 flex items-center justify-between text-xs">
                <span className="font-bold text-ink-500">Estimasi Total Hari Kerja:</span>
                <span className="font-extrabold text-sm text-emerald-700">
                  {formData.total_days} Hari
                </span>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <Label htmlFor="reason" className="text-sm font-bold text-ink-700">
                  Alasan Permohonan Izin <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Tuliskan keterangan lengkap alasan pengajuan izin atau cuti..."
                  required
                  rows={4}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="rounded-2xl bg-cloud/40 border-ink/10 text-xs sm:text-sm font-medium leading-relaxed p-4 focus-visible:ring-emerald-500"
                />
              </div>

              {/* Attachment */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-ink-700">
                  Dokumen Pendukung (Surat Dokter / Surat Tugas)
                </Label>
                {formData.document_url ? (
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-2.5">
                      <FileText size={18} className="text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-950">
                        {uploadedDocName || "Dokumen Terunggah"}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFormData({ ...formData, document_url: "" });
                        setUploadedDocName(null);
                      }}
                      className="text-xs text-rose-600 hover:bg-rose-50 rounded-xl"
                    >
                      Hapus
                    </Button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-ink/10 hover:border-emerald-400 rounded-2xl p-5 flex flex-col items-center justify-center gap-1.5 hover:bg-emerald-50/30 transition-all cursor-pointer text-center">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.docx"
                      onChange={handleDocumentUpload}
                      className="hidden"
                      disabled={isUploadingDoc}
                    />
                    <UploadCloud size={24} className="text-ink-400" />
                    <span className="text-xs font-bold text-ink">
                      {isUploadingDoc ? "Mengunggah file..." : "Upload surat dokter atau dokumen"}
                    </span>
                    <span className="text-[11px] text-ink-400">PDF, JPG, PNG (Maks 5MB)</span>
                  </label>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-ink/5 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-2xl h-11 px-5 text-xs font-bold"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || isUploadingDoc}
                  className="rounded-2xl h-11 px-7 text-xs font-bold bg-ink hover:bg-ink/90 text-white shadow-md cursor-pointer gap-2"
                >
                  {isPending ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Ajukan Permohonan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAIL PERMOHONAN */}
      {isDetailModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl border border-ink/10 overflow-hidden my-auto">
            <div className="p-5 border-b border-ink/5 bg-cloud/30 flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-ink">Detail Permohonan Izin</h3>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white border border-ink/10 flex items-center justify-center text-ink-400 hover:text-ink cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Employee Summary Card */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-cloud/40 border border-ink/5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center overflow-hidden">
                  {selectedRequest.employee?.photo_url ? (
                    <img
                      src={selectedRequest.employee.photo_url}
                      alt={selectedRequest.employee.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    selectedRequest.employee?.full_name.substring(0, 2).toUpperCase() || "KW"
                  )}
                </div>
                <div>
                  <div className="font-extrabold text-sm text-ink">{selectedRequest.employee?.full_name}</div>
                  <div className="text-ink-400">
                    {selectedRequest.employee?.position} • {selectedRequest.employee?.employee_code}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-cloud/20 border border-ink/5">
                <div>
                  <span className="text-ink-400 font-medium">Jenis Izin:</span>
                  <div className="font-bold text-ink mt-0.5">{selectedRequest.leave_type?.name}</div>
                </div>
                <div>
                  <span className="text-ink-400 font-medium">Status:</span>
                  <div className="font-bold text-ink mt-0.5">{selectedRequest.status}</div>
                </div>
                <div>
                  <span className="text-ink-400 font-medium">Mulai:</span>
                  <div className="font-bold text-ink mt-0.5">{formatDate(selectedRequest.start_date)}</div>
                </div>
                <div>
                  <span className="text-ink-400 font-medium">Selesai:</span>
                  <div className="font-bold text-ink mt-0.5">{formatDate(selectedRequest.end_date)}</div>
                </div>
                <div>
                  <span className="text-ink-400 font-medium">Total Durasi:</span>
                  <div className="font-bold text-emerald-700 mt-0.5">{selectedRequest.total_days} Hari Kerja</div>
                </div>
                <div>
                  <span className="text-ink-400 font-medium">Diajukan Pada:</span>
                  <div className="font-bold text-ink mt-0.5">{formatDate(selectedRequest.created_at)}</div>
                </div>
              </div>

              <div>
                <span className="text-ink-400 font-medium block mb-1">Alasan Pengajuan:</span>
                <div className="p-3.5 rounded-2xl bg-cloud/30 border border-ink/5 text-ink-700 leading-relaxed whitespace-pre-line">
                  {selectedRequest.reason}
                </div>
              </div>

              {selectedRequest.notes && !selectedRequest.notes.startsWith("http") && (
                <div>
                  <span className="text-ink-400 font-medium block mb-1">Catatan HR / Approver:</span>
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800">
                    {selectedRequest.notes}
                  </div>
                </div>
              )}

              {selectedRequest.document_url && (
                <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between">
                  <span className="font-bold text-sky-900">Dokumen Pendukung Terlampir</span>
                  <a
                    href={selectedRequest.document_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-sky-600 text-white font-bold flex items-center gap-1"
                  >
                    <Download size={12} /> Unduh
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-ink/5 bg-cloud/20 flex items-center justify-end">
              <Button
                size="sm"
                onClick={() => setIsDetailModalOpen(false)}
                className="rounded-xl text-xs font-bold bg-ink text-white"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: APPROVAL / REJECT CONFIRMATION */}
      {isApprovalModalOpen && approvalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-ink/10 space-y-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                approvalAction === "APPROVE" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              }`}
            >
              {approvalAction === "APPROVE" ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-ink">
                {approvalAction === "APPROVE" ? "Setujui Permohonan Izin?" : "Tolak Permohonan Izin?"}
              </h3>
              <p className="text-xs text-ink-500 mt-1">
                Permohonan dari <span className="font-bold text-ink">{approvalTarget.employee?.full_name}</span> selama{" "}
                <span className="font-bold text-ink">{approvalTarget.total_days} hari</span> ({approvalTarget.leave_type?.name}).
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="app_notes" className="text-xs font-bold text-ink-700">
                {approvalAction === "APPROVE" ? "Catatan Tambahan (Opsional)" : "Alasan Penolakan (Wajib)"}
              </Label>
              <Textarea
                id="app_notes"
                placeholder={
                  approvalAction === "APPROVE"
                    ? "Contoh: Selamat berlibur / Segera pulih..."
                    : "Contoh: Jadwal bertabrakan dengan ujian tengah semester..."
                }
                required={approvalAction === "REJECT"}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="rounded-2xl text-xs bg-cloud/40"
                rows={3}
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                variant="ghost"
                onClick={() => setIsApprovalModalOpen(false)}
                className="rounded-xl text-xs font-bold"
              >
                Batal
              </Button>
              <Button
                onClick={handleApprovalSubmit}
                disabled={isPending}
                className={`rounded-xl text-xs font-bold text-white shadow-sm ${
                  approvalAction === "APPROVE"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {isPending
                  ? "Memproses..."
                  : approvalAction === "APPROVE"
                  ? "Ya, Setujui Sekarang"
                  : "Ya, Tolak Permohonan"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ADJUST BALANCE */}
      {isAdjustBalanceOpen && adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-ink/10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <SlidersHorizontal size={22} />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-ink">Sesuaikan Saldo Cuti</h3>
              <p className="text-xs text-ink-500 mt-1">
                Karyawan: <span className="font-bold text-ink">{adjustTarget.employee_name}</span> ({adjustTarget.employee_code})
              </p>
            </div>

            <form onSubmit={handleAdjustBalanceSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="adj_total" className="text-xs font-bold text-ink-700">
                  Total Kuota Hak Cuti (Hari)
                </Label>
                <Input
                  id="adj_total"
                  type="number"
                  min="0"
                  max="50"
                  required
                  value={adjustTotalDays}
                  onChange={(e) => setAdjustTotalDays(Number(e.target.value))}
                  className="h-11 rounded-2xl text-xs font-bold bg-cloud/40"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adj_used" className="text-xs font-bold text-ink-700">
                  Jumlah Hari Terpakai
                </Label>
                <Input
                  id="adj_used"
                  type="number"
                  min="0"
                  max={adjustTotalDays}
                  required
                  value={adjustUsedDays}
                  onChange={(e) => setAdjustUsedDays(Number(e.target.value))}
                  className="h-11 rounded-2xl text-xs font-bold bg-cloud/40"
                />
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex justify-between">
                <span>Sisa Saldo Baru:</span>
                <span>{Math.max(0, adjustTotalDays - adjustUsedDays)} Hari</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsAdjustBalanceOpen(false)}
                  className="rounded-xl text-xs font-bold"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl text-xs font-bold bg-ink text-white"
                >
                  {isPending ? "Menyimpan..." : "Simpan Penyesuaian"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: DELETE CONFIRMATION */}
      {isDeleteModalOpen && deletingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-ink/10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 size={24} />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-ink">Hapus Permohonan Ini?</h3>
              <p className="text-xs text-ink-500 mt-1">
                Permohonan izin <span className="font-bold text-ink">{deletingRequest.employee?.full_name}</span> akan dihapus permanen dari sistem.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                variant="ghost"
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-xl text-xs font-bold"
              >
                Batal
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                {isPending ? "Menghapus..." : "Ya, Hapus Sekarang"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
