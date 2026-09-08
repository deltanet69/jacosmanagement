"use client";

import { useState, useTransition, useMemo, useRef } from "react";
import {
  FileText,
  DollarSign,
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Plus,
  Filter,
  Download,
  Eye,
  Edit2,
  Trash2,
  Car,
  Utensils,
  GraduationCap,
  Briefcase,
  Layers,
  Sparkles,
  CreditCard,
  Building,
  User,
  ExternalLink,
  Calendar,
  Check,
  X,
  Send,
  PieChart,
  FileSpreadsheet,
  Paperclip,
  ZoomIn,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ReimburseRecord,
  EmployeeInfo,
  ReimburseDashboardStats,
  ReimburseCategory,
  ReimburseStatus,
  CreateReimburseInput,
  createReimbursement,
  approveReimbursement,
  rejectReimbursement,
  markReimbursementAsPaid,
  deleteReimbursement,
} from "@/app/management/hr/reimburse/actions";
import { formatRupiah, angkaKeTerbilang } from "@/lib/utils/terbilang";

interface ReimburseListClientProps {
  initialReimbursements: ReimburseRecord[];
  employees: EmployeeInfo[];
  initialStats: ReimburseDashboardStats;
}

type MainTab = "claims" | "employees" | "analytics";

const CATEGORY_CONFIG: Record<
  ReimburseCategory,
  { label: string; icon: any; badge: string; color: string }
> = {
  TRANSPORTASI: {
    label: "Transportasi",
    icon: Car,
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
    color: "text-blue-600 dark:text-blue-400",
  },
  KONSUMSI: {
    label: "Konsumsi",
    icon: Utensils,
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
    color: "text-amber-600 dark:text-amber-400",
  },
  PELATIHAN: {
    label: "Pelatihan",
    icon: GraduationCap,
    badge: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300",
    color: "text-purple-600 dark:text-purple-400",
  },
  OPERASIONAL: {
    label: "Operasional",
    icon: Briefcase,
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
    color: "text-emerald-600 dark:text-emerald-400",
  },
  LAINNYA: {
    label: "Lainnya",
    icon: Layers,
    badge: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
    color: "text-slate-600 dark:text-slate-400",
  },
};

const STATUS_CONFIG: Record<
  ReimburseStatus,
  { label: string; badge: string; icon: any; dot: string }
> = {
  PENDING: {
    label: "Menunggu Approval",
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800",
    icon: Clock,
    dot: "bg-amber-500",
  },
  APPROVED: {
    label: "Disetujui (Siap Dibayar)",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800",
    icon: CheckCircle2,
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "Ditolak",
    badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800",
    icon: XCircle,
    dot: "bg-rose-500",
  },
  PAID: {
    label: "Sudah Ditransfer",
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800",
    icon: CheckCircle2,
    dot: "bg-blue-500",
  },
};

export function ReimburseListClient({
  initialReimbursements,
  employees,
  initialStats,
}: ReimburseListClientProps) {
  // Main Data States
  const [reimbursements, setReimbursements] = useState<ReimburseRecord[]>(initialReimbursements);
  const [activeTab, setActiveTab] = useState<MainTab>("claims");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Transitions & Toast
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<ReimburseRecord | null>(null);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<ReimburseRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectInternalNotes, setRejectInternalNotes] = useState("");

  const [isPaidModalOpen, setIsPaidModalOpen] = useState(false);
  const [paidTarget, setPaidTarget] = useState<ReimburseRecord | null>(null);
  const [paymentDateInput, setPaymentDateInput] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [paymentRefInput, setPaymentRefInput] = useState<string>("");

  const [isReceiptLightboxOpen, setIsReceiptLightboxOpen] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingClaim, setDeletingClaim] = useState<ReimburseRecord | null>(null);

  // Form State: New Claim
  const [formData, setFormData] = useState<CreateReimburseInput>({
    employee_id: employees[0]?.id || "",
    category: "TRANSPORTASI",
    transaction_date: new Date().toISOString().split("T")[0],
    description: "",
    amount: 150000,
    receipt_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800",
    receipt_file_name: "struk_bukti_transaksi.jpg",
    internal_notes: "",
  });

  const showNotification = (type: "success" | "error", message?: string | null) => {
    if (!message) return;
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const employeeMap = useMemo(() => {
    const map = new Map<string, EmployeeInfo>();
    employees.forEach((emp) => map.set(emp.id, emp));
    return map;
  }, [employees]);

  // Filtered List
  const filteredClaims = useMemo(() => {
    return reimbursements.filter((claim) => {
      if (statusFilter !== "ALL" && claim.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && claim.category !== categoryFilter) return false;

      if (roleFilter !== "ALL") {
        const emp = claim.employee || employeeMap.get(claim.employee_id);
        const empType = emp?.employee_type || "STAF";
        if (roleFilter === "GURU" && empType !== "GURU") return false;
        if (roleFilter === "STAF" && empType === "GURU") return false;
      }

      if (search.trim() !== "") {
        const q = search.toLowerCase();
        const emp = claim.employee || employeeMap.get(claim.employee_id);
        const nameMatch = emp?.full_name?.toLowerCase().includes(q);
        const nikMatch = emp?.nik?.toLowerCase().includes(q);
        const claimMatch = claim.claim_number?.toLowerCase().includes(q);
        const descMatch = claim.description?.toLowerCase().includes(q);
        if (!nameMatch && !nikMatch && !claimMatch && !descMatch) return false;
      }

      return true;
    });
  }, [reimbursements, statusFilter, categoryFilter, roleFilter, search, employeeMap]);

  // Dynamic Statistics
  const dynamicStats = useMemo(() => {
    const totalClaims = filteredClaims.length;
    const totalAmount = filteredClaims.reduce((acc, r) => acc + (r.amount || 0), 0);

    const pendingClaims = filteredClaims.filter((r) => r.status === "PENDING");
    const pendingAmount = pendingClaims.reduce((acc, r) => acc + (r.amount || 0), 0);

    const approvedClaims = filteredClaims.filter((r) => r.status === "APPROVED");
    const approvedAmount = approvedClaims.reduce((acc, r) => acc + (r.amount || 0), 0);

    const paidClaims = filteredClaims.filter((r) => r.status === "PAID");
    const paidAmount = paidClaims.reduce((acc, r) => acc + (r.amount || 0), 0);

    const rejectedClaims = filteredClaims.filter((r) => r.status === "REJECTED");
    const rejectedAmount = rejectedClaims.reduce((acc, r) => acc + (r.amount || 0), 0);

    return {
      totalClaims,
      totalAmount,
      pendingCount: pendingClaims.length,
      pendingAmount,
      approvedCount: approvedClaims.length,
      approvedAmount,
      paidCount: paidClaims.length,
      paidAmount,
      rejectedCount: rejectedClaims.length,
      rejectedAmount,
    };
  }, [filteredClaims]);

  // Handlers
  const handleOpenCreateModal = () => {
    setFormData({
      employee_id: employees[0]?.id || "",
      category: "TRANSPORTASI",
      transaction_date: new Date().toISOString().split("T")[0],
      description: "",
      amount: 100000,
      receipt_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800",
      receipt_file_name: "struk_pengeluaran_operasional.jpg",
      internal_notes: "",
    });
    setIsCreateModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || formData.description.length < 10) {
      showNotification("error", "Deskripsi pengajuan minimal 10 karakter");
      return;
    }
    if (formData.amount <= 0) {
      showNotification("error", "Nominal reimbursement harus lebih dari Rp 0");
      return;
    }

    startTransition(async () => {
      const res = await createReimbursement(formData);
      if (res.success) {
        showNotification("success", res.message);
        setIsCreateModalOpen(false);
        if (res.data) {
          const newRecord: ReimburseRecord = {
            ...res.data,
            id: `rem-${Date.now()}`,
            employee: employeeMap.get(res.data.employee_id) || null,
          };
          setReimbursements((prev) => [newRecord, ...prev]);
        }
      } else {
        showNotification("error", res.error);
      }
    });
  };

  const handleApprove = (claim: ReimburseRecord) => {
    startTransition(async () => {
      const res = await approveReimbursement({ id: claim.id });
      if (res.success) {
        showNotification("success", res.message);
        setReimbursements((prev) =>
          prev.map((r) =>
            r.id === claim.id
              ? {
                  ...r,
                  status: "APPROVED",
                  approved_by: "HR Head",
                  approved_at: new Date().toISOString(),
                }
              : r
          )
        );
        if (selectedClaim?.id === claim.id) {
          setSelectedClaim((prev) => (prev ? { ...prev, status: "APPROVED" } : null));
        }
      } else {
        showNotification("error", res.error);
      }
    });
  };

  const handleOpenRejectModal = (claim: ReimburseRecord) => {
    setRejectTarget(claim);
    setRejectionReason("");
    setRejectInternalNotes("");
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (!rejectTarget) return;
    if (!rejectionReason.trim()) {
      showNotification("error", "Mohon isi alasan penolakan");
      return;
    }

    startTransition(async () => {
      const res = await rejectReimbursement({
        id: rejectTarget.id,
        rejection_reason: rejectionReason,
        internal_notes: rejectInternalNotes,
      });
      if (res.success) {
        showNotification("success", res.message);
        setIsRejectModalOpen(false);
        setReimbursements((prev) =>
          prev.map((r) =>
            r.id === rejectTarget.id
              ? {
                  ...r,
                  status: "REJECTED",
                  rejection_reason: rejectionReason,
                  internal_notes: rejectInternalNotes,
                }
              : r
          )
        );
        if (selectedClaim?.id === rejectTarget.id) {
          setSelectedClaim((prev) =>
            prev ? { ...prev, status: "REJECTED", rejection_reason: rejectionReason } : null
          );
        }
      } else {
        showNotification("error", res.error);
      }
    });
  };

  const handleOpenPaidModal = (claim: ReimburseRecord) => {
    setPaidTarget(claim);
    setPaymentDateInput(new Date().toISOString().split("T")[0]);
    setPaymentRefInput(`TRF-BCA-${Math.floor(100000 + Math.random() * 900000)}`);
    setIsPaidModalOpen(true);
  };

  const handleConfirmPaid = () => {
    if (!paidTarget) return;
    startTransition(async () => {
      const res = await markReimbursementAsPaid({
        id: paidTarget.id,
        payment_date: paymentDateInput,
        payment_reference: paymentRefInput,
      });
      if (res.success) {
        showNotification("success", res.message);
        setIsPaidModalOpen(false);
        setReimbursements((prev) =>
          prev.map((r) =>
            r.id === paidTarget.id
              ? {
                  ...r,
                  status: "PAID",
                  payment_date: paymentDateInput,
                  payment_reference: paymentRefInput,
                }
              : r
          )
        );
        if (selectedClaim?.id === paidTarget.id) {
          setSelectedClaim((prev) =>
            prev
              ? {
                  ...prev,
                  status: "PAID",
                  payment_date: paymentDateInput,
                  payment_reference: paymentRefInput,
                }
              : null
          );
        }
      } else {
        showNotification("error", res.error);
      }
    });
  };

  const handleDeleteClaim = () => {
    if (!deletingClaim) return;
    startTransition(async () => {
      const res = await deleteReimbursement(deletingClaim.id);
      if (res.success) {
        showNotification("success", res.message);
        setIsDeleteModalOpen(false);
        setReimbursements((prev) => prev.filter((r) => r.id !== deletingClaim.id));
        if (selectedClaim?.id === deletingClaim.id) {
          setIsDetailModalOpen(false);
        }
      } else {
        showNotification("error", res.error);
      }
    });
  };

  // Lightbox View
  const handleViewReceiptImage = (url: string | null, title: string) => {
    if (!url) return;
    setLightboxImageUrl(url);
    setLightboxTitle(title);
    setIsReceiptLightboxOpen(true);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "No Klaim",
      "NIK",
      "Nama Karyawan",
      "Jabatan",
      "Kategori",
      "Tanggal Transaksi",
      "Nominal",
      "Status",
      "Deskripsi",
      "Tanggal Bayar",
      "Ref Pembayaran",
      "Alasan Penolakan",
    ];

    const rows = filteredClaims.map((c) => {
      const emp = c.employee || employeeMap.get(c.employee_id);
      return [
        `"${c.claim_number}"`,
        `"${emp?.nik || ""}"`,
        `"${emp?.full_name || ""}"`,
        `"${emp?.position || ""}"`,
        `"${c.category}"`,
        `"${c.transaction_date}"`,
        c.amount,
        `"${c.status}"`,
        `"${c.description.replace(/"/g, '""')}"`,
        `"${c.payment_date || "-"}"`,
        `"${c.payment_reference || "-"}"`,
        `"${(c.rejection_reason || "").replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Reimbursement_JACOS_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("success", "Rekap reimbursement berhasil diexport ke CSV");
  };

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-medium transition-all transform duration-300 animate-in fade-in slide-in-from-bottom-5 ${
            notification.type === "success"
              ? "bg-emerald-950/90 text-emerald-100 border-emerald-500/30 backdrop-blur-md"
              : "bg-rose-950/90 text-rose-100 border-rose-500/30 backdrop-blur-md"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-teal-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold tracking-wide">
            <Receipt className="w-3.5 h-3.5" />
            <span>Administrasi & Pengeluaran Dinas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Reimbursement Management
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Pusat pengajuan, persetujuan (approval), verifikasi bukti kuitansi/struk, dan pelacakan
            pembayaran reimburse operasional dinas guru & staf JACOS.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <Button
            onClick={handleOpenCreateModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-900/30 rounded-xl px-4 py-2.5 h-auto text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Ajukan Reimbursement</span>
          </Button>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 rounded-xl px-3.5 py-2.5 h-auto text-sm flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pengajuan */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-teal-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Pengajuan Klaim
            </span>
            <div className="p-2.5 bg-teal-50 dark:bg-teal-950/50 rounded-xl text-teal-600 dark:text-teal-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatRupiah(dynamicStats.totalAmount)}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {dynamicStats.totalClaims} Pengajuan
              </span>
              <span>• Total pengeluaran dinas</span>
            </div>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-teal-600 h-full rounded-full w-full" />
          </div>
        </div>

        {/* Menunggu Approval / Pending */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Menunggu Approval
            </span>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {formatRupiah(dynamicStats.pendingAmount)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500 font-medium">
              <span>{dynamicStats.pendingCount} Klaim Pending HR</span>
            </div>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${
                  dynamicStats.totalClaims > 0
                    ? (dynamicStats.pendingCount / dynamicStats.totalClaims) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Disetujui / Siap Dibayar */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Disetujui (Siap Cair)
            </span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatRupiah(dynamicStats.approvedAmount)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-500 font-medium">
              <span>{dynamicStats.approvedCount} Klaim Disetujui</span>
            </div>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${
                  dynamicStats.totalClaims > 0
                    ? (dynamicStats.approvedCount / dynamicStats.totalClaims) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Sudah Dibayarkan / Lunas */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Sudah Ditransfer
            </span>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {formatRupiah(dynamicStats.paidAmount)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-500 font-medium">
              <span>{dynamicStats.paidCount} Klaim Lunas</span>
            </div>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${
                  dynamicStats.totalClaims > 0
                    ? (dynamicStats.paidCount / dynamicStats.totalClaims) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Tabs Navigation & Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Top Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("claims")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === "claims"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Daftar Pengajuan ({filteredClaims.length})
            </button>
            <button
              onClick={() => setActiveTab("employees")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === "employees"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Riwayat per Karyawan ({employees.length})
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === "analytics"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Distribusi Kategori & Laporan
            </button>
          </div>

          {activeTab === "claims" && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-md text-xs transition-colors ${
                    viewMode === "table"
                      ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Table View"
                >
                  <Layers className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md text-xs transition-colors ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Grid View"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari pengaju, NIK, no klaim, deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Menunggu Approval (Pending)</option>
              <option value="APPROVED">Disetujui (Approved)</option>
              <option value="PAID">Sudah Ditransfer (Paid)</option>
              <option value="REJECTED">Ditolak (Rejected)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="ALL">Semua Jenis Kategori</option>
              <option value="TRANSPORTASI">Transportasi</option>
              <option value="KONSUMSI">Konsumsi</option>
              <option value="PELATIHAN">Pelatihan</option>
              <option value="OPERASIONAL">Operasional</option>
              <option value="LAINNYA">Lainnya</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="ALL">Semua Peran (Guru & Staf)</option>
              <option value="GURU">Khusus Guru</option>
              <option value="STAF">Khusus Staf & Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* TAB 1: DAFTAR PENGAJUAN (CLAIMS) */}
      {activeTab === "claims" && (
        <div className="space-y-4">
          {filteredClaims.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-teal-50 dark:bg-teal-950/40 text-teal-500 rounded-2xl flex items-center justify-center mx-auto">
                <Receipt className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  Tidak ada pengajuan reimbursement yang sesuai
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Silakan sesuaikan filter pencarian atau ajukan klaim pengeluaran operasional baru.
                </p>
              </div>
              <Button
                onClick={handleOpenCreateModal}
                className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajukan Reimbursement Baru
              </Button>
            </div>
          ) : viewMode === "table" ? (
            /* Table View */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Klaim & Karyawan</th>
                      <th className="py-3.5 px-4">Jenis Kategori</th>
                      <th className="py-3.5 px-4">Tanggal & Deskripsi</th>
                      <th className="py-3.5 px-4 text-center">Bukti Nota</th>
                      <th className="py-3.5 px-4 text-right">Nominal</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredClaims.map((claim) => {
                      const emp = claim.employee || employeeMap.get(claim.employee_id);
                      const catInfo = CATEGORY_CONFIG[claim.category] || CATEGORY_CONFIG.LAINNYA;
                      const CatIcon = catInfo.icon;
                      const statusInfo = STATUS_CONFIG[claim.status] || STATUS_CONFIG.PENDING;

                      return (
                        <tr
                          key={claim.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* Employee Info */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                                {emp?.full_name ? emp.full_name.charAt(0) : "K"}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                  <span>{emp?.full_name || "Karyawan JACOS"}</span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      emp?.employee_type === "GURU"
                                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                        : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                    }`}
                                  >
                                    {emp?.employee_type || "STAF"}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 font-mono">
                                  <span>{claim.claim_number}</span>
                                  <span>•</span>
                                  <span>{emp?.position || "Staff"}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${catInfo.badge}`}
                            >
                              <CatIcon className="w-3.5 h-3.5" />
                              <span>{catInfo.label}</span>
                            </span>
                          </td>

                          {/* Date & Description */}
                          <td className="py-4 px-4 max-w-xs">
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {claim.transaction_date}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
                              {claim.description}
                            </div>
                          </td>

                          {/* Receipt Struk */}
                          <td className="py-4 px-4 text-center">
                            {claim.receipt_url ? (
                              <button
                                onClick={() =>
                                  handleViewReceiptImage(
                                    claim.receipt_url,
                                    `Bukti ${claim.claim_number} - ${emp?.full_name}`
                                  )
                                }
                                className="group/btn inline-flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 font-medium px-2 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800"
                              >
                                <Paperclip className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                                <span>Lihat Struk</span>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Tanpa Bukti</span>
                            )}
                          </td>

                          {/* Amount */}
                          <td className="py-4 px-4 text-right">
                            <span className="font-bold font-mono text-sm px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
                              {formatRupiah(claim.amount)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.badge}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                              <span>{statusInfo.label}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Detail Modal */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedClaim(claim);
                                  setIsDetailModalOpen(true);
                                }}
                                className="h-8 px-2.5 bg-slate-50 hover:bg-teal-50 hover:text-teal-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 text-xs rounded-lg flex items-center gap-1"
                                title="Lihat Detail & Approval"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Detail</span>
                              </Button>

                              {/* Quick Approve (If Pending) */}
                              {claim.status === "PENDING" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(claim)}
                                  className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs flex items-center gap-1"
                                  title="Setujui Pengajuan"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span className="hidden xl:inline">Setujui</span>
                                </Button>
                              )}

                              {/* Mark as Paid (If Approved) */}
                              {claim.status === "APPROVED" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenPaidModal(claim)}
                                  className="h-8 px-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs flex items-center gap-1"
                                  title="Tandai Sudah Ditransfer"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span className="hidden xl:inline">Bayar</span>
                                </Button>
                              )}

                              {/* Reject Button (If Pending) */}
                              {claim.status === "PENDING" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenRejectModal(claim)}
                                  className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 border-slate-200 dark:border-slate-700 rounded-lg"
                                  title="Tolak Pengajuan"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              )}

                              {/* Delete Claim */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setDeletingClaim(claim);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-slate-200 dark:border-slate-700 rounded-lg"
                                title="Hapus Klaim"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClaims.map((claim) => {
                const emp = claim.employee || employeeMap.get(claim.employee_id);
                const catInfo = CATEGORY_CONFIG[claim.category] || CATEGORY_CONFIG.LAINNYA;
                const CatIcon = catInfo.icon;
                const statusInfo = STATUS_CONFIG[claim.status] || STATUS_CONFIG.PENDING;

                return (
                  <div
                    key={claim.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                            {emp?.full_name ? emp.full_name.charAt(0) : "K"}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1 text-sm">
                              {emp?.full_name || "Karyawan"}
                            </h4>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 font-mono">
                              <span>{claim.claim_number}</span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusInfo.badge}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* Category & Date */}
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${catInfo.badge}`}
                        >
                          <CatIcon className="w-3 h-3" />
                          <span>{catInfo.label}</span>
                        </span>
                        <span className="text-slate-500 font-medium">
                          {claim.transaction_date}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 line-clamp-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        {claim.description}
                      </p>

                      {/* Receipt Preview Thumbnail */}
                      {claim.receipt_url && (
                        <div className="mt-3 flex items-center justify-between text-xs p-2 bg-teal-50/70 dark:bg-teal-950/40 rounded-lg border border-teal-200/60 dark:border-teal-800/40">
                          <div className="flex items-center gap-1.5 text-teal-800 dark:text-teal-300 truncate">
                            <Paperclip className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{claim.receipt_file_name || "struk_nota.jpg"}</span>
                          </div>
                          <button
                            onClick={() =>
                              handleViewReceiptImage(
                                claim.receipt_url,
                                `Bukti ${claim.claim_number}`
                              )
                            }
                            className="text-teal-600 hover:text-teal-700 font-semibold shrink-0 ml-2"
                          >
                            Buka
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase">
                          Nominal
                        </span>
                        <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                          {formatRupiah(claim.amount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => {
                            setSelectedClaim(claim);
                            setIsDetailModalOpen(true);
                          }}
                          className="flex-1 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs h-9"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          Detail & Approval
                        </Button>

                        {claim.status === "PENDING" && (
                          <Button
                            onClick={() => handleApprove(claim)}
                            className="h-9 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs"
                            title="Setujui"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {claim.status === "APPROVED" && (
                          <Button
                            onClick={() => handleOpenPaidModal(claim)}
                            className="h-9 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs"
                            title="Bayar"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </Button>
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

      {/* TAB 2: RIWAYAT PER KARYAWAN */}
      {activeTab === "employees" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((emp) => {
              const empClaims = reimbursements.filter((r) => r.employee_id === emp.id);
              const totalEmpAmount = empClaims.reduce((acc, r) => acc + (r.amount || 0), 0);
              const paidEmpAmount = empClaims
                .filter((r) => r.status === "PAID")
                .reduce((acc, r) => acc + (r.amount || 0), 0);
              const pendingEmpClaims = empClaims.filter((r) => r.status === "PENDING");

              return (
                <div
                  key={emp.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                      {emp.full_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {emp.full_name}
                      </h4>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 font-mono">
                        <span>{emp.nik}</span>
                        <span>•</span>
                        <span>{emp.position}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Total Riwayat Pengajuan:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {empClaims.length} Klaim ({formatRupiah(totalEmpAmount)})
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Sudah Ditransfer (Lunas):</span>
                      <span className="font-mono font-bold">{formatRupiah(paidEmpAmount)}</span>
                    </div>
                    {pendingEmpClaims.length > 0 && (
                      <div className="flex justify-between text-amber-600 dark:text-amber-400">
                        <span>Pending Menunggu HR:</span>
                        <span className="font-bold">{pendingEmpClaims.length} Klaim</span>
                      </div>
                    )}
                  </div>

                  {empClaims.length > 0 ? (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase">
                        Klaim Terakhir:
                      </div>
                      {empClaims.slice(0, 2).map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedClaim(c);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-2 bg-slate-50/70 dark:bg-slate-800/30 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs cursor-pointer transition-colors"
                        >
                          <div className="truncate mr-2">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {c.description}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {c.transaction_date} • {c.category}
                            </div>
                          </div>
                          <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                            {formatRupiah(c.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic text-center py-2">
                      Belum ada riwayat reimbursement
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DISTRIBUSI KATEGORI & LAPORAN */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Breakdown Progress */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-teal-600" />
                    <span>Distribusi Pengeluaran per Kategori</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Komposisi total biaya operasional reimbursement yang diajukan oleh seluruh staf.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {initialStats.categories.map((cat) => {
                  const catInfo = CATEGORY_CONFIG[cat.category] || CATEGORY_CONFIG.LAINNYA;
                  const CatIcon = catInfo.icon;

                  return (
                    <div key={cat.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                          <CatIcon className={`w-4 h-4 ${catInfo.color}`} />
                          <span>{cat.label}</span>
                          <span className="text-slate-400 font-normal">({cat.count} Klaim)</span>
                        </div>
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatRupiah(cat.totalAmount)}{" "}
                          <span className="text-xs text-slate-500 font-normal">
                            ({cat.percentage}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Summary & Export Box */}
            <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-2xl p-6 border border-teal-500/20 shadow-xl flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="p-2.5 bg-teal-500/20 text-teal-300 w-fit rounded-xl border border-teal-400/30">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold">Ringkasan Audit Reimbursement</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Semua klaim reimbursement diverifikasi bersama bukti struk kuitansi yang sah dan
                  diintegrasikan ke modul keuangan sekolah.
                </p>

                <div className="pt-2 space-y-2 text-xs border-t border-slate-800">
                  <div className="flex justify-between text-slate-300">
                    <span>Total Seluruh Klaim:</span>
                    <span className="font-mono font-bold text-white">
                      {formatRupiah(initialStats.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Sudah Ditransfer:</span>
                    <span className="font-mono font-bold">
                      {formatRupiah(initialStats.paidAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-amber-400">
                    <span>Menunggu Pembayaran:</span>
                    <span className="font-mono font-bold">
                      {formatRupiah(initialStats.approvedAmount + initialStats.pendingAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleExportCSV}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs h-10 flex items-center justify-center gap-2 font-semibold shadow-lg shadow-teal-950/50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Laporan Excel / CSV</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: FORM PENGAJUAN REIMBURSEMENT BARU */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 my-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Form Pengajuan Reimbursement
                  </h3>
                  <p className="text-xs text-slate-500">
                    Klaim penggantian biaya operasional dan dinas sekolah
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Employee & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Karyawan Pengaju</Label>
                  <select
                    value={formData.employee_id}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, employee_id: e.target.value }))
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.nik})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Jenis Reimbursement</Label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value as ReimburseCategory,
                      }))
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="TRANSPORTASI">Transportasi (Bensin, Tol, Ojek)</option>
                    <option value="KONSUMSI">Konsumsi (Makan Rapat / Dinas)</option>
                    <option value="PELATIHAN">Pelatihan (Seminar, Workshop)</option>
                    <option value="OPERASIONAL">Operasional (ATK, Cetak, Kuota)</option>
                    <option value="LAINNYA">Keperluan Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Date & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tanggal Transaksi</Label>
                  <Input
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, transaction_date: e.target.value }))
                    }
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Nominal Biaya (IDR)</Label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, amount: Number(e.target.value) }))
                    }
                    className="h-10 text-xs font-mono rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Nominal Preview in Indonesian Words */}
              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl flex items-center justify-between">
                <div className="text-[11px] text-teal-800 dark:text-teal-300 italic">
                  Terbilang: &ldquo;{angkaKeTerbilang(formData.amount)}&rdquo;
                </div>
                <div className="font-bold font-mono text-teal-700 dark:text-teal-300 text-sm">
                  {formatRupiah(formData.amount)}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label className="text-xs">Deskripsi & Keperluan Penggunaan (Wajib)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Jelaskan secara detail keperluan pengeluaran dana operasional (minimal 10 karakter)..."
                  rows={3}
                  className="rounded-xl text-xs"
                />
              </div>

              {/* Struk / Bukti Upload Attachment */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Bukti Pendukung (Foto Struk / Nota / Kuitansi)
                  </Label>
                  <span className="text-[10px] text-slate-400">JPG, PNG, PDF (Maks 5MB)</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-300 dark:border-slate-600 relative flex items-center justify-center">
                    {formData.receipt_url ? (
                      <img
                        src={formData.receipt_url}
                        alt="Struk preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Paperclip className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <Input
                      type="text"
                      value={formData.receipt_file_name || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          receipt_file_name: e.target.value,
                        }))
                      }
                      placeholder="Nama file nota (contoh: struk_bensin_spbu.jpg)"
                      className="h-8 text-xs rounded-lg"
                    />
                    <div className="text-[10px] text-slate-500">
                      Lampiran struk terenkripsi dan disimpan di storage JACOS.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl h-9 text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl h-9 text-xs font-medium"
                >
                  {isPending ? "Mengirim..." : "Kirim Pengajuan Reimbursement"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DETAIL REIMBURSEMENT & APPROVAL HR */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-500/20 text-teal-300 rounded-xl border border-teal-500/30">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Detail Reimbursement</h3>
                  <p className="text-xs text-slate-300 font-mono">
                    {selectedClaim.claim_number}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    STATUS_CONFIG[selectedClaim.status]?.badge
                  }`}
                >
                  {STATUS_CONFIG[selectedClaim.status]?.label}
                </span>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-28 text-slate-500">Nama Pengaju</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      : {selectedClaim.employee?.full_name}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">Nomor Induk</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      : {selectedClaim.employee?.nik}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">Jabatan & Peran</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      : {selectedClaim.employee?.position} ({selectedClaim.employee?.employee_type})
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-28 text-slate-500">Jenis Kategori</span>
                    <span className="font-semibold text-teal-600 dark:text-teal-400">
                      : {CATEGORY_CONFIG[selectedClaim.category]?.label || selectedClaim.category}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">Tanggal Biaya</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      : {selectedClaim.transaction_date}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">Diajukan Pada</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      : {selectedClaim.created_at.split("T")[0]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nominal Highlight */}
              <div className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border-2 border-teal-500 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wider">
                    Nominal Yang Diajukan
                  </div>
                  <div className="text-xs font-medium text-teal-700 dark:text-teal-400 italic mt-0.5">
                    Terbilang: &ldquo;{angkaKeTerbilang(selectedClaim.amount)}&rdquo;
                  </div>
                </div>
                <div className="text-2xl font-extrabold font-mono text-teal-700 dark:text-teal-300">
                  {formatRupiah(selectedClaim.amount)}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Deskripsi Penggunaan:
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedClaim.description}
                </div>
              </div>

              {/* Bukti Pendukung Preview */}
              <div className="space-y-1.5">
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Bukti Pendukung (Struk / Nota):</span>
                  {selectedClaim.receipt_url && (
                    <button
                      onClick={() =>
                        handleViewReceiptImage(
                          selectedClaim.receipt_url,
                          `Bukti ${selectedClaim.claim_number}`
                        )
                      }
                      className="text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 text-[11px]"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      Perbesar Gambar
                    </button>
                  )}
                </div>

                {selectedClaim.receipt_url ? (
                  <div
                    onClick={() =>
                      handleViewReceiptImage(
                        selectedClaim.receipt_url,
                        `Bukti ${selectedClaim.claim_number}`
                      )
                    }
                    className="relative w-full h-44 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer group bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                  >
                    <img
                      src={selectedClaim.receipt_url}
                      alt="Receipt full preview"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium gap-1.5">
                      <ZoomIn className="w-5 h-5" />
                      <span>Klik untuk memperbesar</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 italic border border-slate-200">
                    Tidak ada lampiran foto struk
                  </div>
                )}
              </div>

              {/* If Rejected: Show Rejection Reason */}
              {selectedClaim.status === "REJECTED" && selectedClaim.rejection_reason && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Alasan Penolakan HR:</span>
                  </div>
                  <p className="text-xs pl-5">{selectedClaim.rejection_reason}</p>
                </div>
              )}

              {/* If Paid: Show Payment Info */}
              {selectedClaim.status === "PAID" && (
                <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 rounded-xl text-blue-800 dark:text-blue-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>Informasi Pencairan Dana:</span>
                  </div>
                  <div className="text-xs pl-5 space-y-0.5">
                    <div>Tanggal Transfer: {selectedClaim.payment_date || "-"}</div>
                    <div>No Referensi: {selectedClaim.payment_reference || "-"}</div>
                  </div>
                </div>
              )}

              {/* Action Buttons for HR */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="rounded-xl h-9 text-xs"
                >
                  Tutup
                </Button>

                <div className="flex items-center gap-2">
                  {selectedClaim.status === "PENDING" && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsDetailModalOpen(false);
                          handleOpenRejectModal(selectedClaim);
                        }}
                        className="rounded-xl text-xs h-9 text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Tolak Pengajuan
                      </Button>

                      <Button
                        onClick={() => handleApprove(selectedClaim)}
                        disabled={isPending}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs h-9 font-medium"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Setujui Pengajuan
                      </Button>
                    </>
                  )}

                  {selectedClaim.status === "APPROVED" && (
                    <Button
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        handleOpenPaidModal(selectedClaim);
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs h-9 font-medium"
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1" />
                      Tandai Sudah Ditransfer
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TOLAK REIMBURSEMENT (REJECT REASON) */}
      {/* ========================================================================= */}
      {isRejectModalOpen && rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5 text-rose-600">
              <div className="p-2 bg-rose-100 dark:bg-rose-950 rounded-xl">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Tolak Pengajuan Reimbursement
                </h3>
                <p className="text-xs text-slate-500">
                  Klaim {rejectTarget.claim_number} ({formatRupiah(rejectTarget.amount)})
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Alasan Penolakan (Wajib Diisi)</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Contoh: Kuota anggaran pelatihan bulan ini telah habis / Struk tidak jelas..."
                  rows={3}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Catatan Internal HR (Opsional)</Label>
                <Input
                  value={rejectInternalNotes}
                  onChange={(e) => setRejectInternalNotes(e.target.value)}
                  placeholder="Catatan tambahan untuk tim HR"
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => setIsRejectModalOpen(false)}
                className="rounded-xl text-xs h-9"
              >
                Batal
              </Button>
              <Button
                onClick={handleConfirmReject}
                disabled={isPending}
                className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs h-9 font-medium"
              >
                {isPending ? "Memproses..." : "Konfirmasi Tolak"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: TANDAI SUDAH DITRANSFER (MARK AS PAID) */}
      {/* ========================================================================= */}
      {isPaidModalOpen && paidTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5 text-blue-600">
              <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-xl">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Pencairan Dana Reimbursement
                </h3>
                <p className="text-xs text-slate-500">
                  Klaim {paidTarget.claim_number} ke {paidTarget.employee?.full_name}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nominal Transfer:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {formatRupiah(paidTarget.amount)}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label className="text-xs">Tanggal Transfer / Pembayaran</Label>
                <Input
                  type="date"
                  value={paymentDateInput}
                  onChange={(e) => setPaymentDateInput(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">No. Referensi Transfer Bank (Opsional)</Label>
                <Input
                  type="text"
                  value={paymentRefInput}
                  onChange={(e) => setPaymentRefInput(e.target.value)}
                  placeholder="Contoh: TRF-BCA-8910283"
                  className="h-10 text-xs font-mono rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => setIsPaidModalOpen(false)}
                className="rounded-xl text-xs h-9"
              >
                Batal
              </Button>
              <Button
                onClick={handleConfirmPaid}
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs h-9 font-medium"
              >
                {isPending ? "Memproses..." : "Konfirmasi Pembayaran"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: RECEIPT LIGHTBOX MODAL */}
      {/* ========================================================================= */}
      {isReceiptLightboxOpen && lightboxImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 p-2">
            <div className="p-3 text-white flex items-center justify-between border-b border-slate-800">
              <span className="font-semibold text-sm">{lightboxTitle}</span>
              <button
                onClick={() => setIsReceiptLightboxOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={lightboxImageUrl}
                alt="Receipt Full View"
                className="max-h-[70vh] w-auto object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: HAPUS REIMBURSEMENT */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && deletingClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Hapus Pengajuan Reimbursement?
              </h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus klaim{" "}
                <span className="font-mono font-semibold">{deletingClaim.claim_number}</span> senilai{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formatRupiah(deletingClaim.amount)}
                </span>
                ?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-xl text-xs h-9 flex-1"
              >
                Batal
              </Button>
              <Button
                onClick={handleDeleteClaim}
                disabled={isPending}
                className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs h-9 font-medium flex-1"
              >
                {isPending ? "Menghapus..." : "Ya, Hapus"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
