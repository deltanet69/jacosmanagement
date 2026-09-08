"use client";

import { useState, useTransition, useMemo, useRef } from "react";
import {
  Banknote,
  Wallet,
  Receipt,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Plus,
  Filter,
  Download,
  Printer,
  Send,
  Eye,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  GraduationCap,
  Building,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Check,
  SlidersHorizontal,
  Calculator,
  DollarSign,
  CreditCard,
  ShieldCheck,
  Mail,
  MessageSquare,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Share2,
  Info,
  Layers,
  CheckCheck,
  TrendingUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PayslipRecord,
  SalaryComponentRecord,
  EmployeeInfo,
  PayslipSummaryStats,
  PayslipStatus,
  SaveSalaryComponentInput,
  SavePayslipInput,
  BatchGenerateInput,
  saveSalaryComponent,
  savePayslip,
  updatePayslipStatus,
  batchGeneratePayslips,
  deletePayslip,
  sendPayslipDocument,
} from "@/app/management/hr/payslip/actions";
import { formatRupiah, angkaKeTerbilang } from "@/lib/utils/terbilang";

interface PayslipListClientProps {
  initialPayslips: PayslipRecord[];
  initialSalaryComponents: SalaryComponentRecord[];
  employees: EmployeeInfo[];
  initialStats: PayslipSummaryStats;
  currentMonth: number;
  currentYear: number;
}

type MainTab = "payslips" | "components" | "history";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const STATUS_CONFIG: Record<
  PayslipStatus,
  { label: string; badge: string; icon: any; dot: string }
> = {
  DRAFT: {
    label: "Draft",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    icon: Clock,
    dot: "bg-slate-400",
  },
  PENDING: {
    label: "Menunggu Approval",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
    dot: "bg-amber-500",
  },
  PROCESSING: {
    label: "Dalam Proses",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    icon: RefreshCw,
    dot: "bg-blue-500",
  },
  PAID: {
    label: "Sudah Ditransfer",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
    dot: "bg-emerald-500",
  },
};

export function PayslipListClient({
  initialPayslips,
  initialSalaryComponents,
  employees,
  initialStats,
  currentMonth,
  currentYear,
}: PayslipListClientProps) {
  // Main Data States
  const [payslips, setPayslips] = useState<PayslipRecord[]>(initialPayslips);
  const [salaryComponents, setSalaryComponents] = useState<SalaryComponentRecord[]>(
    initialSalaryComponents
  );
  const [activeTab, setActiveTab] = useState<MainTab>("payslips");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Filter States
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // UI Transitions & Notifications
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modal States
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipRecord | null>(null);

  const [isSingleFormModalOpen, setIsSingleFormModalOpen] = useState(false);
  const [editingPayslip, setEditingPayslip] = useState<PayslipRecord | null>(null);

  const [isComponentModalOpen, setIsComponentModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<SalaryComponentRecord | null>(null);

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<PayslipRecord | null>(null);
  const [newStatus, setNewStatus] = useState<PayslipStatus>("PAID");
  const [paymentDateInput, setPaymentDateInput] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendTarget, setSendTarget] = useState<PayslipRecord | null>(null);
  const [sendChannel, setSendChannel] = useState<"EMAIL" | "WHATSAPP">("EMAIL");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPayslip, setDeletingPayslip] = useState<PayslipRecord | null>(null);

  // Form State: Single Payslip
  const [payslipFormData, setPayslipFormData] = useState<SavePayslipInput>({
    employee_id: employees[0]?.id || "",
    period_month: currentMonth,
    period_year: currentYear,
    status: "DRAFT",
    base_salary: 5000000,
    allowance_position: 1000000,
    allowance_certification: 500000,
    allowance_tenure: 200000,
    allowance_transport: 300000,
    bonus_kpi: 500000,
    kpi_score: 85,
    allowance_overtime: 300000,
    overtime_hours: 10,
    allowance_other: 0,
    deduction_bpjs_kes: 50000,
    deduction_bpjs_tk: 100000,
    deduction_pph21: 180000,
    deduction_attendance: 0,
    deduction_other: 50000,
    bank_name: "BCA",
    bank_account_number: "8820194821",
    bank_account_holder: "",
    payment_method: "TRANSFER",
    notes: "",
  });

  // Form State: Salary Component
  const [compFormData, setCompFormData] = useState<SaveSalaryComponentInput>({
    employee_id: employees[0]?.id || "",
    base_salary: 5000000,
    allowance_position: 1000000,
    allowance_certification: 500000,
    allowance_tenure: 200000,
    allowance_transport: 300000,
    allowance_other: 0,
    bpjs_kes_rate: 1.0,
    bpjs_tk_rate: 2.0,
    pph21_rate: 2.5,
    bank_name: "BCA",
    bank_account_number: "",
    bank_account_holder: "",
    notes: "",
  });

  // Form State: Batch Generate
  const [batchFormData, setBatchFormData] = useState<BatchGenerateInput>({
    period_month: currentMonth,
    period_year: currentYear,
    payment_date: new Date().toISOString().split("T")[0],
    target_type: "ALL",
    auto_calculate_kpi: true,
    auto_calculate_overtime: true,
    notes: `Batch Payroll ${MONTH_NAMES[currentMonth - 1]} ${currentYear}`,
  });

  const printAreaRef = useRef<HTMLDivElement>(null);

  const showNotification = (type: "success" | "error", message?: string | null) => {
    if (!message) return;
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Helper Map
  const employeeMap = useMemo(() => {
    const map = new Map<string, EmployeeInfo>();
    employees.forEach((emp) => map.set(emp.id, emp));
    return map;
  }, [employees]);

  // Filtered Payslips
  const filteredPayslips = useMemo(() => {
    return payslips.filter((p) => {
      // Month & Year Filter
      if (selectedMonth !== 0 && p.period_month !== selectedMonth) return false;
      if (selectedYear !== 0 && p.period_year !== selectedYear) return false;

      // Status Filter
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;

      // Role Filter
      if (roleFilter !== "ALL") {
        const emp = p.employee || employeeMap.get(p.employee_id);
        const empType = emp?.employee_type || "STAF";
        if (roleFilter === "GURU" && empType !== "GURU") return false;
        if (roleFilter === "STAF" && empType === "GURU") return false;
      }

      // Search Query
      if (search.trim() !== "") {
        const q = search.toLowerCase();
        const emp = p.employee || employeeMap.get(p.employee_id);
        const nameMatch = emp?.full_name?.toLowerCase().includes(q);
        const nikMatch = emp?.nik?.toLowerCase().includes(q);
        const slipMatch = p.payslip_number?.toLowerCase().includes(q);
        const posMatch = emp?.position?.toLowerCase().includes(q);
        if (!nameMatch && !nikMatch && !slipMatch && !posMatch) return false;
      }

      return true;
    });
  }, [payslips, selectedMonth, selectedYear, statusFilter, roleFilter, search, employeeMap]);

  // Dynamic Statistics
  const dynamicStats = useMemo(() => {
    const totalPayroll = filteredPayslips.reduce((acc, p) => acc + (p.net_salary || 0), 0);
    const paidSlips = filteredPayslips.filter((p) => p.status === "PAID");
    const totalPaid = paidSlips.reduce((acc, p) => acc + (p.net_salary || 0), 0);
    const pendingSlips = filteredPayslips.filter((p) => p.status !== "PAID");
    const totalPending = pendingSlips.reduce((acc, p) => acc + (p.net_salary || 0), 0);

    return {
      totalPayroll,
      totalPaid,
      totalPending,
      totalCount: filteredPayslips.length,
      paidCount: paidSlips.length,
      pendingCount: pendingSlips.length,
      averageNet: filteredPayslips.length > 0 ? totalPayroll / filteredPayslips.length : 0,
    };
  }, [filteredPayslips]);

  // Live Calculation for Single Payslip Form
  const formCalculations = useMemo(() => {
    const totalIncome =
      Number(payslipFormData.base_salary || 0) +
      Number(payslipFormData.allowance_position || 0) +
      Number(payslipFormData.allowance_certification || 0) +
      Number(payslipFormData.allowance_tenure || 0) +
      Number(payslipFormData.allowance_transport || 0) +
      Number(payslipFormData.bonus_kpi || 0) +
      Number(payslipFormData.allowance_overtime || 0) +
      Number(payslipFormData.allowance_other || 0);

    const totalDeductions =
      Number(payslipFormData.deduction_bpjs_kes || 0) +
      Number(payslipFormData.deduction_bpjs_tk || 0) +
      Number(payslipFormData.deduction_pph21 || 0) +
      Number(payslipFormData.deduction_attendance || 0) +
      Number(payslipFormData.deduction_other || 0);

    const netSalary = Math.max(0, totalIncome - totalDeductions);

    return {
      totalIncome,
      totalDeductions,
      netSalary,
      terbilang: angkaKeTerbilang(netSalary),
    };
  }, [payslipFormData]);

  // Live Calculation for Component Form
  const compCalculations = useMemo(() => {
    const base = Number(compFormData.base_salary || 0);
    const totalFixedAllowance =
      Number(compFormData.allowance_position || 0) +
      Number(compFormData.allowance_certification || 0) +
      Number(compFormData.allowance_tenure || 0) +
      Number(compFormData.allowance_transport || 0) +
      Number(compFormData.allowance_other || 0);

    const estBpjsKes = Math.round((base * (compFormData.bpjs_kes_rate || 1.0)) / 100);
    const estBpjsTk = Math.round((base * (compFormData.bpjs_tk_rate || 2.0)) / 100);
    const estPph = Math.round((base * (compFormData.pph21_rate || 2.0)) / 100);
    const totalEstDeductions = estBpjsKes + estBpjsTk + estPph;
    const estTakeHome = Math.max(0, base + totalFixedAllowance - totalEstDeductions);

    return {
      base,
      totalFixedAllowance,
      estBpjsKes,
      estBpjsTk,
      estPph,
      totalEstDeductions,
      estTakeHome,
      terbilang: angkaKeTerbilang(estTakeHome),
    };
  }, [compFormData]);

  // Handlers
  const handleOpenCreateSingle = () => {
    const firstEmp = employees[0];
    const empComp = salaryComponents.find((c) => c.employee_id === firstEmp?.id);

    const base_salary = empComp ? empComp.base_salary : 5000000;
    const allowance_position = empComp ? empComp.allowance_position : 1000000;
    const allowance_certification = empComp ? empComp.allowance_certification : 500000;
    const allowance_tenure = empComp ? empComp.allowance_tenure : 200000;
    const allowance_transport = empComp ? empComp.allowance_transport : 300000;

    const bpjs_kes = Math.round((base_salary * 1.0) / 100);
    const bpjs_tk = Math.round((base_salary * 2.0) / 100);
    const pph21 = Math.round((base_salary * 2.5) / 100);

    setEditingPayslip(null);
    setPayslipFormData({
      employee_id: firstEmp?.id || "",
      period_month: selectedMonth || currentMonth,
      period_year: selectedYear || currentYear,
      payment_date: null,
      status: "DRAFT",
      base_salary,
      allowance_position,
      allowance_certification,
      allowance_tenure,
      allowance_transport,
      bonus_kpi: 500000,
      kpi_score: 85,
      allowance_overtime: 250000,
      overtime_hours: 10,
      allowance_other: 0,
      deduction_bpjs_kes: bpjs_kes,
      deduction_bpjs_tk: bpjs_tk,
      deduction_pph21: pph21,
      deduction_attendance: 0,
      deduction_other: 0,
      bank_name: empComp?.bank_name || "BCA",
      bank_account_number: empComp?.bank_account_number || "8820194821",
      bank_account_holder: empComp?.bank_account_holder || firstEmp?.full_name || "",
      payment_method: "TRANSFER",
      notes: "",
    });
    setIsSingleFormModalOpen(true);
  };

  const handleEditPayslip = (slip: PayslipRecord) => {
    setEditingPayslip(slip);
    setPayslipFormData({
      id: slip.id,
      employee_id: slip.employee_id,
      period_month: slip.period_month,
      period_year: slip.period_year,
      payment_date: slip.payment_date,
      status: slip.status,
      base_salary: slip.base_salary,
      allowance_position: slip.allowance_position,
      allowance_certification: slip.allowance_certification,
      allowance_tenure: slip.allowance_tenure,
      allowance_transport: slip.allowance_transport,
      bonus_kpi: slip.bonus_kpi,
      kpi_score: slip.kpi_score,
      allowance_overtime: slip.allowance_overtime,
      overtime_hours: slip.overtime_hours,
      allowance_other: slip.allowance_other,
      deduction_bpjs_kes: slip.deduction_bpjs_kes,
      deduction_bpjs_tk: slip.deduction_bpjs_tk,
      deduction_pph21: slip.deduction_pph21,
      deduction_attendance: slip.deduction_attendance,
      deduction_other: slip.deduction_other,
      bank_name: slip.bank_name,
      bank_account_number: slip.bank_account_number,
      bank_account_holder: slip.bank_account_holder,
      payment_method: slip.payment_method,
      notes: slip.notes || "",
    });
    setIsSingleFormModalOpen(true);
  };

  const handleEmployeeChangeInForm = (empId: string) => {
    const emp = employeeMap.get(empId);
    const empComp = salaryComponents.find((c) => c.employee_id === empId);

    const base_salary = empComp ? empComp.base_salary : (emp?.employee_type === "GURU" ? 5000000 : 4500000);
    const allowance_position = empComp ? empComp.allowance_position : 800000;
    const allowance_certification = empComp ? empComp.allowance_certification : (emp?.employee_type === "GURU" ? 500000 : 0);
    const allowance_tenure = empComp ? empComp.allowance_tenure : 150000;
    const allowance_transport = empComp ? empComp.allowance_transport : 300000;

    const bpjs_kes = Math.round((base_salary * (empComp?.bpjs_kes_rate || 1.0)) / 100);
    const bpjs_tk = Math.round((base_salary * (empComp?.bpjs_tk_rate || 2.0)) / 100);
    const pph21 = Math.round((base_salary * (empComp?.pph21_rate || 2.0)) / 100);

    setPayslipFormData((prev) => ({
      ...prev,
      employee_id: empId,
      base_salary,
      allowance_position,
      allowance_certification,
      allowance_tenure,
      allowance_transport,
      deduction_bpjs_kes: bpjs_kes,
      deduction_bpjs_tk: bpjs_tk,
      deduction_pph21: pph21,
      bank_name: empComp?.bank_name || "BCA",
      bank_account_number: empComp?.bank_account_number || "",
      bank_account_holder: empComp?.bank_account_holder || emp?.full_name || "",
    }));
  };

  const handleSubmitPayslipForm = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await savePayslip(payslipFormData);
      if (res.success) {
        showNotification("success", res.message);
        setIsSingleFormModalOpen(false);
        // Refresh local list
        if (editingPayslip) {
          setPayslips((prev) =>
            prev.map((p) =>
              p.id === editingPayslip.id
                ? {
                    ...p,
                    ...res.data,
                    employee: employeeMap.get(res.data?.employee_id || p.employee_id) || p.employee,
                  }
                : p
            )
          );
        } else if (res.data) {
          setPayslips((prev) => [
            {
              ...res.data,
              id: `pay-${Date.now()}`,
              employee: employeeMap.get(res.data?.employee_id || payslipFormData.employee_id),
            },
            ...prev,
          ]);
        }
      } else {
        showNotification("error", res.error || "Gagal menyimpan slip gaji");
      }
    });
  };

  const handleOpenEditComponent = (comp: SalaryComponentRecord) => {
    setEditingComponent(comp);
    setCompFormData({
      employee_id: comp.employee_id,
      base_salary: comp.base_salary,
      allowance_position: comp.allowance_position,
      allowance_certification: comp.allowance_certification,
      allowance_tenure: comp.allowance_tenure,
      allowance_transport: comp.allowance_transport,
      allowance_other: comp.allowance_other,
      bpjs_kes_rate: comp.bpjs_kes_rate,
      bpjs_tk_rate: comp.bpjs_tk_rate,
      pph21_rate: comp.pph21_rate,
      bank_name: comp.bank_name,
      bank_account_number: comp.bank_account_number,
      bank_account_holder: comp.bank_account_holder,
      notes: comp.notes || "",
    });
    setIsComponentModalOpen(true);
  };

  const handleSubmitComponentForm = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveSalaryComponent(compFormData);
      if (res.success) {
        showNotification("success", res.message);
        setIsComponentModalOpen(false);
        setSalaryComponents((prev) => {
          const idx = prev.findIndex((c) => c.employee_id === compFormData.employee_id);
          const updated = {
            ...res.data,
            id: editingComponent?.id || `sal-${Date.now()}`,
            employee: employeeMap.get(compFormData.employee_id || ""),
          };
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updated;
            return next;
          }
          return [...prev, updated];
        });
      } else {
        showNotification("error", res.error || "Gagal menyimpan komponen gaji");
      }
    });
  };

  const handleBatchGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await batchGeneratePayslips(batchFormData);
      if (res.success) {
        showNotification("success", res.message);
        setIsBatchModalOpen(false);
        if (res.data) {
          const mapped = res.data.map((d: any) => ({
            ...d,
            id: `pay-batch-${Date.now()}-${Math.random()}`,
            employee: employeeMap.get(d.employee_id || ""),
          }));
          setPayslips((prev) => [...mapped, ...prev]);
        }
      } else {
        showNotification("error", res.error || "Gagal generate batch payroll");
      }
    });
  };

  const handleUpdateStatus = () => {
    if (!statusTarget) return;
    startTransition(async () => {
      const res = await updatePayslipStatus(
        statusTarget.id,
        newStatus,
        newStatus === "PAID" ? paymentDateInput : undefined
      );
      if (res.success) {
        showNotification("success", res.message);
        setIsStatusModalOpen(false);
        setPayslips((prev) =>
          prev.map((p) =>
            p.id === statusTarget.id
              ? {
                  ...p,
                  status: newStatus,
                  payment_date: newStatus === "PAID" ? paymentDateInput : p.payment_date,
                }
              : p
          )
        );
      } else {
        showNotification("error", res.error || "Gagal memperbarui status");
      }
    });
  };

  const handleSendNotification = () => {
    if (!sendTarget) return;
    startTransition(async () => {
      const res = await sendPayslipDocument(sendTarget.id, sendChannel);
      if (res.success) {
        showNotification("success", res.message);
        setIsSendModalOpen(false);
        setPayslips((prev) =>
          prev.map((p) => (p.id === sendTarget.id ? { ...p, sent_at: new Date().toISOString() } : p))
        );
      } else {
        showNotification("error", res.error || "Gagal mengirim slip gaji");
      }
    });
  };

  const handleDeletePayslip = () => {
    if (!deletingPayslip) return;
    startTransition(async () => {
      const res = await deletePayslip(deletingPayslip.id);
      if (res.success) {
        showNotification("success", res.message);
        setIsDeleteModalOpen(false);
        setPayslips((prev) => prev.filter((p) => p.id !== deletingPayslip.id));
      } else {
        showNotification("error", res.error || "Gagal menghapus slip gaji");
      }
    });
  };

  // Print Handler
  const handlePrintSlip = () => {
    window.print();
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "No Slip",
      "NIK",
      "Nama Karyawan",
      "Jabatan",
      "Tipe",
      "Periode",
      "Gaji Pokok",
      "Tunjangan Tetap",
      "Bonus KPI",
      "Lembur",
      "Total Penghasilan",
      "BPJS Kesehatan",
      "BPJS Ketenagakerjaan",
      "PPh 21",
      "Total Potongan",
      "Gaji Bersih",
      "Status",
      "Tanggal Transfer",
      "Bank",
      "No Rekening",
    ];

    const rows = filteredPayslips.map((p) => {
      const emp = p.employee || employeeMap.get(p.employee_id);
      const totalAllowance =
        p.allowance_position +
        p.allowance_certification +
        p.allowance_tenure +
        p.allowance_transport +
        p.allowance_other;
      const monthLabel = MONTH_NAMES[p.period_month - 1];

      return [
        `"${p.payslip_number}"`,
        `"${emp?.nik || ""}"`,
        `"${emp?.full_name || ""}"`,
        `"${emp?.position || ""}"`,
        `"${emp?.employee_type || ""}"`,
        `"${monthLabel} ${p.period_year}"`,
        p.base_salary,
        totalAllowance,
        p.bonus_kpi,
        p.allowance_overtime,
        p.total_income,
        p.deduction_bpjs_kes,
        p.deduction_bpjs_tk,
        p.deduction_pph21,
        p.total_deductions,
        p.net_salary,
        `"${p.status}"`,
        `"${p.payment_date || "-"}"`,
        `"${p.bank_name}"`,
        `"'${p.bank_account_number}"`,
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Rekap_Payroll_JACOS_${selectedMonth ? MONTH_NAMES[selectedMonth - 1] : "Semua"}_${selectedYear}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("success", "Rekap payroll berhasil diexport ke CSV");
  };

  return (
    <div className="space-y-6">
      {/* Printable Area Styling */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-payslip,
          #printable-payslip * {
            visibility: visible;
          }
          #printable-payslip {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: auto;
            margin: 0;
            padding: 24px;
            background: white !important;
            color: black !important;
            z-index: 999999;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

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

      {/* Hero Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wide">
            <Receipt className="w-3.5 h-3.5" />
            <span>Administrasi & Penggajian JACOS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Payslip & Payroll Management
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Penyusunan slip gaji, kalkulasi gaji pokok, tunjangan terstruktur, integrasi KPI & lembur,
            dan cetak dokumen slip gaji resmi siap cetak (A5/1/2 A4).
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => setIsBatchModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-900/30 rounded-xl px-4 py-2.5 h-auto text-sm flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Batch Generate</span>
          </Button>

          <Button
            onClick={handleOpenCreateSingle}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-900/30 rounded-xl px-4 py-2.5 h-auto text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Slip Manual</span>
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
        {/* Total Payroll */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Pengeluaran Gaji
            </span>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatRupiah(dynamicStats.totalPayroll)}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {dynamicStats.totalCount} Slip
              </span>
              <span>• Rata-rata: {formatRupiah(dynamicStats.averageNet)}</span>
            </div>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{
                width: `${
                  dynamicStats.totalCount > 0
                    ? (dynamicStats.paidCount / dynamicStats.totalCount) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Sudah Ditransfer */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Sudah Ditransfer
            </span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatRupiah(dynamicStats.totalPaid)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-500 font-medium">
              <span>{dynamicStats.paidCount} Karyawan Lunas</span>
              <span>(
                {dynamicStats.totalCount > 0
                  ? Math.round((dynamicStats.paidCount / dynamicStats.totalCount) * 100)
                  : 0}
                %)
              </span>
            </div>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${
                  dynamicStats.totalCount > 0
                    ? (dynamicStats.paidCount / dynamicStats.totalCount) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Belum Ditransfer / Pending */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Menunggu Pembayaran
            </span>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {formatRupiah(dynamicStats.totalPending)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500 font-medium">
              <span>{dynamicStats.pendingCount} Slip Pending / Draft</span>
            </div>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${
                  dynamicStats.totalCount > 0
                    ? (dynamicStats.pendingCount / dynamicStats.totalCount) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Master Komponen Aktif */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Karyawan Aktif
            </span>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/50 rounded-xl text-purple-600 dark:text-purple-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {employees.length} Orang
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span>{employees.filter((e) => e.employee_type === "GURU").length} Guru</span>
              <span>•</span>
              <span>{employees.filter((e) => e.employee_type !== "GURU").length} Staf</span>
            </div>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full w-full" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Top Tab Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("payslips")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === "payslips"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Daftar Slip Gaji ({filteredPayslips.length})
            </button>
            <button
              onClick={() => setActiveTab("components")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === "components"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Master Komponen Gaji ({salaryComponents.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === "history"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Riwayat Penggajian
            </button>
          </div>

          {activeTab === "payslips" && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-md text-xs transition-colors ${
                    viewMode === "table"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
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
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Grid Cards View"
                >
                  <Receipt className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari nama karyawan, NIK, no slip..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>

          {/* Month Selector */}
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value={0}>Semua Bulan</option>
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx} value={idx + 1}>
                  Bulan {m}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value={2026}>Tahun 2026</option>
              <option value={2025}>Tahun 2025</option>
              <option value={2024}>Tahun 2024</option>
            </select>
          </div>

          {/* Status / Role Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="PAID">Sudah Ditransfer</option>
              <option value="PROCESSING">Dalam Proses</option>
              <option value="PENDING">Menunggu Approval</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* TAB 1: LISTING PAYSLIP */}
      {activeTab === "payslips" && (
        <div className="space-y-4">
          {filteredPayslips.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto">
                <Receipt className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  Tidak ada slip gaji yang sesuai filter
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Coba ubah filter pencarian atau buat slip gaji baru menggunakan tombol Batch Generate.
                </p>
              </div>
              <Button
                onClick={() => setIsBatchModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Batch Generate Slip Gaji
              </Button>
            </div>
          ) : viewMode === "table" ? (
            /* Table View */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Karyawan & NIK</th>
                      <th className="py-3.5 px-4">Periode</th>
                      <th className="py-3.5 px-4 text-right">Gaji Pokok</th>
                      <th className="py-3.5 px-4 text-right">Tunjangan</th>
                      <th className="py-3.5 px-4 text-right">Bonus/Lembur</th>
                      <th className="py-3.5 px-4 text-right">Potongan</th>
                      <th className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                        Gaji Bersih
                      </th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredPayslips.map((slip) => {
                      const emp = slip.employee || employeeMap.get(slip.employee_id);
                      const totalAllowance =
                        slip.allowance_position +
                        slip.allowance_certification +
                        slip.allowance_tenure +
                        slip.allowance_transport +
                        slip.allowance_other;
                      const totalBonus = slip.bonus_kpi + slip.allowance_overtime;
                      const statusInfo = STATUS_CONFIG[slip.status] || STATUS_CONFIG.DRAFT;
                      const StatusIcon = statusInfo.icon;

                      return (
                        <tr
                          key={slip.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
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
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                                  <span className="font-mono">{emp?.nik || "JACOS-000"}</span>
                                  <span>•</span>
                                  <span>{emp?.position || "Staff"}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="font-medium text-slate-800 dark:text-slate-200">
                              {MONTH_NAMES[slip.period_month - 1]} {slip.period_year}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              {slip.payslip_number}
                            </div>
                          </td>

                          <td className="py-4 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                            {formatRupiah(slip.base_salary)}
                          </td>

                          <td className="py-4 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                            +{formatRupiah(totalAllowance)}
                          </td>

                          <td className="py-4 px-4 text-right font-mono text-indigo-600 dark:text-indigo-400">
                            +{formatRupiah(totalBonus)}
                            {slip.kpi_score > 0 && (
                              <div className="text-[10px] text-slate-400">KPI: {slip.kpi_score}</div>
                            )}
                          </td>

                          <td className="py-4 px-4 text-right font-mono text-rose-600 dark:text-rose-400">
                            -{formatRupiah(slip.total_deductions)}
                          </td>

                          <td className="py-4 px-4 text-right">
                            <span className="font-bold font-mono text-sm px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40">
                              {formatRupiah(slip.net_salary)}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() => {
                                setStatusTarget(slip);
                                setNewStatus(slip.status);
                                setIsStatusModalOpen(true);
                              }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all hover:scale-105 ${statusInfo.badge}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                              <span>{statusInfo.label}</span>
                            </button>
                            {slip.payment_date && (
                              <div className="text-[10px] text-slate-400 mt-1">
                                {slip.payment_date}
                              </div>
                            )}
                          </td>

                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Slip Detail */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedPayslip(slip);
                                  setIsDetailModalOpen(true);
                                }}
                                className="h-8 px-2.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 text-xs rounded-lg flex items-center gap-1"
                                title="Lihat Slip Gaji & Cetak"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline">Lihat</span>
                              </Button>

                              {/* Send Slip */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSendTarget(slip);
                                  setIsSendModalOpen(true);
                                }}
                                className="h-8 w-8 p-0 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 rounded-lg"
                                title="Kirim ke Karyawan"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </Button>

                              {/* Edit Slip */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditPayslip(slip)}
                                className="h-8 w-8 p-0 bg-slate-50 hover:bg-amber-50 hover:text-amber-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 rounded-lg"
                                title="Edit Slip"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>

                              {/* Delete Slip */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setDeletingPayslip(slip);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="h-8 w-8 p-0 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 rounded-lg"
                                title="Hapus Slip"
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
              {filteredPayslips.map((slip) => {
                const emp = slip.employee || employeeMap.get(slip.employee_id);
                const statusInfo = STATUS_CONFIG[slip.status] || STATUS_CONFIG.DRAFT;
                const totalAllowance =
                  slip.allowance_position +
                  slip.allowance_certification +
                  slip.allowance_tenure +
                  slip.allowance_transport +
                  slip.allowance_other;

                return (
                  <div
                    key={slip.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                            {emp?.full_name ? emp.full_name.charAt(0) : "K"}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">
                              {emp?.full_name || "Karyawan JACOS"}
                            </h4>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                              <span className="font-mono font-semibold">{emp?.nik}</span>
                              <span>•</span>
                              <span>{emp?.position}</span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.badge}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* Period & Slip No */}
                      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between text-xs">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">
                          {MONTH_NAMES[slip.period_month - 1]} {slip.period_year}
                        </div>
                        <div className="font-mono text-slate-400">{slip.payslip_number}</div>
                      </div>

                      {/* Breakdown Details */}
                      <div className="mt-4 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span>Gaji Pokok:</span>
                          <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                            {formatRupiah(slip.base_salary)}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span>Tunjangan & Bonus:</span>
                          <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                            +{formatRupiah(totalAllowance + slip.bonus_kpi + slip.allowance_overtime)}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span>Potongan (BPJS/Pajak):</span>
                          <span className="font-mono font-medium text-rose-600 dark:text-rose-400">
                            -{formatRupiah(slip.total_deductions)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Total & Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase">
                          Gaji Bersih
                        </span>
                        <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(slip.net_salary)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => {
                            setSelectedPayslip(slip);
                            setIsDetailModalOpen(true);
                          }}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs h-9"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          Lihat Slip
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => handleEditPayslip(slip)}
                          className="h-9 px-3 border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => {
                            setSendTarget(slip);
                            setIsSendModalOpen(true);
                          }}
                          className="h-9 px-3 border-slate-200 dark:border-slate-700 rounded-xl text-xs text-emerald-600 hover:bg-emerald-50"
                          title="Kirim"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MASTER KOMPONEN GAJI KARYAWAN */}
      {activeTab === "components" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/70 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Pengaturan Master Komponen Gaji Karyawan
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Konfigurasi dasar gaji pokok, tunjangan jabatan, sertifikasi, serta rekening bank yang
                  menjadi acuan otomatis setiap kali periode baru digenerate.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((emp) => {
              const comp = salaryComponents.find((c) => c.employee_id === emp.id) || {
                id: `sal-temp-${emp.id}`,
                employee_id: emp.id,
                base_salary: emp.employee_type === "GURU" ? 5000000 : 4500000,
                allowance_position: 1000000,
                allowance_certification: emp.employee_type === "GURU" ? 500000 : 0,
                allowance_tenure: 200000,
                allowance_transport: 300000,
                allowance_other: 0,
                bpjs_kes_rate: 1.0,
                bpjs_tk_rate: 2.0,
                pph21_rate: 2.5,
                bank_name: "BCA",
                bank_account_number: "8820194821",
                bank_account_holder: emp.full_name,
                notes: "Default template",
              };

              const totalFixed =
                comp.base_salary +
                comp.allowance_position +
                comp.allowance_certification +
                comp.allowance_tenure +
                comp.allowance_transport +
                comp.allowance_other;

              return (
                <div
                  key={emp.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                          {emp.full_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                            {emp.full_name}
                          </h4>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                            <span className="font-mono">{emp.nik}</span>
                            <span>•</span>
                            <span>{emp.position}</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          emp.employee_type === "GURU"
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {emp.employee_type}
                      </span>
                    </div>

                    {/* Breakdown */}
                    <div className="mt-4 space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800/60">
                      <div className="flex justify-between pt-1 text-slate-600 dark:text-slate-400">
                        <span>Gaji Pokok:</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {formatRupiah(comp.base_salary)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 text-slate-600 dark:text-slate-400">
                        <span>Tunjangan Jabatan:</span>
                        <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                          {formatRupiah(comp.allowance_position)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 text-slate-600 dark:text-slate-400">
                        <span>Tunjangan Sertifikasi:</span>
                        <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                          {formatRupiah(comp.allowance_certification)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 text-slate-600 dark:text-slate-400">
                        <span>Masa Kerja & Transport:</span>
                        <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                          {formatRupiah(comp.allowance_tenure + comp.allowance_transport)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 text-slate-600 dark:text-slate-400">
                        <span>Rekening Bank:</span>
                        <span className="font-mono font-medium text-indigo-600 dark:text-indigo-400">
                          {comp.bank_name} {comp.bank_account_number || "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">
                        Total Tetap
                      </div>
                      <div className="font-bold font-mono text-indigo-600 dark:text-indigo-400 text-sm">
                        {formatRupiah(totalFixed)}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleOpenEditComponent(comp)}
                      className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs rounded-xl h-8 px-3"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
                      Atur Gaji
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: RIWAYAT & REKAP TAHUNAN */}
      {activeTab === "history" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <span>Riwayat Penggajian & Audit Trail Bulanan</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Laporan komprehensif riwayat transaksi slip gaji per bulan untuk pelaporan keuangan
                institusi.
              </p>
            </div>

            <Button
              onClick={handleExportCSV}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs h-9 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download Laporan Excel / CSV
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase">
                  <th className="py-3 px-4">Periode</th>
                  <th className="py-3 px-4">No Slip</th>
                  <th className="py-3 px-4">Karyawan</th>
                  <th className="py-3 px-4 text-right">Gaji Pokok</th>
                  <th className="py-3 px-4 text-right">Tunjangan</th>
                  <th className="py-3 px-4 text-right">Bonus KPI & Lembur</th>
                  <th className="py-3 px-4 text-right">Potongan</th>
                  <th className="py-3 px-4 text-right font-bold">Gaji Bersih</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {payslips.map((slip) => {
                  const emp = slip.employee || employeeMap.get(slip.employee_id);
                  const totalAllowance =
                    slip.allowance_position +
                    slip.allowance_certification +
                    slip.allowance_tenure +
                    slip.allowance_transport +
                    slip.allowance_other;

                  return (
                    <tr key={slip.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-semibold">
                        {MONTH_NAMES[slip.period_month - 1]} {slip.period_year}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{slip.payslip_number}</td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        {emp?.full_name || "Karyawan"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {formatRupiah(slip.base_salary)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600">
                        +{formatRupiah(totalAllowance)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-indigo-600">
                        +{formatRupiah(slip.bonus_kpi + slip.allowance_overtime)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-600">
                        -{formatRupiah(slip.total_deductions)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        {formatRupiah(slip.net_salary)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            STATUS_CONFIG[slip.status]?.badge
                          }`}
                        >
                          {STATUS_CONFIG[slip.status]?.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedPayslip(slip);
                            setIsDetailModalOpen(true);
                          }}
                          className="h-7 px-2 text-indigo-600 hover:bg-indigo-50 text-xs"
                        >
                          <Printer className="w-3.5 h-3.5 mr-1" />
                          Cetak Slip
                        </Button>
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
      {/* MODAL 1: DETAIL SLIP GAJI & CETAK RESMI (READY PRINT / A5 HALF A4 LAYOUT) */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Actions Bar (Hidden on Print) */}
            <div className="no-print bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-400" />
                <span className="font-semibold text-sm">Preview Dokumen Slip Gaji</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePrintSlip}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-xs h-8 px-3 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Download PDF</span>
                </Button>
                <Button
                  onClick={() => setIsDetailModalOpen(false)}
                  variant="ghost"
                  className="text-slate-400 hover:text-white h-8 w-8 p-0 rounded-lg"
                >
                  ✕
                </Button>
              </div>
            </div>

            {/* Print Container (Standard Half-A4 / A5 Clean Layout) */}
            <div
              id="printable-payslip"
              ref={printAreaRef}
              className="p-6 sm:p-8 bg-white text-slate-900 space-y-6"
            >
              {/* Slip Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl tracking-wider">
                    JACOS
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-900 uppercase">
                      Jakarta Community School
                    </h2>
                    <p className="text-xs text-slate-600">
                      Jl. Raya Pendidikan No. 42, Jakarta • Telp: (021) 7890-1234
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      https://jacos.sch.id • hr@jacos.sch.id
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold uppercase tracking-widest text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md border border-indigo-200">
                    SLIP GAJI KARYAWAN
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-800 mt-1.5">
                    No: {selectedPayslip.payslip_number}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Periode:{" "}
                    <span className="font-semibold text-slate-900">
                      {MONTH_NAMES[selectedPayslip.period_month - 1]} {selectedPayslip.period_year}
                    </span>
                  </div>
                </div>
              </div>

              {/* Employee Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-28 text-slate-500">Nama Karyawan</span>
                    <span className="font-bold text-slate-900">
                      : {selectedPayslip.employee?.full_name || "Karyawan JACOS"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">Nomor Induk (NIK)</span>
                    <span className="font-mono font-semibold text-slate-900">
                      : {selectedPayslip.employee?.nik || "JACOS-000"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">Jabatan / Peran</span>
                    <span className="font-medium text-slate-900">
                      : {selectedPayslip.employee?.position || "Staff"} (
                      {selectedPayslip.employee?.employee_type || "STAF"})
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-28 text-slate-500">Status Transfer</span>
                    <span className="font-bold text-emerald-700">
                      :{" "}
                      {selectedPayslip.status === "PAID"
                        ? "LUNAS / SUDAH DITRANSFER"
                        : selectedPayslip.status}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">Tanggal Bayar</span>
                    <span className="font-medium text-slate-900">
                      : {selectedPayslip.payment_date || "25 " + MONTH_NAMES[selectedPayslip.period_month - 1] + " " + selectedPayslip.period_year}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">Metode & Rekening</span>
                    <span className="font-medium text-slate-900">
                      : {selectedPayslip.bank_name} - {selectedPayslip.bank_account_number || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Tables: Two Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Column 1: Penghasilan */}
                <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="bg-slate-100 font-bold px-3 py-2 text-slate-900 border-b border-slate-200 flex justify-between">
                      <span>PENGHASILAN (INCOME)</span>
                      <span>JUMLAH (IDR)</span>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-700">Gaji Pokok</span>
                        <span className="font-mono font-medium">
                          {formatRupiah(selectedPayslip.base_salary)}
                        </span>
                      </div>
                      {selectedPayslip.allowance_position > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-700">Tunjangan Jabatan</span>
                          <span className="font-mono font-medium">
                            {formatRupiah(selectedPayslip.allowance_position)}
                          </span>
                        </div>
                      )}
                      {selectedPayslip.allowance_certification > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-700">Tunjangan Sertifikasi</span>
                          <span className="font-mono font-medium">
                            {formatRupiah(selectedPayslip.allowance_certification)}
                          </span>
                        </div>
                      )}
                      {selectedPayslip.allowance_tenure > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-700">Tunjangan Masa Kerja</span>
                          <span className="font-mono font-medium">
                            {formatRupiah(selectedPayslip.allowance_tenure)}
                          </span>
                        </div>
                      )}
                      {selectedPayslip.allowance_transport > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-700">Tunjangan Transport / Makan</span>
                          <span className="font-mono font-medium">
                            {formatRupiah(selectedPayslip.allowance_transport)}
                          </span>
                        </div>
                      )}
                      {selectedPayslip.bonus_kpi > 0 && (
                        <div className="flex justify-between text-indigo-900">
                          <span>
                            Bonus Kinerja {selectedPayslip.kpi_score > 0 ? `(KPI: ${selectedPayslip.kpi_score})` : ""}
                          </span>
                          <span className="font-mono font-medium">
                            {formatRupiah(selectedPayslip.bonus_kpi)}
                          </span>
                        </div>
                      )}
                      {selectedPayslip.allowance_overtime > 0 && (
                        <div className="flex justify-between text-indigo-900">
                          <span>
                            Lembur {selectedPayslip.overtime_hours > 0 ? `(${selectedPayslip.overtime_hours} Jam)` : ""}
                          </span>
                          <span className="font-mono font-medium">
                            {formatRupiah(selectedPayslip.allowance_overtime)}
                          </span>
                        </div>
                      )}
                      {selectedPayslip.allowance_other > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-700">Tunjangan Lain-lain</span>
                          <span className="font-mono font-medium">
                            {formatRupiah(selectedPayslip.allowance_other)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-emerald-50 px-3 py-2 border-t border-emerald-200 flex justify-between font-bold text-emerald-900">
                    <span>TOTAL PENGHASILAN</span>
                    <span className="font-mono">{formatRupiah(selectedPayslip.total_income)}</span>
                  </div>
                </div>

                {/* Column 2: Potongan */}
                <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="bg-slate-100 font-bold px-3 py-2 text-slate-900 border-b border-slate-200 flex justify-between">
                      <span>POTONGAN (DEDUCTIONS)</span>
                      <span>JUMLAH (IDR)</span>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-700">BPJS Kesehatan (1%)</span>
                        <span className="font-mono font-medium">
                          {formatRupiah(selectedPayslip.deduction_bpjs_kes)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-700">BPJS Ketenagakerjaan (2%)</span>
                        <span className="font-mono font-medium">
                          {formatRupiah(selectedPayslip.deduction_bpjs_tk)}
                        </span>
                      </div>
                      {selectedPayslip.deduction_pph21 > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-700">PPh 21 (Pajak Penghasilan)</span>
                          <span className="font-mono font-medium">
                            {formatRupiah(selectedPayslip.deduction_pph21)}
                          </span>
                        </div>
                      )}
                      {selectedPayslip.deduction_attendance > 0 && (
                        <div className="flex justify-between text-rose-700">
                          <span>Potongan Absensi / Keterlambatan</span>
                          <span className="font-mono font-medium">
                            {formatRupiah(selectedPayslip.deduction_attendance)}
                          </span>
                        </div>
                      )}
                      {selectedPayslip.deduction_other > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-700">Potongan Koperasi / Kasbon</span>
                          <span className="font-mono font-medium">
                            {formatRupiah(selectedPayslip.deduction_other)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-rose-50 px-3 py-2 border-t border-rose-200 flex justify-between font-bold text-rose-900">
                    <span>TOTAL POTONGAN</span>
                    <span className="font-mono">
                      {formatRupiah(selectedPayslip.total_deductions)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Salary Highlight & Terbilang Box */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-500 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    GAJI BERSIH (TAKE HOME PAY)
                  </div>
                  <div className="text-xs font-medium text-emerald-700 italic mt-0.5">
                    Terbilang: &ldquo;{angkaKeTerbilang(selectedPayslip.net_salary)}&rdquo;
                  </div>
                </div>
                <div className="text-2xl font-extrabold font-mono text-emerald-700 tracking-tight">
                  {formatRupiah(selectedPayslip.net_salary)}
                </div>
              </div>

              {/* Notes & Signatures */}
              <div className="pt-2 text-xs space-y-4">
                {selectedPayslip.notes && (
                  <div className="p-2.5 bg-slate-50 rounded-lg text-slate-600 border border-slate-200">
                    <span className="font-semibold text-slate-800">Catatan: </span>
                    {selectedPayslip.notes}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-8 pt-4 text-center">
                  <div>
                    <div className="text-slate-500 text-[11px]">Disetujui oleh:</div>
                    <div className="font-semibold text-slate-900 mt-1">HR & Finance Manager</div>
                    <div className="h-16 flex items-end justify-center">
                      <div className="w-32 border-b border-slate-400 font-semibold pb-1">
                        ( Bendahara JACOS )
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-500 text-[11px]">Diterima oleh:</div>
                    <div className="font-semibold text-slate-900 mt-1">Karyawan Bersangkutan</div>
                    <div className="h-16 flex items-end justify-center">
                      <div className="w-32 border-b border-slate-400 font-semibold pb-1">
                        ( {selectedPayslip.employee?.full_name?.split(",")[0] || "Karyawan"} )
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-center text-slate-400 italic pt-2">
                  Dokumen ini dicetak secara sah dan dienkripsi oleh Sistem HR Jakarta Community School (JACOS).
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BATCH PAYROLL GENERATOR */}
      {/* ========================================================================= */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Batch Generate Payroll
                  </h3>
                  <p className="text-xs text-slate-500">
                    Buat slip gaji massal seluruh guru/staf secara otomatis
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBatchGenerate} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Periode Bulan</Label>
                  <select
                    value={batchFormData.period_month}
                    onChange={(e) =>
                      setBatchFormData((prev) => ({
                        ...prev,
                        period_month: Number(e.target.value),
                      }))
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={idx} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Periode Tahun</Label>
                  <select
                    value={batchFormData.period_year}
                    onChange={(e) =>
                      setBatchFormData((prev) => ({
                        ...prev,
                        period_year: Number(e.target.value),
                      }))
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Target Karyawan</Label>
                <select
                  value={batchFormData.target_type}
                  onChange={(e) =>
                    setBatchFormData((prev) => ({
                      ...prev,
                      target_type: e.target.value as any,
                    }))
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Semua Karyawan Aktif ({employees.length} Orang)</option>
                  <option value="GURU">
                    Khusus Guru Saja ({employees.filter((e) => e.employee_type === "GURU").length} Orang)
                  </option>
                  <option value="STAF">
                    Khusus Staf & Admin ({employees.filter((e) => e.employee_type !== "GURU").length} Orang)
                  </option>
                </select>
              </div>

              <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Opsi Auto-Calculate Modul
                </div>

                <label className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={batchFormData.auto_calculate_kpi}
                    onChange={(e) =>
                      setBatchFormData((prev) => ({
                        ...prev,
                        auto_calculate_kpi: e.target.checked,
                      }))
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Hitung Otomatis Bonus Kinerja (Modul KPI JACOS)</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={batchFormData.auto_calculate_overtime}
                    onChange={(e) =>
                      setBatchFormData((prev) => ({
                        ...prev,
                        auto_calculate_overtime: e.target.checked,
                      }))
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Hitung Otomatis Tunjangan Lembur (Modul Overtime)</span>
                </label>
              </div>

              <div className="space-y-1.5">
                <Label>Catatan Penggajian</Label>
                <Input
                  value={batchFormData.notes}
                  onChange={(e) =>
                    setBatchFormData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Contoh: Batch Payroll September 2026"
                  className="rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl"
                >
                  {isPending ? "Memproses..." : "Eksekusi Batch Payroll"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: BUAT / EDIT SINGLE PAYSLIP */}
      {/* ========================================================================= */}
      {isSingleFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 my-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {editingPayslip ? "Edit Slip Gaji Karyawan" : "Buat Slip Gaji Baru"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sesuaikan rincian penghasilan dan potongan individu
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSingleFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPayslipForm} className="space-y-4 text-xs">
              {/* Employee & Period */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Karyawan</Label>
                  <select
                    value={payslipFormData.employee_id}
                    onChange={(e) => handleEmployeeChangeInForm(e.target.value)}
                    disabled={!!editingPayslip}
                    className="w-full h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.nik})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Bulan</Label>
                  <select
                    value={payslipFormData.period_month}
                    onChange={(e) =>
                      setPayslipFormData((prev) => ({
                        ...prev,
                        period_month: Number(e.target.value),
                      }))
                    }
                    className="w-full h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={idx} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Tahun</Label>
                  <select
                    value={payslipFormData.period_year}
                    onChange={(e) =>
                      setPayslipFormData((prev) => ({
                        ...prev,
                        period_year: Number(e.target.value),
                      }))
                    }
                    className="w-full h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>
              </div>

              {/* Penghasilan Section */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between text-xs">
                  <span className="text-emerald-700 dark:text-emerald-400">
                    Penghasilan & Tunjangan
                  </span>
                  <span className="font-mono text-emerald-600 font-bold">
                    Subtotal: {formatRupiah(formCalculations.totalIncome)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <Label className="text-[11px]">Gaji Pokok</Label>
                    <Input
                      type="number"
                      value={payslipFormData.base_salary}
                      onChange={(e) =>
                        setPayslipFormData((prev) => ({
                          ...prev,
                          base_salary: Number(e.target.value),
                        }))
                      }
                      className="h-8 text-xs font-mono rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Tunjangan Jabatan</Label>
                    <Input
                      type="number"
                      value={payslipFormData.allowance_position}
                      onChange={(e) =>
                        setPayslipFormData((prev) => ({
                          ...prev,
                          allowance_position: Number(e.target.value),
                        }))
                      }
                      className="h-8 text-xs font-mono rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Tunj. Sertifikasi</Label>
                    <Input
                      type="number"
                      value={payslipFormData.allowance_certification}
                      onChange={(e) =>
                        setPayslipFormData((prev) => ({
                          ...prev,
                          allowance_certification: Number(e.target.value),
                        }))
                      }
                      className="h-8 text-xs font-mono rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Masa Kerja & Transport</Label>
                    <Input
                      type="number"
                      value={payslipFormData.allowance_tenure + payslipFormData.allowance_transport}
                      onChange={(e) =>
                        setPayslipFormData((prev) => ({
                          ...prev,
                          allowance_transport: Number(e.target.value),
                        }))
                      }
                      className="h-8 text-xs font-mono rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <Label className="text-[11px]">Bonus Kinerja (KPI)</Label>
                    <Input
                      type="number"
                      value={payslipFormData.bonus_kpi}
                      onChange={(e) =>
                        setPayslipFormData((prev) => ({
                          ...prev,
                          bonus_kpi: Number(e.target.value),
                        }))
                      }
                      className="h-8 text-xs font-mono rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Lembur (Overtime)</Label>
                    <Input
                      type="number"
                      value={payslipFormData.allowance_overtime}
                      onChange={(e) =>
                        setPayslipFormData((prev) => ({
                          ...prev,
                          allowance_overtime: Number(e.target.value),
                        }))
                      }
                      className="h-8 text-xs font-mono rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Tunjangan Lain</Label>
                    <Input
                      type="number"
                      value={payslipFormData.allowance_other}
                      onChange={(e) =>
                        setPayslipFormData((prev) => ({
                          ...prev,
                          allowance_other: Number(e.target.value),
                        }))
                      }
                      className="h-8 text-xs font-mono rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Status Bayar</Label>
                    <select
                      value={payslipFormData.status}
                      onChange={(e) =>
                        setPayslipFormData((prev) => ({
                          ...prev,
                          status: e.target.value as any,
                        }))
                      }
                      className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="PAID">PAID</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Potongan Section */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between text-xs">
                  <span className="text-rose-700 dark:text-rose-400">Potongan Gaji</span>
                  <span className="font-mono text-rose-600 font-bold">
                    Subtotal: {formatRupiah(formCalculations.totalDeductions)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <Label className="text-[11px]">BPJS Kes (1%)</Label>
                    <Input
                      type="number"
                      value={payslipFormData.deduction_bpjs_kes}
                      onChange={(e) =>
                        setPayslipFormData((prev) => ({
                          ...prev,
                          deduction_bpjs_kes: Number(e.target.value),
                        }))
                      }
                      className="h-8 text-xs font-mono rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">BPJS TK (2%)</Label>
                    <Input
                      type="number"
                      value={payslipFormData.deduction_bpjs_tk}
                      onChange={(e) =>
                        setPayslipFormData((prev) => ({
                          ...prev,
                          deduction_bpjs_tk: Number(e.target.value),
                        }))
                      }
                      className="h-8 text-xs font-mono rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">PPh 21 (Pajak)</Label>
                    <Input
                      type="number"
                      value={payslipFormData.deduction_pph21}
                      onChange={(e) =>
                        setPayslipFormData((prev) => ({
                          ...prev,
                          deduction_pph21: Number(e.target.value),
                        }))
                      }
                      className="h-8 text-xs font-mono rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Potongan Lain</Label>
                    <Input
                      type="number"
                      value={payslipFormData.deduction_other}
                      onChange={(e) =>
                        setPayslipFormData((prev) => ({
                          ...prev,
                          deduction_other: Number(e.target.value),
                        }))
                      }
                      className="h-8 text-xs font-mono rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Total Take Home Pay Highlight */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 uppercase">
                    Take Home Pay (Gaji Bersih)
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 italic">
                    {formCalculations.terbilang}
                  </div>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                  {formatRupiah(formCalculations.netSalary)}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSingleFormModalOpen(false)}
                  className="rounded-xl h-9 text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-9 text-xs font-medium"
                >
                  {isPending ? "Menyimpan..." : "Simpan Slip Gaji"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ATUR MASTER KOMPONEN GAJI PER KARYAWAN */}
      {/* ========================================================================= */}
      {isComponentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-xl">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Atur Master Gaji: {editingComponent?.employee?.full_name || "Karyawan"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Konfigurasi gaji pokok, tunjangan rutin, dan akun transfer
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsComponentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitComponentForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Gaji Pokok (Fixed)</Label>
                  <Input
                    type="number"
                    value={compFormData.base_salary}
                    onChange={(e) =>
                      setCompFormData((prev) => ({
                        ...prev,
                        base_salary: Number(e.target.value),
                      }))
                    }
                    className="h-9 font-mono rounded-xl mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Tunjangan Jabatan</Label>
                  <Input
                    type="number"
                    value={compFormData.allowance_position}
                    onChange={(e) =>
                      setCompFormData((prev) => ({
                        ...prev,
                        allowance_position: Number(e.target.value),
                      }))
                    }
                    className="h-9 font-mono rounded-xl mt-1 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Tunj. Sertifikasi</Label>
                  <Input
                    type="number"
                    value={compFormData.allowance_certification}
                    onChange={(e) =>
                      setCompFormData((prev) => ({
                        ...prev,
                        allowance_certification: Number(e.target.value),
                      }))
                    }
                    className="h-9 font-mono rounded-xl mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Tunj. Masa Kerja</Label>
                  <Input
                    type="number"
                    value={compFormData.allowance_tenure}
                    onChange={(e) =>
                      setCompFormData((prev) => ({
                        ...prev,
                        allowance_tenure: Number(e.target.value),
                      }))
                    }
                    className="h-9 font-mono rounded-xl mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Tunj. Transport</Label>
                  <Input
                    type="number"
                    value={compFormData.allowance_transport}
                    onChange={(e) =>
                      setCompFormData((prev) => ({
                        ...prev,
                        allowance_transport: Number(e.target.value),
                      }))
                    }
                    className="h-9 font-mono rounded-xl mt-1 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <Label className="text-[11px]">BPJS Kes (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={compFormData.bpjs_kes_rate}
                    onChange={(e) =>
                      setCompFormData((prev) => ({
                        ...prev,
                        bpjs_kes_rate: Number(e.target.value),
                      }))
                    }
                    className="h-8 font-mono rounded-lg mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">BPJS TK (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={compFormData.bpjs_tk_rate}
                    onChange={(e) =>
                      setCompFormData((prev) => ({
                        ...prev,
                        bpjs_tk_rate: Number(e.target.value),
                      }))
                    }
                    className="h-8 font-mono rounded-lg mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">PPh 21 (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={compFormData.pph21_rate}
                    onChange={(e) =>
                      setCompFormData((prev) => ({
                        ...prev,
                        pph21_rate: Number(e.target.value),
                      }))
                    }
                    className="h-8 font-mono rounded-lg mt-1 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Nama Bank</Label>
                  <Input
                    value={compFormData.bank_name}
                    onChange={(e) =>
                      setCompFormData((prev) => ({
                        ...prev,
                        bank_name: e.target.value,
                      }))
                    }
                    placeholder="BCA / Mandiri / BNI / BRI"
                    className="h-9 rounded-xl mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Nomor Rekening</Label>
                  <Input
                    value={compFormData.bank_account_number}
                    onChange={(e) =>
                      setCompFormData((prev) => ({
                        ...prev,
                        bank_account_number: e.target.value,
                      }))
                    }
                    placeholder="8820194821"
                    className="h-9 font-mono rounded-xl mt-1 text-xs"
                  />
                </div>
              </div>

              {/* Estimate Preview */}
              <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-200">
                    Estimasi Take Home Pay Tetap:
                  </div>
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-400 italic">
                    {compCalculations.terbilang}
                  </div>
                </div>
                <div className="font-bold font-mono text-base text-indigo-700 dark:text-indigo-300">
                  {formatRupiah(compCalculations.estTakeHome)}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsComponentModalOpen(false)}
                  className="rounded-xl h-9 text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-9 text-xs font-medium"
                >
                  {isPending ? "Menyimpan..." : "Simpan Master Gaji"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: UPDATE STATUS PEMBAYARAN */}
      {/* ========================================================================= */}
      {isStatusModalOpen && statusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Update Status Pembayaran
            </h3>
            <p className="text-xs text-slate-500">
              Slip Gaji: <span className="font-mono font-semibold">{statusTarget.payslip_number}</span>
              <br />
              Karyawan:{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {statusTarget.employee?.full_name}
              </span>
            </p>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label>Status Baru</Label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as PayslipStatus)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                >
                  <option value="PAID">PAID - Sudah Ditransfer (Lunas)</option>
                  <option value="PROCESSING">PROCESSING - Dalam Proses Transfer</option>
                  <option value="PENDING">PENDING - Menunggu Persetujuan</option>
                  <option value="DRAFT">DRAFT - Draft Penggajian</option>
                </select>
              </div>

              {newStatus === "PAID" && (
                <div className="space-y-1">
                  <Label>Tanggal Transfer</Label>
                  <Input
                    type="date"
                    value={paymentDateInput}
                    onChange={(e) => setPaymentDateInput(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => setIsStatusModalOpen(false)}
                className="rounded-xl text-xs h-9"
              >
                Batal
              </Button>
              <Button
                onClick={handleUpdateStatus}
                disabled={isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs h-9 font-medium"
              >
                {isPending ? "Memproses..." : "Update Status"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: KIRIM NOTIFIKASI SLIP (EMAIL / WHATSAPP) */}
      {/* ========================================================================= */}
      {isSendModalOpen && sendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-xl">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Kirim Dokumen Slip Gaji
                </h3>
                <p className="text-xs text-slate-500">Kirim slip gaji terenkripsi ke karyawan</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Penerima:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {sendTarget.employee?.full_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {sendTarget.employee?.email || "rina.kartika@jacos.sch.id"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">WhatsApp:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {sendTarget.employee?.phone || "081234567890"}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <Label>Pilih Saluran Pengiriman</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSendChannel("EMAIL")}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-medium transition-all ${
                    sendChannel === "EMAIL"
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>Email Resmi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSendChannel("WHATSAPP")}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-medium transition-all ${
                    sendChannel === "WHATSAPP"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-semibold"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => setIsSendModalOpen(false)}
                className="rounded-xl text-xs h-9"
              >
                Batal
              </Button>
              <Button
                onClick={handleSendNotification}
                disabled={isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs h-9 font-medium"
              >
                {isPending ? "Mengirim..." : "Kirim Sekarang"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: KONFIRMASI HAPUS SLIP */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && deletingPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Hapus Slip Gaji Ini?
              </h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus slip gaji{" "}
                <span className="font-mono font-semibold">{deletingPayslip.payslip_number}</span>{" "}
                milik{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {deletingPayslip.employee?.full_name}
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
                onClick={handleDeletePayslip}
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
