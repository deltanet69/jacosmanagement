"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Package,
  Laptop,
  Code2,
  FileText,
  Presentation,
  Layers,
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
  TrendingUp,
  ShoppingBag,
  Truck,
  Boxes,
  ShieldCheck,
  Flame,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ItemRequestRecord,
  EmployeeInfo,
  ItemRequestSummaryStats,
  ItemRequestType,
  ItemRequestUrgency,
  ItemRequestStatus,
  CreateItemRequestInput,
  createItemRequest,
  approveItemRequest,
  rejectItemRequest,
  startProcurement,
  completeProcurement,
  deleteItemRequest,
} from "@/app/management/hr/pengajuan/actions";
import { formatRupiah, angkaKeTerbilang } from "@/lib/utils/terbilang";

interface PengajuanListClientProps {
  initialRequests: ItemRequestRecord[];
  employees: EmployeeInfo[];
  initialStats: ItemRequestSummaryStats;
}

type MainTab = "requests" | "employees" | "inventory" | "analytics";

const TYPE_CONFIG: Record<
  ItemRequestType,
  { label: string; icon: any; badge: string; color: string }
> = {
  HARDWARE: {
    label: "Hardware",
    icon: Laptop,
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
    color: "text-blue-600 dark:text-blue-400",
  },
  SOFTWARE: {
    label: "Software & Lisensi",
    icon: Code2,
    badge: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300",
    color: "text-purple-600 dark:text-purple-400",
  },
  ATK: {
    label: "Alat Tulis Kantor",
    icon: FileText,
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
    color: "text-amber-600 dark:text-amber-400",
  },
  PERLENGKAPAN_KELAS: {
    label: "Perlengkapan Kelas",
    icon: Presentation,
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

const URGENCY_CONFIG: Record<
  ItemRequestUrgency,
  { label: string; badge: string; dot: string }
> = {
  SANGAT_TINGGI: {
    label: "Sangat Tinggi",
    badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800 font-bold",
    dot: "bg-rose-600 animate-pulse",
  },
  TINGGI: {
    label: "Tinggi",
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800 font-semibold",
    dot: "bg-amber-500",
  },
  SEDANG: {
    label: "Sedang",
    badge: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800",
    dot: "bg-sky-500",
  },
  RENDAH: {
    label: "Rendah",
    badge: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
    dot: "bg-slate-400",
  },
};

const STATUS_CONFIG: Record<
  ItemRequestStatus,
  { label: string; badge: string; icon: any; dot: string }
> = {
  PENDING: {
    label: "Menunggu Approval",
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800",
    icon: Clock,
    dot: "bg-amber-500",
  },
  APPROVED: {
    label: "Disetujui (Siap Beli)",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800",
    icon: CheckCircle2,
    dot: "bg-emerald-500",
  },
  PROCESSING: {
    label: "Sedang Diproses",
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800",
    icon: Truck,
    dot: "bg-blue-500",
  },
  COMPLETED: {
    label: "Selesai / Diterima",
    badge: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800",
    icon: Boxes,
    dot: "bg-purple-500",
  },
  REJECTED: {
    label: "Ditolak",
    badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800",
    icon: XCircle,
    dot: "bg-rose-500",
  },
};

export function PengajuanListClient({
  initialRequests,
  employees,
  initialStats,
}: PengajuanListClientProps) {
  // Main State
  const [requests, setRequests] = useState<ItemRequestRecord[]>(initialRequests);
  const [activeTab, setActiveTab] = useState<MainTab>("requests");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("ALL");
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
  const [selectedRequest, setSelectedRequest] = useState<ItemRequestRecord | null>(null);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<ItemRequestRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectInternalNotes, setRejectInternalNotes] = useState("");

  const [isProcurementModalOpen, setIsProcurementModalOpen] = useState(false);
  const [procurementTarget, setProcurementTarget] = useState<ItemRequestRecord | null>(null);
  const [poNumberInput, setPoNumberInput] = useState("");
  const [vendorNameInput, setVendorNameInput] = useState("");
  const [procurementNotesInput, setProcurementNotesInput] = useState("");

  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<ItemRequestRecord | null>(null);
  const [receivedDateInput, setReceivedDateInput] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [assetCodeInput, setAssetCodeInput] = useState("");
  const [itemConditionInput, setItemConditionInput] = useState("BAIK");
  const [completeNotesInput, setCompleteNotesInput] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingRequest, setDeletingRequest] = useState<ItemRequestRecord | null>(null);

  // Form State: New Item Request
  const [formData, setFormData] = useState<CreateItemRequestInput>({
    employee_id: employees[0]?.id || "",
    item_type: "HARDWARE",
    item_name: "",
    specification: "",
    quantity: 1,
    estimated_unit_price: 500000,
    reason: "",
    urgency: "SEDANG",
    catalog_url: "",
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

  // Live Calculation for form Total
  const formCalculations = useMemo(() => {
    const total = formData.quantity * formData.estimated_unit_price;
    return {
      total,
      terbilang: angkaKeTerbilang(total),
    };
  }, [formData.quantity, formData.estimated_unit_price]);

  // Filtered List
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (statusFilter !== "ALL" && req.status !== statusFilter) return false;
      if (typeFilter !== "ALL" && req.item_type !== typeFilter) return false;
      if (urgencyFilter !== "ALL" && req.urgency !== urgencyFilter) return false;

      if (roleFilter !== "ALL") {
        const emp = req.employee || employeeMap.get(req.employee_id);
        const empType = emp?.employee_type || "STAF";
        if (roleFilter === "GURU" && empType !== "GURU") return false;
        if (roleFilter === "STAF" && empType === "GURU") return false;
      }

      if (search.trim() !== "") {
        const q = search.toLowerCase();
        const emp = req.employee || employeeMap.get(req.employee_id);
        const nameMatch = emp?.full_name?.toLowerCase().includes(q);
        const nikMatch = emp?.nik?.toLowerCase().includes(q);
        const reqMatch = req.request_number?.toLowerCase().includes(q);
        const itemMatch = req.item_name?.toLowerCase().includes(q);
        const specMatch = req.specification?.toLowerCase().includes(q);
        if (!nameMatch && !nikMatch && !reqMatch && !itemMatch && !specMatch) return false;
      }

      return true;
    });
  }, [requests, statusFilter, typeFilter, urgencyFilter, roleFilter, search, employeeMap]);

  // Dynamic Statistics
  const dynamicStats = useMemo(() => {
    const totalRequests = filteredRequests.length;
    const totalEstimatedCost = filteredRequests.reduce(
      (acc, r) => acc + (r.estimated_total_price || 0),
      0
    );

    const pendingList = filteredRequests.filter((r) => r.status === "PENDING");
    const pendingCost = pendingList.reduce((acc, r) => acc + (r.estimated_total_price || 0), 0);

    const approvedList = filteredRequests.filter((r) => r.status === "APPROVED");
    const approvedCost = approvedList.reduce((acc, r) => acc + (r.estimated_total_price || 0), 0);

    const processingList = filteredRequests.filter((r) => r.status === "PROCESSING");
    const processingCost = processingList.reduce((acc, r) => acc + (r.estimated_total_price || 0), 0);

    const completedList = filteredRequests.filter((r) => r.status === "COMPLETED");
    const completedCost = completedList.reduce((acc, r) => acc + (r.estimated_total_price || 0), 0);

    return {
      totalRequests,
      totalEstimatedCost,
      pendingCount: pendingList.length,
      pendingCost,
      approvedCount: approvedList.length,
      approvedCost,
      processingCount: processingList.length,
      processingCost,
      completedCount: completedList.length,
      completedCost,
    };
  }, [filteredRequests]);

  // Completed items with assets for inventory tab
  const inventoryItems = useMemo(() => {
    return requests.filter((r) => r.status === "COMPLETED");
  }, [requests]);

  // Handlers
  const handleOpenCreateModal = () => {
    setFormData({
      employee_id: employees[0]?.id || "",
      item_type: "HARDWARE",
      item_name: "",
      specification: "",
      quantity: 1,
      estimated_unit_price: 250000,
      reason: "",
      urgency: "SEDANG",
      catalog_url: "",
      internal_notes: "",
    });
    setIsCreateModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item_name || formData.item_name.trim().length === 0) {
      showNotification("error", "Nama barang wajib diisi");
      return;
    }
    if (formData.quantity <= 0) {
      showNotification("error", "Jumlah unit harus lebih dari 0");
      return;
    }
    if (formData.estimated_unit_price <= 0) {
      showNotification("error", "Perkiraan harga harus lebih dari Rp 0");
      return;
    }
    if (!formData.reason || formData.reason.trim().length < 20) {
      showNotification("error", "Alasan pengajuan minimal 20 karakter untuk kelengkapan evaluasi HR");
      return;
    }

    startTransition(async () => {
      const res = await createItemRequest(formData);
      if (res.success) {
        showNotification("success", res.message);
        setIsCreateModalOpen(false);
        if (res.data) {
          const newRecord: ItemRequestRecord = {
            ...res.data,
            id: `req-${Date.now()}`,
            employee: employeeMap.get(res.data.employee_id) || null,
          };
          setRequests((prev) => [newRecord, ...prev]);
        }
      } else {
        showNotification("error", res.error);
      }
    });
  };

  const handleApprove = (req: ItemRequestRecord) => {
    startTransition(async () => {
      const res = await approveItemRequest({ id: req.id });
      if (res.success) {
        showNotification("success", res.message);
        setRequests((prev) =>
          prev.map((r) =>
            r.id === req.id
              ? {
                  ...r,
                  status: "APPROVED",
                  approved_by: "HR & Manajemen",
                  approved_at: new Date().toISOString(),
                }
              : r
          )
        );
        if (selectedRequest?.id === req.id) {
          setSelectedRequest((prev) => (prev ? { ...prev, status: "APPROVED" } : null));
        }
      } else {
        showNotification("error", res.error);
      }
    });
  };

  const handleOpenRejectModal = (req: ItemRequestRecord) => {
    setRejectTarget(req);
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
      const res = await rejectItemRequest({
        id: rejectTarget.id,
        rejection_reason: rejectionReason,
        internal_notes: rejectInternalNotes,
      });
      if (res.success) {
        showNotification("success", res.message);
        setIsRejectModalOpen(false);
        setRequests((prev) =>
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
        if (selectedRequest?.id === rejectTarget.id) {
          setSelectedRequest((prev) =>
            prev ? { ...prev, status: "REJECTED", rejection_reason: rejectionReason } : null
          );
        }
      } else {
        showNotification("error", res.error);
      }
    });
  };

  const handleOpenProcurementModal = (req: ItemRequestRecord) => {
    setProcurementTarget(req);
    setPoNumberInput(`PO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(10 + Math.random() * 90)}`);
    setVendorNameInput("Vendor Rekanan JACOS");
    setProcurementNotesInput("PO diterbitkan, barang dalam proses pengadaan/pembelian");
    setIsProcurementModalOpen(true);
  };

  const handleConfirmProcurement = () => {
    if (!procurementTarget) return;
    startTransition(async () => {
      const res = await startProcurement({
        id: procurementTarget.id,
        po_number: poNumberInput,
        vendor_name: vendorNameInput,
        procurement_notes: procurementNotesInput,
      });
      if (res.success) {
        showNotification("success", res.message);
        setIsProcurementModalOpen(false);
        setRequests((prev) =>
          prev.map((r) =>
            r.id === procurementTarget.id
              ? {
                  ...r,
                  status: "PROCESSING",
                  po_number: poNumberInput,
                  vendor_name: vendorNameInput,
                  procurement_notes: procurementNotesInput,
                }
              : r
          )
        );
        if (selectedRequest?.id === procurementTarget.id) {
          setSelectedRequest((prev) =>
            prev
              ? {
                  ...prev,
                  status: "PROCESSING",
                  po_number: poNumberInput,
                  vendor_name: vendorNameInput,
                  procurement_notes: procurementNotesInput,
                }
              : null
          );
        }
      } else {
        showNotification("error", res.error);
      }
    });
  };

  const handleOpenCompleteModal = (req: ItemRequestRecord) => {
    setCompleteTarget(req);
    setReceivedDateInput(new Date().toISOString().split("T")[0]);
    const prefix = req.item_type === "SOFTWARE" ? "SFT" : req.item_type === "HARDWARE" ? "HDW" : "AST";
    setAssetCodeInput(`AST-${prefix}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setItemConditionInput("BAIK");
    setCompleteNotesInput("Barang telah diterima dan diverifikasi dalam kondisi baik");
    setIsCompleteModalOpen(true);
  };

  const handleConfirmComplete = () => {
    if (!completeTarget) return;
    startTransition(async () => {
      const res = await completeProcurement({
        id: completeTarget.id,
        received_date: receivedDateInput,
        asset_code: assetCodeInput,
        item_condition: itemConditionInput,
        internal_notes: completeNotesInput,
      });
      if (res.success) {
        showNotification("success", res.message);
        setIsCompleteModalOpen(false);
        setRequests((prev) =>
          prev.map((r) =>
            r.id === completeTarget.id
              ? {
                  ...r,
                  status: "COMPLETED",
                  received_date: receivedDateInput,
                  asset_code: assetCodeInput,
                  item_condition: itemConditionInput,
                  internal_notes: completeNotesInput,
                }
              : r
          )
        );
        if (selectedRequest?.id === completeTarget.id) {
          setSelectedRequest((prev) =>
            prev
              ? {
                  ...prev,
                  status: "COMPLETED",
                  received_date: receivedDateInput,
                  asset_code: assetCodeInput,
                  item_condition: itemConditionInput,
                }
              : null
          );
        }
      } else {
        showNotification("error", res.error);
      }
    });
  };

  const handleDeleteRequest = () => {
    if (!deletingRequest) return;
    startTransition(async () => {
      const res = await deleteItemRequest(deletingRequest.id);
      if (res.success) {
        showNotification("success", res.message);
        setIsDeleteModalOpen(false);
        setRequests((prev) => prev.filter((r) => r.id !== deletingRequest.id));
        if (selectedRequest?.id === deletingRequest.id) {
          setIsDetailModalOpen(false);
        }
      } else {
        showNotification("error", res.error);
      }
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "No Pengajuan",
      "NIK",
      "Nama Pengaju",
      "Jabatan",
      "Jenis Kategori",
      "Nama Barang",
      "Jumlah",
      "Harga Satuan",
      "Total Estimasi",
      "Urgensi",
      "Status",
      "Alasan Pengajuan",
      "No PO",
      "Vendor",
      "Kode Aset",
    ];

    const rows = filteredRequests.map((r) => {
      const emp = r.employee || employeeMap.get(r.employee_id);
      return [
        `"${r.request_number}"`,
        `"${emp?.nik || ""}"`,
        `"${emp?.full_name || ""}"`,
        `"${emp?.position || ""}"`,
        `"${r.item_type}"`,
        `"${r.item_name.replace(/"/g, '""')}"`,
        r.quantity,
        r.estimated_unit_price,
        r.estimated_total_price,
        `"${r.urgency}"`,
        `"${r.status}"`,
        `"${r.reason.replace(/"/g, '""')}"`,
        `"${r.po_number || "-"}"`,
        `"${r.vendor_name || "-"}"`,
        `"${r.asset_code || "-"}"`,
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Pengajuan_Barang_JACOS_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("success", "Rekap pengajuan barang berhasil diexport ke CSV");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-sky-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold tracking-wide">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Administrasi & Pengadaan Sekolah</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Pengajuan Barang & Lisensi
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Manajemen permohonan kebutuhan sarana prasarana, perangkat hardware, lisensi software,
            ATK, dan perlengkapan kelas untuk seluruh guru & staf JACOS.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <Button
            onClick={handleOpenCreateModal}
            className="bg-sky-600 hover:bg-sky-500 text-white font-medium shadow-lg shadow-sky-900/30 rounded-xl px-4 py-2.5 h-auto text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Ajukan Barang / Lisensi</span>
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

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pengajuan */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-sky-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Pengajuan
            </span>
            <div className="p-2.5 bg-sky-50 dark:bg-sky-950/50 rounded-xl text-sky-600 dark:text-sky-400">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatRupiah(dynamicStats.totalEstimatedCost)}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {dynamicStats.totalRequests} Pengajuan
              </span>
              <span>• Total estimasi kebutuhan</span>
            </div>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-sky-600 h-full rounded-full w-full" />
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
              {formatRupiah(dynamicStats.pendingCost)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500 font-medium">
              <span>{dynamicStats.pendingCount} Permintaan Pending</span>
            </div>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${
                  dynamicStats.totalRequests > 0
                    ? (dynamicStats.pendingCount / dynamicStats.totalRequests) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Disetujui & Diproses Pengadaan */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Proses Pengadaan
            </span>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {formatRupiah(dynamicStats.approvedCost + dynamicStats.processingCost)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-500 font-medium">
              <span>
                {dynamicStats.approvedCount + dynamicStats.processingCount} Barang Sedang
                Dipesan/Beli
              </span>
            </div>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${
                  dynamicStats.totalRequests > 0
                    ? ((dynamicStats.approvedCount + dynamicStats.processingCount) /
                        dynamicStats.totalRequests) *
                      100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Selesai & Terdaftar Inventaris */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-purple-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Selesai & Diterima
            </span>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/50 rounded-xl text-purple-600 dark:text-purple-400">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
              {formatRupiah(dynamicStats.completedCost)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-500 font-medium">
              <span>{dynamicStats.completedCount} Unit Siap Pakai</span>
            </div>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${
                  dynamicStats.totalRequests > 0
                    ? (dynamicStats.completedCount / dynamicStats.totalRequests) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Tabs Navigation & Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Top Tab Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("requests")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === "requests"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Daftar Pengajuan ({filteredRequests.length})
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
              onClick={() => setActiveTab("inventory")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === "inventory"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Aset Inventaris Masuk ({inventoryItems.length})
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === "analytics"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Laporan & Anggaran
            </button>
          </div>

          {activeTab === "requests" && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-md text-xs transition-colors ${
                    viewMode === "table"
                      ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm"
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
                      ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Grid View"
                >
                  <Package className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari nama barang, pengaju, NIK, no request..."
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
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Menunggu Approval (Pending)</option>
              <option value="APPROVED">Disetujui (Approved)</option>
              <option value="PROCESSING">Sedang Diproses (PO / Beli)</option>
              <option value="COMPLETED">Selesai / Diterima (Completed)</option>
              <option value="REJECTED">Ditolak (Rejected)</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="ALL">Semua Jenis Barang</option>
              <option value="HARDWARE">Barang Hardware</option>
              <option value="SOFTWARE">Software & Lisensi</option>
              <option value="ATK">Alat Tulis Kantor (ATK)</option>
              <option value="PERLENGKAPAN_KELAS">Perlengkapan Kelas</option>
              <option value="LAINNYA">Lainnya</option>
            </select>
          </div>

          {/* Urgency Filter */}
          <div>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="ALL">Semua Tingkat Urgensi</option>
              <option value="SANGAT_TINGGI">Sangat Tinggi</option>
              <option value="TINGGI">Tinggi</option>
              <option value="SEDANG">Sedang</option>
              <option value="RENDAH">Rendah</option>
            </select>
          </div>
        </div>
      </div>

      {/* TAB 1: DAFTAR PENGAJUAN (REQUESTS) */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-sky-50 dark:bg-sky-950/40 text-sky-500 rounded-2xl flex items-center justify-center mx-auto">
                <Package className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  Tidak ada pengajuan barang yang sesuai filter
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Silakan sesuaikan filter pencarian atau ajukan kebutuhan barang/lisensi baru.
                </p>
              </div>
              <Button
                onClick={handleOpenCreateModal}
                className="bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Buat Pengajuan Baru
              </Button>
            </div>
          ) : viewMode === "table" ? (
            /* Table View */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Pengajuan & Pengaju</th>
                      <th className="py-3.5 px-4">Jenis Kategori</th>
                      <th className="py-3.5 px-4">Nama Barang & Spesifikasi</th>
                      <th className="py-3.5 px-4 text-center">Jumlah</th>
                      <th className="py-3.5 px-4 text-right">Estimasi Biaya</th>
                      <th className="py-3.5 px-4 text-center">Urgensi</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRequests.map((req) => {
                      const emp = req.employee || employeeMap.get(req.employee_id);
                      const typeInfo = TYPE_CONFIG[req.item_type] || TYPE_CONFIG.LAINNYA;
                      const TypeIcon = typeInfo.icon;
                      const urgencyInfo = URGENCY_CONFIG[req.urgency] || URGENCY_CONFIG.SEDANG;
                      const statusInfo = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;

                      return (
                        <tr
                          key={req.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* Employee Info */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
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
                                  <span>{req.request_number}</span>
                                  <span>•</span>
                                  <span>{emp?.position || "Staff"}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${typeInfo.badge}`}
                            >
                              <TypeIcon className="w-3.5 h-3.5" />
                              <span>{typeInfo.label}</span>
                            </span>
                          </td>

                          {/* Item & Specs */}
                          <td className="py-4 px-4 max-w-xs">
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{req.item_name}</span>
                              {req.catalog_url && (
                                <a
                                  href={req.catalog_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sky-600 hover:text-sky-700 inline-flex items-center"
                                  title="Buka Link Katalog"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {req.specification}
                            </div>
                          </td>

                          {/* Quantity */}
                          <td className="py-4 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                            {req.quantity} Unit
                          </td>

                          {/* Price */}
                          <td className="py-4 px-4 text-right">
                            <div className="font-bold font-mono text-sm text-slate-900 dark:text-white">
                              {formatRupiah(req.estimated_total_price)}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              @{formatRupiah(req.estimated_unit_price)}
                            </div>
                          </td>

                          {/* Urgency */}
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] border ${urgencyInfo.badge}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${urgencyInfo.dot}`} />
                              <span>{urgencyInfo.label}</span>
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
                                  setSelectedRequest(req);
                                  setIsDetailModalOpen(true);
                                }}
                                className="h-8 px-2.5 bg-slate-50 hover:bg-sky-50 hover:text-sky-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 text-xs rounded-lg flex items-center gap-1"
                                title="Lihat Detail & Approval"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Detail</span>
                              </Button>

                              {/* Quick Approve (If Pending) */}
                              {req.status === "PENDING" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(req)}
                                  className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs flex items-center gap-1"
                                  title="Setujui Pengajuan"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span className="hidden xl:inline">Setujui</span>
                                </Button>
                              )}

                              {/* Start Procurement (If Approved) */}
                              {req.status === "APPROVED" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenProcurementModal(req)}
                                  className="h-8 px-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs flex items-center gap-1"
                                  title="Mulai Proses Pengadaan PO"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span className="hidden xl:inline">Proses</span>
                                </Button>
                              )}

                              {/* Complete Handover (If Processing) */}
                              {req.status === "PROCESSING" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenCompleteModal(req)}
                                  className="h-8 px-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs flex items-center gap-1"
                                  title="Selesai & Serah Terima"
                                >
                                  <Boxes className="w-3.5 h-3.5" />
                                  <span className="hidden xl:inline">Selesai</span>
                                </Button>
                              )}

                              {/* Reject Button (If Pending) */}
                              {req.status === "PENDING" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenRejectModal(req)}
                                  className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 border-slate-200 dark:border-slate-700 rounded-lg"
                                  title="Tolak Pengajuan"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              )}

                              {/* Delete Request */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setDeletingRequest(req);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-slate-200 dark:border-slate-700 rounded-lg"
                                title="Hapus Pengajuan"
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
              {filteredRequests.map((req) => {
                const emp = req.employee || employeeMap.get(req.employee_id);
                const typeInfo = TYPE_CONFIG[req.item_type] || TYPE_CONFIG.LAINNYA;
                const TypeIcon = typeInfo.icon;
                const urgencyInfo = URGENCY_CONFIG[req.urgency] || URGENCY_CONFIG.SEDANG;
                const statusInfo = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;

                return (
                  <div
                    key={req.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                            {emp?.full_name ? emp.full_name.charAt(0) : "K"}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1 text-sm">
                              {emp?.full_name || "Karyawan"}
                            </h4>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 font-mono">
                              <span>{req.request_number}</span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusInfo.badge}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* Type & Urgency */}
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${typeInfo.badge}`}
                        >
                          <TypeIcon className="w-3 h-3" />
                          <span>{typeInfo.label}</span>
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] border ${urgencyInfo.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${urgencyInfo.dot}`} />
                          <span>{urgencyInfo.label}</span>
                        </span>
                      </div>

                      {/* Item Name & Specs */}
                      <div className="mt-3 space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {req.item_name}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                          {req.specification}
                        </p>
                      </div>

                      {/* Reason */}
                      <div className="mt-3 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Alasan:{" "}
                        </span>
                        {req.reason}
                      </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-semibold">{req.quantity} Unit</span>
                        <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                          {formatRupiah(req.estimated_total_price)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => {
                            setSelectedRequest(req);
                            setIsDetailModalOpen(true);
                          }}
                          className="flex-1 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs h-9"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          Detail
                        </Button>

                        {req.status === "PENDING" && (
                          <Button
                            onClick={() => handleApprove(req)}
                            className="h-9 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs"
                            title="Setujui"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {req.status === "APPROVED" && (
                          <Button
                            onClick={() => handleOpenProcurementModal(req)}
                            className="h-9 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs"
                            title="Proses PO"
                          >
                            <Truck className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {req.status === "PROCESSING" && (
                          <Button
                            onClick={() => handleOpenCompleteModal(req)}
                            className="h-9 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs"
                            title="Selesai"
                          >
                            <Boxes className="w-3.5 h-3.5" />
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
              const empRequests = requests.filter((r) => r.employee_id === emp.id);
              const totalCost = empRequests.reduce((acc, r) => acc + (r.estimated_total_price || 0), 0);
              const completedCount = empRequests.filter((r) => r.status === "COMPLETED").length;
              const pendingCount = empRequests.filter((r) => r.status === "PENDING").length;

              return (
                <div
                  key={emp.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
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
                      <span>Total Permintaan Barang:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {empRequests.length} Pengajuan ({formatRupiah(totalCost)})
                      </span>
                    </div>
                    <div className="flex justify-between text-purple-600 dark:text-purple-400">
                      <span>Sudah Diterima (Selesai):</span>
                      <span className="font-bold">{completedCount} Unit</span>
                    </div>
                    {pendingCount > 0 && (
                      <div className="flex justify-between text-amber-600 dark:text-amber-400">
                        <span>Menunggu Approval:</span>
                        <span className="font-bold">{pendingCount} Pengajuan</span>
                      </div>
                    )}
                  </div>

                  {empRequests.length > 0 ? (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase">
                        Permintaan Terakhir:
                      </div>
                      {empRequests.slice(0, 2).map((r) => (
                        <div
                          key={r.id}
                          onClick={() => {
                            setSelectedRequest(r);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-2 bg-slate-50/70 dark:bg-slate-800/30 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs cursor-pointer transition-colors"
                        >
                          <div className="truncate mr-2">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {r.item_name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {r.quantity} Unit • {r.item_type}
                            </div>
                          </div>
                          <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                            {formatRupiah(r.estimated_total_price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic text-center py-2">
                      Belum ada riwayat pengajuan barang
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ASET INVENTARIS MASUK (INVENTORY INTEGRATION) */}
      {activeTab === "inventory" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-purple-600" />
                <span>Registrasi Aset Inventaris Barang Selesai</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Daftar pengadaan barang yang telah diterima dan diberikan kode unik inventaris sekolah.
              </p>
            </div>

            <Button
              onClick={handleExportCSV}
              className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs h-9 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Rekap Inventaris
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase">
                  <th className="py-3 px-4">Kode Aset</th>
                  <th className="py-3 px-4">Nama Barang & Jenis</th>
                  <th className="py-3 px-4">Penerima (Karyawan)</th>
                  <th className="py-3 px-4 text-center">Jumlah</th>
                  <th className="py-3 px-4 text-right">Nilai Aset</th>
                  <th className="py-3 px-4 text-center">Tanggal Diterima</th>
                  <th className="py-3 px-4 text-center">Kondisi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {inventoryItems.map((item) => {
                  const emp = item.employee || employeeMap.get(item.employee_id);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                        {item.asset_code || `AST-${item.id.slice(0, 6)}`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {item.item_name}
                        </div>
                        <div className="text-[10px] text-slate-400">{item.item_type}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {emp?.full_name} ({emp?.position})
                      </td>
                      <td className="py-3 px-4 text-center font-bold">{item.quantity} Unit</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatRupiah(item.estimated_total_price)}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">
                        {item.received_date || "-"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
                          {item.item_condition || "BAIK"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: LAPORAN & ANGGARAN */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Breakdown */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-sky-600" />
                    <span>Distribusi Pengajuan per Jenis Barang</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Estimasi total alokasi biaya pengadaan berdasarkan kelompok barang.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {initialStats.typeBreakdown.map((t) => {
                  const typeInfo = TYPE_CONFIG[t.type] || TYPE_CONFIG.LAINNYA;
                  const TypeIcon = typeInfo.icon;

                  return (
                    <div key={t.type} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                          <TypeIcon className={`w-4 h-4 ${typeInfo.color}`} />
                          <span>{t.label}</span>
                          <span className="text-slate-400 font-normal">({t.count} Pengajuan)</span>
                        </div>
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatRupiah(t.totalCost)}{" "}
                          <span className="text-xs text-slate-500 font-normal">
                            ({t.percentage}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${t.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Urgency & Summary */}
            <div className="bg-gradient-to-br from-slate-900 to-sky-950 text-white rounded-2xl p-6 border border-sky-500/20 shadow-xl flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="p-2.5 bg-sky-500/20 text-sky-300 w-fit rounded-xl border border-sky-400/30">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold">Ringkasan Anggaran Pengadaan</h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Total Estimasi Pengajuan:</span>
                    <span className="font-mono font-bold text-white">
                      {formatRupiah(initialStats.totalEstimatedCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Anggaran Disetujui:</span>
                    <span className="font-mono font-bold">
                      {formatRupiah(initialStats.approvedCost + initialStats.processingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-purple-400">
                    <span>Aset Selesai Dibeli:</span>
                    <span className="font-mono font-bold">
                      {formatRupiah(initialStats.completedCost)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <div className="text-xs font-semibold text-slate-300 uppercase">
                    Distribusi Urgensi:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {initialStats.urgencyBreakdown.map((u) => (
                      <div
                        key={u.urgency}
                        className="p-2 bg-slate-800/60 rounded-lg border border-slate-700 text-xs flex justify-between items-center"
                      >
                        <span className="text-slate-400">{u.label}:</span>
                        <span className="font-bold font-mono text-white">{u.count} Unit</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleExportCSV}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs h-10 flex items-center justify-center gap-2 font-semibold shadow-lg shadow-sky-950/50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Laporan Excel / CSV</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: FORM PENGAJUAN BARANG / LISENSI BARU */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 my-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 rounded-xl">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Pengajuan Barang & Lisensi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Formulir kebutuhan peralatan kerja, software, dan perlengkapan kelas
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
              {/* Employee & Item Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Karyawan Pengaju</Label>
                  <select
                    value={formData.employee_id}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, employee_id: e.target.value }))
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-sky-500"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.nik})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Jenis Pengajuan</Label>
                  <select
                    value={formData.item_type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        item_type: e.target.value as ItemRequestType,
                      }))
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="HARDWARE">Barang Hardware (Laptop, Printer, Mouse, dll)</option>
                    <option value="SOFTWARE">Software & Lisensi (Office 365, Adobe, dll)</option>
                    <option value="ATK">Alat Tulis Kantor (ATK)</option>
                    <option value="PERLENGKAPAN_KELAS">Perlengkapan Kelas (Proyektor, dll)</option>
                    <option value="LAINNYA">Keperluan Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Item Name */}
              <div className="space-y-1">
                <Label className="text-xs">Nama Spesifik Barang (Wajib)</Label>
                <Input
                  value={formData.item_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, item_name: e.target.value }))}
                  placeholder="Contoh: Logitech Silent Wireless Mouse / Proyektor Epson XGA"
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>

              {/* Specification */}
              <div className="space-y-1">
                <Label className="text-xs">Spesifikasi Detail (Ukuran, Tipe, Kapasitas, dll)</Label>
                <Textarea
                  value={formData.specification}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, specification: e.target.value }))
                  }
                  placeholder="Jelaskan spesifikasi teknis atau rincian item..."
                  rows={2}
                  className="rounded-xl text-xs"
                />
              </div>

              {/* Quantity, Unit Price, Urgency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Jumlah Unit</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, quantity: Number(e.target.value) }))
                    }
                    className="h-10 text-xs font-mono rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Perkiraan Harga Satuan</Label>
                  <Input
                    type="number"
                    value={formData.estimated_unit_price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        estimated_unit_price: Number(e.target.value),
                      }))
                    }
                    className="h-10 text-xs font-mono rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Tingkat Urgensi</Label>
                  <select
                    value={formData.urgency}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        urgency: e.target.value as ItemRequestUrgency,
                      }))
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-sky-500 font-medium"
                  >
                    <option value="RENDAH">Rendah (Fleksibel)</option>
                    <option value="SEDANG">Sedang (Standar)</option>
                    <option value="TINGGI">Tinggi (Mendesak)</option>
                    <option value="SANGAT_TINGGI">Sangat Tinggi (Kritis)</option>
                  </select>
                </div>
              </div>

              {/* Total Calculation Highlight */}
              <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-sky-900 dark:text-sky-200 uppercase">
                    Total Estimasi Biaya ({formData.quantity} Unit)
                  </div>
                  <div className="text-[10px] text-sky-700 dark:text-sky-400 italic">
                    {formCalculations.terbilang}
                  </div>
                </div>
                <div className="font-bold font-mono text-sky-700 dark:text-sky-300 text-base">
                  {formatRupiah(formCalculations.total)}
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <Label className="text-xs">Alasan Pengajuan & Manfaat Kerja (Wajib min 20 karakter)</Label>
                <Textarea
                  value={formData.reason}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Jelaskan alasan mengapa barang/lisensi ini diperlukan untuk kelancaran tugas..."
                  rows={2}
                  className="rounded-xl text-xs"
                />
              </div>

              {/* Catalog Link */}
              <div className="space-y-1">
                <Label className="text-xs">Link Katalog / Referensi Produk (Opsional)</Label>
                <Input
                  type="url"
                  value={formData.catalog_url || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, catalog_url: e.target.value }))}
                  placeholder="https://tokopedia.com/... atau https://microsoft.com/..."
                  className="h-9 text-xs rounded-xl"
                />
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
                  className="bg-sky-600 hover:bg-sky-500 text-white rounded-xl h-9 text-xs font-medium"
                >
                  {isPending ? "Mengirim..." : "Kirim Pengajuan Barang"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DETAIL PENGAJUAN & APPROVAL HR */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-500/20 text-sky-300 rounded-xl border border-sky-500/30">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Detail Pengajuan Barang</h3>
                  <p className="text-xs text-slate-300 font-mono">
                    {selectedRequest.request_number}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    STATUS_CONFIG[selectedRequest.status]?.badge
                  }`}
                >
                  {STATUS_CONFIG[selectedRequest.status]?.label}
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
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-28 text-slate-500">Nama Pengaju</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      : {selectedRequest.employee?.full_name}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">Nomor Induk</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      : {selectedRequest.employee?.nik}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">Jabatan & Peran</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      : {selectedRequest.employee?.position} ({selectedRequest.employee?.employee_type})
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-28 text-slate-500">Jenis Kategori</span>
                    <span className="font-semibold text-sky-600 dark:text-sky-400">
                      : {TYPE_CONFIG[selectedRequest.item_type]?.label || selectedRequest.item_type}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">Tingkat Urgensi</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      : {URGENCY_CONFIG[selectedRequest.urgency]?.label}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">Tanggal Ajuan</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      : {selectedRequest.created_at.split("T")[0]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Item Specs Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedRequest.item_name}
                </div>
                <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Spesifikasi:{" "}
                  </span>
                  {selectedRequest.specification}
                </div>
                {selectedRequest.catalog_url && (
                  <div className="pt-1">
                    <a
                      href={selectedRequest.catalog_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Tautan Katalog / Toko Online</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Pricing & Estimation Highlight */}
              <div className="p-4 bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/40 border-2 border-sky-500 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-sky-900 dark:text-sky-200 uppercase tracking-wider">
                    Total Estimasi ({selectedRequest.quantity} Unit)
                  </div>
                  <div className="text-xs font-medium text-sky-700 dark:text-sky-400 italic mt-0.5">
                    Terbilang: &ldquo;{angkaKeTerbilang(selectedRequest.estimated_total_price)}&rdquo;
                  </div>
                </div>
                <div className="text-2xl font-extrabold font-mono text-sky-700 dark:text-sky-300">
                  {formatRupiah(selectedRequest.estimated_total_price)}
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Alasan & Kebutuhan Pengajuan:
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedRequest.reason}
                </div>
              </div>

              {/* Procurement & Handover Details if available */}
              {selectedRequest.po_number && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-1 text-blue-900 dark:text-blue-200">
                  <div className="font-bold flex items-center gap-1.5">
                    <Truck className="w-4 h-4" />
                    <span>Informasi Pengadaan & PO:</span>
                  </div>
                  <div className="text-xs pl-5 space-y-0.5">
                    <div>No. PO: {selectedRequest.po_number}</div>
                    <div>Vendor: {selectedRequest.vendor_name || "-"}</div>
                    <div>Catatan: {selectedRequest.procurement_notes || "-"}</div>
                  </div>
                </div>
              )}

              {selectedRequest.asset_code && (
                <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl space-y-1 text-purple-900 dark:text-purple-200">
                  <div className="font-bold flex items-center gap-1.5">
                    <Boxes className="w-4 h-4" />
                    <span>Aset Terdaftar di Inventaris:</span>
                  </div>
                  <div className="text-xs pl-5 space-y-0.5">
                    <div>Kode Aset: {selectedRequest.asset_code}</div>
                    <div>Tanggal Diterima: {selectedRequest.received_date || "-"}</div>
                    <div>Kondisi: {selectedRequest.item_condition || "BAIK"}</div>
                  </div>
                </div>
              )}

              {/* If Rejected */}
              {selectedRequest.status === "REJECTED" && selectedRequest.rejection_reason && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl space-y-1 text-rose-900 dark:text-rose-200">
                  <div className="font-bold flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" />
                    <span>Alasan Penolakan:</span>
                  </div>
                  <p className="text-xs pl-5">{selectedRequest.rejection_reason}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="rounded-xl h-9 text-xs"
                >
                  Tutup
                </Button>

                <div className="flex items-center gap-2">
                  {selectedRequest.status === "PENDING" && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsDetailModalOpen(false);
                          handleOpenRejectModal(selectedRequest);
                        }}
                        className="rounded-xl text-xs h-9 text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Tolak Pengajuan
                      </Button>

                      <Button
                        onClick={() => handleApprove(selectedRequest)}
                        disabled={isPending}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs h-9 font-medium"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Setujui Pengajuan
                      </Button>
                    </>
                  )}

                  {selectedRequest.status === "APPROVED" && (
                    <Button
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        handleOpenProcurementModal(selectedRequest);
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs h-9 font-medium"
                    >
                      <Truck className="w-3.5 h-3.5 mr-1" />
                      Mulai Proses Pengadaan PO
                    </Button>
                  )}

                  {selectedRequest.status === "PROCESSING" && (
                    <Button
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        handleOpenCompleteModal(selectedRequest);
                      }}
                      className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs h-9 font-medium"
                    >
                      <Boxes className="w-3.5 h-3.5 mr-1" />
                      Selesai & Serah Terima Aset
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TOLAK PENGAJUAN (REJECT MODAL) */}
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
                  Tolak Pengajuan Barang
                </h3>
                <p className="text-xs text-slate-500">
                  {rejectTarget.item_name} ({formatRupiah(rejectTarget.estimated_total_price)})
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Alasan Penolakan (Wajib Diisi)</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Contoh: Anggaran Q3 telah habis / Disarankan menggunakan inventaris yang ada..."
                  rows={3}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Catatan Internal HR (Opsional)</Label>
                <Input
                  value={rejectInternalNotes}
                  onChange={(e) => setRejectInternalNotes(e.target.value)}
                  placeholder="Catatan tambahan untuk evaluasi internal"
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
      {/* MODAL 4: PROSES PENGADAAN (START PROCUREMENT) */}
      {/* ========================================================================= */}
      {isProcurementModalOpen && procurementTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5 text-blue-600">
              <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-xl">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Mulai Pengadaan Barang (PO)
                </h3>
                <p className="text-xs text-slate-500">
                  {procurementTarget.item_name} ({procurementTarget.quantity} Unit)
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nomor Purchase Order (PO)</Label>
                <Input
                  value={poNumberInput}
                  onChange={(e) => setPoNumberInput(e.target.value)}
                  placeholder="PO-202609-001"
                  className="h-10 text-xs font-mono rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Nama Vendor / Toko Rekanan</Label>
                <Input
                  value={vendorNameInput}
                  onChange={(e) => setVendorNameInput(e.target.value)}
                  placeholder="Contoh: PT Mitra Solusi / Enterkomputer"
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Catatan Proses Pengadaan</Label>
                <Textarea
                  value={procurementNotesInput}
                  onChange={(e) => setProcurementNotesInput(e.target.value)}
                  placeholder="Estimasi tiba 2-3 hari kerja..."
                  rows={2}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => setIsProcurementModalOpen(false)}
                className="rounded-xl text-xs h-9"
              >
                Batal
              </Button>
              <Button
                onClick={handleConfirmProcurement}
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs h-9 font-medium"
              >
                {isPending ? "Memproses..." : "Terbitkan PO & Mulai Beli"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: SERAH TERIMA & SELESAI (COMPLETE MODAL) */}
      {/* ========================================================================= */}
      {isCompleteModalOpen && completeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5 text-purple-600">
              <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-xl">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Serah Terima & Registrasi Aset
                </h3>
                <p className="text-xs text-slate-500">
                  {completeTarget.item_name} ke {completeTarget.employee?.full_name}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Kode Aset Inventaris Sekolah</Label>
                <Input
                  value={assetCodeInput}
                  onChange={(e) => setAssetCodeInput(e.target.value)}
                  placeholder="AST-HDW-2026-001"
                  className="h-10 text-xs font-mono rounded-xl font-bold text-purple-700 dark:text-purple-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tanggal Diterima</Label>
                  <Input
                    type="date"
                    value={receivedDateInput}
                    onChange={(e) => setReceivedDateInput(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Kondisi Barang</Label>
                  <select
                    value={itemConditionInput}
                    onChange={(e) => setItemConditionInput(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="BAIK">BAIK (Baru & Normal)</option>
                    <option value="PERLU_PERBAIKAN">Perlu Setting/Perbaikan</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Catatan Serah Terima</Label>
                <Input
                  value={completeNotesInput}
                  onChange={(e) => setCompleteNotesInput(e.target.value)}
                  placeholder="Barang telah diuji coba dan diserahterimakan..."
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => setIsCompleteModalOpen(false)}
                className="rounded-xl text-xs h-9"
              >
                Batal
              </Button>
              <Button
                onClick={handleConfirmComplete}
                disabled={isPending}
                className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs h-9 font-medium"
              >
                {isPending ? "Memproses..." : "Selesai & Daftarkan Aset"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: HAPUS PENGAJUAN */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && deletingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Hapus Pengajuan Barang?
              </h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus pengajuan{" "}
                <span className="font-mono font-semibold">{deletingRequest.request_number}</span> (
                {deletingRequest.item_name})?
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
                onClick={handleDeleteRequest}
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
